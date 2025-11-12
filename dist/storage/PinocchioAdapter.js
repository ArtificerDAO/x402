"use strict";
/**
 * Pinocchio Adapter for large data storage on Solana
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinocchioAdapter = exports.POST_CHUNK_DISCRIMINATOR = exports.PINOCCHIO_PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
const storage_1 = require("../utils/storage");
const bs58_1 = __importDefault(require("bs58"));
/**
 * Pinocchio Program ID
 */
exports.PINOCCHIO_PROGRAM_ID = '4jB7tZybufNfgs8HRj9DiSCMYfEqb8jWkxKcnZnA1vBt';
/**
 * Pinocchio instruction discriminator for post_hybrid_chunk
 */
exports.POST_CHUNK_DISCRIMINATOR = 0x04;
/**
 * Pinocchio Adapter for chunked data storage
 */
class PinocchioAdapter {
    constructor(config) {
        this.config = config;
        this.connection = new web3_js_1.Connection(config.rpcUrl, 'confirmed');
    }
    /**
     * Store large data using Pinocchio protocol
     */
    async storeData(data, compression = false) {
        // 1. Serialize data
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        let dataBuffer = Buffer.from(jsonString, 'utf-8');
        // 2. Compress if requested
        if (compression) {
            dataBuffer = await (0, storage_1.compressData)(dataBuffer);
        }
        // 3. Generate session ID
        const sessionId = (0, storage_1.generateSessionId)();
        // 4. Chunk data
        const chunks = (0, storage_1.chunkData)(dataBuffer, storage_1.PINOCCHIO_CHUNK_SIZE);
        // 5. Create session account
        const sessionPubkey = await this.createSession(sessionId, chunks.length);
        // 6. Post chunks
        for (let i = 0; i < chunks.length; i++) {
            await this.postChunk(sessionId, i, chunks[i]);
            console.log(`Posted chunk ${i + 1}/${chunks.length}`);
        }
        // 7. Finalize session (optional, depends on Pinocchio implementation)
        // await this.finalizeSession(sessionPubkey);
        console.log(`Data stored in Pinocchio session: ${sessionPubkey}`);
        return sessionPubkey;
    }
    /**
     * Read data from Pinocchio session
     */
    async readData(sessionPubkey) {
        const sessionKey = new web3_js_1.PublicKey(sessionPubkey);
        // 1. Fetch session account metadata
        const sessionAccountInfo = await this.connection.getAccountInfo(sessionKey);
        if (!sessionAccountInfo) {
            throw new Error(`Pinocchio session account not found: ${sessionPubkey}`);
        }
        const sessionData = sessionAccountInfo.data;
        // 2. Parse session metadata
        // Structure: owner(32) + session_id(16) + total_chunks(4) + merkle_root(32) + status(1) = 85 bytes
        if (sessionData.length < 85) {
            throw new Error(`Invalid session account size: ${sessionData.length}`);
        }
        let offset = 0;
        const owner = new web3_js_1.PublicKey(sessionData.subarray(offset, offset + 32));
        offset += 32;
        const sessionId = sessionData.subarray(offset, offset + 16);
        offset += 16;
        const totalChunks = sessionData.readUInt32LE(offset);
        offset += 4;
        const merkleRoot = sessionData.subarray(offset, offset + 32);
        offset += 32;
        const status = sessionData.readUInt8(offset);
        console.log(`Reading Pinocchio session: ${totalChunks} chunks, status: ${status}`);
        // 3. Fetch transaction signatures for the session account
        const signatures = await this.connection.getSignaturesForAddress(sessionKey, { limit: 1000 });
        // 4. Read chunks from transaction instruction data
        const chunkMap = new Map();
        for (const sigInfo of signatures) {
            const tx = await this.connection.getTransaction(sigInfo.signature, {
                maxSupportedTransactionVersion: 0,
            });
            if (!tx?.transaction?.message)
                continue;
            const instructions = tx.transaction.message.compiledInstructions || [];
            for (const ix of instructions) {
                const rawData = typeof ix.data === 'string' ? bs58_1.default.decode(ix.data) : ix.data;
                const data = Buffer.from(rawData);
                // Check for post_hybrid_chunk discriminator (0x04)
                if (data.length < 22 || data[0] !== exports.POST_CHUNK_DISCRIMINATOR) {
                    continue;
                }
                try {
                    let chunkOffset = 1; // Skip discriminator
                    // Skip session_id (16 bytes)
                    chunkOffset += 16;
                    // Read chunk_index (u32)
                    const chunkIndex = data.readUInt32LE(chunkOffset);
                    chunkOffset += 4;
                    // Skip method (u8)
                    chunkOffset += 1;
                    // Rest is RAW chunk data
                    const chunkData = Buffer.from(data.subarray(chunkOffset));
                    chunkMap.set(chunkIndex, chunkData);
                }
                catch (error) {
                    console.error('Failed to parse chunk:', error);
                }
            }
        }
        if (chunkMap.size === 0) {
            throw new Error('No chunks found in Pinocchio session');
        }
        if (chunkMap.size !== totalChunks) {
            console.warn(`Warning: Expected ${totalChunks} chunks, found ${chunkMap.size}`);
        }
        // 5. Reconstruct data from chunks in order
        const sortedIndices = Array.from(chunkMap.keys()).sort((a, b) => a - b);
        const chunksArray = sortedIndices.map(idx => chunkMap.get(idx));
        let reconstructedData = (0, storage_1.reconstructData)(chunksArray);
        // 6. Check for base64 encoding (from file uploads)
        try {
            const firstByte = reconstructedData[0];
            if (firstByte >= 65 || firstByte === 47 || firstByte === 43) {
                const sample = reconstructedData.slice(0, 100).toString('ascii');
                const isBase64 = /^[A-Za-z0-9+/=]+$/.test(sample.replace(/\s/g, ''));
                if (isBase64) {
                    const decoded = Buffer.from(reconstructedData.toString('ascii'), 'base64');
                    reconstructedData = decoded;
                }
            }
        }
        catch (error) {
            // Not base64, continue
        }
        // 7. Check for compression header (0x01)
        if (reconstructedData.length >= 1 && reconstructedData[0] === 0x01) {
            // Data is compressed, decompress
            const compressed = reconstructedData.slice(1);
            reconstructedData = await (0, storage_1.decompressData)(compressed);
        }
        return reconstructedData;
    }
    /**
     * Read data and parse as JSON
     */
    async readJSON(sessionPubkey) {
        const dataBuffer = await this.readData(sessionPubkey);
        const jsonString = dataBuffer.toString('utf-8');
        return JSON.parse(jsonString);
    }
    /**
     * Create a Pinocchio session account
     */
    async createSession(sessionId, totalChunks) {
        // Derive session PDA
        const [sessionPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('pinocchio_session'),
            this.config.wallet.publicKey.toBuffer(),
            sessionId
        ], new web3_js_1.PublicKey(exports.PINOCCHIO_PROGRAM_ID));
        // Create session account instruction
        // Note: This is a placeholder. Actual implementation depends on Pinocchio program
        // You may need to call a specific instruction to initialize the session
        console.log(`Created Pinocchio session: ${sessionPda.toBase58()}`);
        return sessionPda.toBase58();
    }
    /**
     * Post a chunk to Pinocchio session
     */
    async postChunk(sessionId, chunkIndex, chunkData) {
        // Build instruction data:
        // discriminator(1) + session_id(16) + chunk_index(4) + method(1) + chunk_data
        const instructionData = Buffer.alloc(1 + 16 + 4 + 1 + chunkData.length);
        let offset = 0;
        // Discriminator (0x04 for post_hybrid_chunk)
        instructionData[offset] = exports.POST_CHUNK_DISCRIMINATOR;
        offset += 1;
        // Session ID (16 bytes)
        sessionId.copy(instructionData, offset);
        offset += 16;
        // Chunk index (u32 little-endian)
        instructionData.writeUInt32LE(chunkIndex, offset);
        offset += 4;
        // Method (u8) - 0 for raw, 1 for compressed
        instructionData[offset] = 0;
        offset += 1;
        // Chunk data
        chunkData.copy(instructionData, offset);
        // Derive session PDA
        const [sessionPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('pinocchio_session'),
            this.config.wallet.publicKey.toBuffer(),
            sessionId
        ], new web3_js_1.PublicKey(exports.PINOCCHIO_PROGRAM_ID));
        // Create instruction
        const instruction = new web3_js_1.TransactionInstruction({
            keys: [
                { pubkey: this.config.wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: sessionPda, isSigner: false, isWritable: true },
                { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false }
            ],
            programId: new web3_js_1.PublicKey(exports.PINOCCHIO_PROGRAM_ID),
            data: instructionData
        });
        // Create and send transaction
        const transaction = new web3_js_1.Transaction().add(instruction);
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
        transaction.feePayer = this.config.wallet.publicKey;
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        const signedTx = await this.config.wallet.signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true, maxRetries: 0 });
        await this.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
        return signature;
    }
    /**
     * Get session metadata
     */
    async getSessionMetadata(sessionPubkey) {
        const sessionKey = new web3_js_1.PublicKey(sessionPubkey);
        const sessionAccountInfo = await this.connection.getAccountInfo(sessionKey);
        if (!sessionAccountInfo) {
            throw new Error(`Session account not found: ${sessionPubkey}`);
        }
        const sessionData = sessionAccountInfo.data;
        let offset = 0;
        const owner = new web3_js_1.PublicKey(sessionData.subarray(offset, offset + 32));
        offset += 32;
        const sessionId = sessionData.subarray(offset, offset + 16);
        offset += 16;
        const totalChunks = sessionData.readUInt32LE(offset);
        offset += 4;
        const merkleRoot = sessionData.subarray(offset, offset + 32);
        offset += 32;
        const status = sessionData.readUInt8(offset);
        // Derive storage account
        const [storageAccount] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('hybrid_storage'), owner.toBuffer()], new web3_js_1.PublicKey(exports.PINOCCHIO_PROGRAM_ID));
        return {
            owner: owner.toBase58(),
            sessionId: sessionId.toString('hex'),
            totalChunks,
            merkleRoot: merkleRoot.toString('hex'),
            status: status === 1 ? 'finalized' : 'active',
            storageAccount: storageAccount.toBase58()
        };
    }
}
exports.PinocchioAdapter = PinocchioAdapter;
//# sourceMappingURL=PinocchioAdapter.js.map