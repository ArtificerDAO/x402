"use strict";
/**
 * IQDB Adapter for on-chain storage operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IQDBAdapter = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const uuid_1 = require("uuid");
const schemas_1 = require("../config/schemas");
const storage_1 = require("../utils/storage");
/**
 * IQDB Adapter class for table operations
 */
class IQDBAdapter {
    constructor(config) {
        this.program = null;
        this.config = config;
        this.connection = new web3_js_1.Connection(config.rpcUrl, 'confirmed');
    }
    /**
     * Initialize the adapter and create program instance
     */
    async initialize() {
        const provider = new anchor_1.AnchorProvider(this.connection, this.config.wallet, { commitment: 'confirmed' });
        this.program = new anchor_1.Program(this.config.idl, new web3_js_1.PublicKey(this.config.programId), provider);
    }
    /**
     * Get writer context for operations
     */
    getWriterContext() {
        return {
            connection: this.connection,
            wallet: this.config.wallet,
            idl: this.config.idl,
            program: this.program || undefined
        };
    }
    /**
     * Get reader parameters
     */
    getReaderParams() {
        return {
            userPublicKey: this.config.wallet.publicKey.toBase58(),
            idl: this.config.idl,
            rpcUrl: this.config.rpcUrl
        };
    }
    /**
     * Create a table with the given schema
     */
    async createTable(schema) {
        if (!this.program) {
            throw new Error('Adapter not initialized. Call initialize() first.');
        }
        console.log(`Creating table: ${schema.tableName}`);
        // Derive PDAs
        const [rootPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-root'),
            this.config.wallet.publicKey.toBuffer()
        ], new web3_js_1.PublicKey(this.config.programId));
        const tableNameBuffer = Buffer.from(schema.tableName, 'utf-8');
        const [tablePda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-table'),
            this.config.wallet.publicKey.toBuffer(),
            tableNameBuffer
        ], new web3_js_1.PublicKey(this.config.programId));
        // Create table instruction
        const tx = await this.program.methods
            .createExtTable(schema.tableName, schema.columns, schema.idColumn, schema.extKeys || [])
            .accounts({
            signer: this.config.wallet.publicKey,
            root: rootPda,
            table: tablePda,
            systemProgram: new web3_js_1.PublicKey('11111111111111111111111111111111')
        })
            .transaction();
        // Sign and send
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
        tx.feePayer = this.config.wallet.publicKey;
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        const signedTx = await this.config.wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: false, maxRetries: 3 });
        await this.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
        console.log(`Table created: ${schema.tableName} (signature: ${signature})`);
        return signature;
    }
    /**
     * Write a row to a table
     */
    async writeRow(tableName, row, validateSchema = true) {
        if (!this.program) {
            throw new Error('Adapter not initialized');
        }
        // Validate row if requested
        if (validateSchema) {
            const validation = (0, schemas_1.validateRow)(tableName, row);
            if (!validation.valid) {
                throw new Error(`Row validation failed: ${validation.errors.join(', ')}`);
            }
        }
        // Add timestamps if not present
        if (!row.created_at) {
            row.created_at = (0, storage_1.formatTimestamp)();
        }
        if (!row.updated_at) {
            row.updated_at = (0, storage_1.formatTimestamp)();
        }
        // Ensure ID exists
        if (!row.id) {
            row.id = (0, uuid_1.v4)();
        }
        // Serialize to JSON
        const rowJson = JSON.stringify(row);
        // Validate JSON
        const jsonValidation = (0, storage_1.validateJSON)(rowJson);
        if (!jsonValidation.valid) {
            throw new Error(`Invalid JSON: ${jsonValidation.error}`);
        }
        // Derive PDAs
        const [rootPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-root'),
            this.config.wallet.publicKey.toBuffer()
        ], new web3_js_1.PublicKey(this.config.programId));
        const tableNameBuffer = Buffer.from(tableName, 'utf-8');
        const [tablePda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-table'),
            this.config.wallet.publicKey.toBuffer(),
            tableNameBuffer
        ], new web3_js_1.PublicKey(this.config.programId));
        const [txRefPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-txref'),
            this.config.wallet.publicKey.toBuffer(),
            tableNameBuffer
        ], new web3_js_1.PublicKey(this.config.programId));
        // Create write_data instruction
        const tx = await this.program.methods
            .writeData(tableNameBuffer, rowJson)
            .accounts({
            signer: this.config.wallet.publicKey,
            root: rootPda,
            table: tablePda,
            txRef: txRefPda,
            systemProgram: new web3_js_1.PublicKey('11111111111111111111111111111111')
        })
            .transaction();
        // Sign and send
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
        tx.feePayer = this.config.wallet.publicKey;
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        const signedTx = await this.config.wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true, maxRetries: 0 });
        await this.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
        return signature;
    }
    /**
     * Write multiple rows in batch
     */
    async batchWriteRows(tableName, rows, options = {}) {
        const { parallel = true, batchSize = 10 } = options;
        const signatures = [];
        if (parallel) {
            // Write in batches with parallel execution
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const batchSignatures = await Promise.all(batch.map(row => this.writeRow(tableName, row)));
                signatures.push(...batchSignatures);
            }
        }
        else {
            // Sequential write
            for (const row of rows) {
                const signature = await this.writeRow(tableName, row);
                signatures.push(signature);
            }
        }
        return signatures;
    }
    /**
     * Read rows from a table
     * Note: This is a placeholder. Actual implementation should use
     * the readRowsByTable function from IQDB SDK
     */
    async readRows(tableName, options = {}) {
        // Import the actual reader function from IQDB SDK
        // This is a simplified version
        throw new Error('Not implemented. Use IQDB reader functions directly.');
    }
    /**
     * Update a row by pushing an instruction
     */
    async updateRow(tableName, targetTxSignature, updates) {
        if (!this.program) {
            throw new Error('Adapter not initialized');
        }
        // Add updated timestamp
        updates.updated_at = (0, storage_1.formatTimestamp)();
        const updatesJson = JSON.stringify(updates);
        // Derive PDAs
        const [rootPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-root'),
            this.config.wallet.publicKey.toBuffer()
        ], new web3_js_1.PublicKey(this.config.programId));
        const tableNameBuffer = Buffer.from(tableName, 'utf-8');
        const [tablePda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-table'),
            this.config.wallet.publicKey.toBuffer(),
            tableNameBuffer
        ], new web3_js_1.PublicKey(this.config.programId));
        const [txRefPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-txref'),
            this.config.wallet.publicKey.toBuffer(),
            tableNameBuffer
        ], new web3_js_1.PublicKey(this.config.programId));
        const [instructionTablePda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-instruction-table'),
            this.config.wallet.publicKey.toBuffer()
        ], new web3_js_1.PublicKey(this.config.programId));
        // Create database_instruction
        const tx = await this.program.methods
            .databaseInstruction(tableNameBuffer, targetTxSignature, updatesJson)
            .accounts({
            signer: this.config.wallet.publicKey,
            root: rootPda,
            table: tablePda,
            instructionTable: instructionTablePda,
            txRef: txRefPda,
            systemProgram: new web3_js_1.PublicKey('11111111111111111111111111111111')
        })
            .transaction();
        // Sign and send
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
        tx.feePayer = this.config.wallet.publicKey;
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        const signedTx = await this.config.wallet.signTransaction(tx);
        const signature = await this.connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true, maxRetries: 0 });
        await this.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
        return signature;
    }
    /**
     * Delete a row by pushing a delete instruction
     */
    async deleteRow(tableName, targetTxSignature) {
        return this.updateRow(tableName, targetTxSignature, { deleted: true });
    }
}
exports.IQDBAdapter = IQDBAdapter;
//# sourceMappingURL=IQDBAdapter.js.map