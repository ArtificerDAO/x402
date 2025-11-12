"use strict";
/**
 * Large Data Storage using Pinocchio
 *
 * Handles storage and retrieval of data > 50 bytes using IQLabs' Pinocchio API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LargeDataStorage = void 0;
const IQLabsAPI_1 = require("../api/IQLabsAPI");
// Compression threshold in bytes
// Data smaller than this won't be compressed due to gzip header overhead
const COMPRESSION_THRESHOLD = 50;
// Marker to indicate compressed data
const COMPRESSION_MARKER = 'GZIP_COMPRESSED:';
class LargeDataStorage {
    constructor(connection, wallet) {
        this.api = new IQLabsAPI_1.IQLabsAPI(connection);
        this.wallet = wallet;
    }
    /**
     * Store large data using Pinocchio with smart compression
     */
    async storeLargeData(data, useSequential = false) {
        const startTime = Date.now();
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║  STORING LARGE DATA VIA PINOCCHIO                      ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        const originalSize = data.length;
        console.log(` Original data size: ${originalSize} bytes`);
        console.log(`👛 Wallet: ${this.wallet.publicKey.toBase58()}`);
        console.log(`  Mode: ${useSequential ? 'Sequential' : 'Parallel'}`);
        // Chunk the data ourselves into 675-byte pieces!
        // CRITICAL: Do NOT base64 encode - send raw string chunks, API will base64 encode each!
        const CHUNK_SIZE = 675; // Optimal size per IQLabs dev
        const chunks = [];
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            chunks.push(data.substring(i, i + CHUNK_SIZE));
        }
        console.log(` Chunked data into ${chunks.length} pieces (${CHUNK_SIZE} bytes each)`);
        console.log(`   Total size: ${originalSize} bytes`);
        console.log(`   API will base64 encode each chunk`);
        const compressed = false;
        const compressedSize = originalSize;
        console.log('');
        // Step 1: Create session using PINOCCHIO endpoint (most up-to-date!)
        // IQ Team: "Use the pinocchio routes. They are the most up to date"
        console.log(' Step 1/4: Creating Pinocchio session (5k lamports/tx)...');
        const session = await this.api.createPinocchioSession({
            pubkey: this.wallet.publicKey.toBase58(),
            text: data, // Send full text
            chunks, // Send pre-chunked array (675 bytes per chunk)
            chunkSize: CHUNK_SIZE // 675 bytes (optimal per IQ team)
        });
        const sessionPubkey = session.sessionPubkey || session.sessionId;
        console.log(`   Session ID: ${session.sessionId}`);
        console.log(`   Session PDA: ${sessionPubkey}`);
        console.log(`   Total chunks: ${session.totalChunks}`);
        console.log(`   Merkle root: ${session.merkleRoot.substring(0, 16)}...`);
        console.log('');
        const signatures = [];
        // Step 2: Create session on-chain
        console.log(' Step 2/4: Creating session on-chain...');
        try {
            const createSig = await this.api.signAndSendTransaction(session.createSessionTransaction, this.wallet);
            signatures.push(createSig);
            console.log(`    Session created: ${createSig.substring(0, 16)}...`);
        }
        catch (error) {
            console.error('    Failed to create session:', error.message);
            throw error;
        }
        console.log('');
        // Step 3: Initialize storage account (CRITICAL for first-time users!)
        // The storage account is created once per user and persists
        // WITHOUT this, chunks fail with error 3012 "Storage not initialized"!
        if (session.initStorageTransaction) {
            console.log(' Step 3: Initializing storage account...');
            try {
                const initSig = await this.api.signAndSendTransaction(session.initStorageTransaction, this.wallet);
                signatures.push(initSig);
                console.log(`    Storage initialized: ${initSig.substring(0, 16)}...`);
                console.log('');
            }
            catch (error) {
                // Check if it's the "already exists" error (Custom:0)
                const errorStr = error.message || '';
                const isAlreadyExists = errorStr.includes('0x0') ||
                    errorStr.includes('Custom":0') ||
                    errorStr.includes('already in use') ||
                    errorStr.includes('already exists');
                if (isAlreadyExists) {
                    console.log('   ℹ  Storage already initialized (continuing...)');
                    console.log('');
                }
                else {
                    // This is a REAL error - we should fail!
                    console.error(`    Storage init FAILED: ${errorStr.substring(0, 100)}...`);
                    console.error('     Chunks will likely fail with error 3012!');
                    console.log('');
                    throw new Error(`Storage initialization failed: ${errorStr}`);
                }
            }
        }
        // Step 4: Upload chunks
        console.log(` Step 4/5: Uploading ${session.totalChunks} chunks...`);
        try {
            let chunkSigs = [];
            // Extract transaction from chunk objects
            const chunkTxs = session.chunkTransactions.map((chunk) => chunk.transaction || chunk);
            if (useSequential) {
                // SEQUENTIAL mode: Send one transaction at a time, wait for confirmation
                // Following IQ.md instructions exactly
                console.log('   Mode: Sequential (one-by-one)');
                chunkSigs = await this.api.signAndSendTransactionsSequential(chunkTxs, this.wallet);
            }
            else {
                // PARALLEL mode: Send multiple transactions at once for faster uploads
                // With Helius RPC (1000+ req/s), we can safely send multiple txs at once
                // Batch size of 10 = good balance between speed and safety
                console.log('   Mode: Parallel (batched)');
                chunkSigs = await this.api.signAndSendTransactionsParallel(chunkTxs, this.wallet, 10 // Batch size: send 10 transactions in parallel at a time
                );
            }
            signatures.push(...chunkSigs);
            console.log(`    All chunks uploaded!`);
        }
        catch (error) {
            console.error('    Failed to upload chunks:', error.message);
            throw error;
        }
        console.log('');
        // Step 5: Finalize
        console.log(' Step 5/5: Finalizing session...');
        try {
            const finalizeSig = await this.api.signAndSendTransaction(session.finalizeTransaction, this.wallet);
            signatures.push(finalizeSig);
            console.log(`    Session finalized: ${finalizeSig.substring(0, 16)}...`);
        }
        catch (error) {
            console.error('    Failed to finalize session:', error.message);
            throw error;
        }
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('');
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║   UPLOAD COMPLETE!                                   ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`   Session PDA: ${sessionPubkey}`);
        console.log(`   Total signatures: ${signatures.length}`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   Speed: ${(compressedSize / 1024 / parseFloat(duration)).toFixed(2)} KB/s`);
        if (compressed) {
            console.log(`   Compression: ${originalSize} → ${compressedSize} bytes (${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction)`);
        }
        console.log('');
        // Calculate cost (5000 lamports per transaction)
        const totalLamports = signatures.length * 5000;
        const costSOL = totalLamports / 1e9;
        const costPerMB = (costSOL / originalSize) * 1e6;
        return {
            sessionPubkey,
            sessionId: session.sessionId,
            size: compressedSize,
            chunks: session.totalChunks,
            signatures,
            merkleRoot: session.merkleRoot,
            compressed,
            originalSize,
            compressedSize,
            cost: costSOL,
            costPerMB
        };
    }
    /**
     * Retrieve large data from Hybrid V2 with retry logic
     */
    async retrieveLargeData(sessionPubkey, maxRetries = 5, retryDelay = 2000) {
        const startTime = Date.now();
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║  RETRIEVING LARGE DATA FROM HYBRID V2                  ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log(` Session PDA: ${sessionPubkey}`);
        console.log('');
        // Retry loop for finalization timing
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Get metadata first to check status
                console.log(` Getting session metadata (attempt ${attempt}/${maxRetries})...`);
                const metadata = await this.api.getSessionMetadata(sessionPubkey);
                console.log(`   Status: ${metadata.status}`);
                console.log(`   Total chunks: ${metadata.totalChunks}`);
                console.log(`   Owner: ${metadata.owner}`);
                // Check if finalized
                if (metadata.status !== 'finalized') {
                    if (attempt < maxRetries) {
                        console.log(`    Session not finalized yet, waiting ${retryDelay / 1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                    else {
                        throw new Error(`Session not finalized after ${maxRetries} attempts`);
                    }
                }
                console.log('');
                // Download data
                console.log(' Downloading data...');
                const rawData = await this.api.downloadSession(sessionPubkey);
                // API returns plain text (chunks were base64 decoded and reassembled)
                console.log(' Converting to UTF-8...');
                const finalData = rawData.toString('utf-8');
                console.log(`    Downloaded: ${finalData.length} bytes`);
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log('');
                console.log('╔════════════════════════════════════════════════════════╗');
                console.log('║   RETRIEVAL COMPLETE!                                ║');
                console.log('╚════════════════════════════════════════════════════════╝');
                console.log('');
                console.log(`   Final data size: ${finalData.length} bytes`);
                console.log(`   Duration: ${duration}s`);
                console.log(`   Speed: ${(finalData.length / 1024 / parseFloat(duration)).toFixed(2)} KB/s`);
                console.log('');
                return {
                    data: finalData,
                    size: finalData.length,
                    metadata
                };
            }
            catch (error) {
                if (attempt < maxRetries) {
                    console.log(`     Attempt ${attempt} failed: ${error?.message}`);
                    console.log(`   Retrying in ${retryDelay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
                else {
                    throw error;
                }
            }
        }
        throw new Error(`Failed to retrieve data after ${maxRetries} attempts`);
    }
    /**
     * Check if a session is finalized
     */
    async isSessionFinalized(sessionPubkey) {
        try {
            const metadata = await this.api.getSessionMetadata(sessionPubkey);
            return metadata.status === 'finalized';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get session status
     */
    async getSessionStatus(sessionPubkey) {
        const metadata = await this.api.getSessionMetadata(sessionPubkey);
        return {
            status: metadata.status,
            totalChunks: metadata.totalChunks,
            owner: metadata.owner
        };
    }
}
exports.LargeDataStorage = LargeDataStorage;
//# sourceMappingURL=LargeDataStorage.js.map