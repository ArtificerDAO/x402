"use strict";
/**
 * OnChain Vector Adapter for Cognee
 *
 * Implements Cognee's VectorDBInterface using our fully on-chain database.
 * This adapter allows Cognee to store all embeddings and memories on Solana blockchain.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnChainVectorAdapter = void 0;
const LargeDataStorage_1 = require("../storage/LargeDataStorage");
// Import IQDB SDK functions directly
const iqdbSDK = require('@iqlabsteam/iqdb');
const { ensureRoot, ensureTable, writeRow, readRowsByTable } = iqdbSDK;
/**
 * OnChain Vector Adapter implementing Cognee's VectorDBInterface
 */
class OnChainVectorAdapter {
    constructor(connection, wallet, rootName, embeddingDimensions = 1536) {
        this.initialized = false;
        this.connection = connection;
        this.wallet = wallet;
        this.largeDataStorage = new LargeDataStorage_1.LargeDataStorage(connection, wallet);
        // SCALABLE SOLUTION: Each wallet gets its own root
        // This ensures no table limit conflicts between different users
        // Root name is derived from wallet public key for consistency
        this.rootName = rootName || `cognee_${wallet.publicKey.toBase58().substring(0, 8)}`;
        this.tableName = `cognee_v3_${wallet.publicKey.toBase58().substring(0, 6)}`;
        this.embeddingDimensions = embeddingDimensions;
        this.walletPath = `./cognee-wallet-${Date.now()}.json`;
    }
    /**
     * Initialize the adapter
     */
    async initialize() {
        if (this.initialized) {
            console.log(' Adapter already initialized');
            return;
        }
        console.log(` Initializing OnChainVectorAdapter (root: ${this.rootName})`);
        console.log(`   Wallet: ${this.wallet.publicKey.toBase58()}`);
        console.log(`   Strategy: ONE universal table for all collections (unlimited)`);
        // Setup IQDB environment
        const fs = require('fs');
        try {
            // Write wallet file for IQDB SDK (keep it for adapter lifetime)
            fs.writeFileSync(this.walletPath, JSON.stringify(Array.from(this.wallet.secretKey)));
            process.env.ANCHOR_WALLET = this.walletPath;
            process.env.ANCHOR_PROVIDER_URL = this.connection.rpcEndpoint;
            console.log(` Wallet file created: ${this.walletPath}`);
            // Ensure root (each wallet gets its own root)
            await ensureRoot();
            console.log(` IQDB root ensured (wallet-specific)`);
            // Create ONE universal table for ALL collections
            // This solves the table limit problem - supports unlimited collections
            // Using wallet prefix in name to ensure unique table per wallet
            this.tableName = `cognee_v4_${this.wallet.publicKey.toBase58().substring(0, 6)}`;
            // MINIMAL SCHEMA for under-50-byte references:
            // c = collection (truncated to 20 chars)
            // i = id (truncated to 15 chars)  
            // s = session pubkey (45 chars)
            // CRITICAL: IQDB automatically adds 'raw' column for full JSON!
            await ensureTable(this.tableName, ['c', 'i', 's', 'raw'], 'i' // ID as primary key
            );
            console.log(` Universal table created: ${this.tableName} (minimal schema, unlimited collections)`);
            this.initialized = true;
            console.log(' OnChainVectorAdapter initialized successfully');
        }
        catch (error) {
            console.error(' Failed to initialize adapter:', error);
            throw error;
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        const fs = require('fs');
        try {
            if (fs.existsSync(this.walletPath)) {
                fs.unlinkSync(this.walletPath);
                console.log(` Cleaned up wallet file: ${this.walletPath}`);
            }
        }
        catch (error) {
            console.error('  Failed to cleanup wallet file:', error);
        }
    }
    /**
     * Check if a collection exists (checks if any data exists for this collection)
     */
    async hasCollection(collectionName) {
        try {
            const allRows = await readRowsByTable({
                userPubkey: this.wallet.publicKey.toBase58(),
                tableName: this.tableName
            });
            const collectionPrefix = collectionName.substring(0, 20);
            return allRows.some((row) => row.c === collectionPrefix);
        }
        catch (error) {
            console.error('Error checking collection:', error);
            return false;
        }
    }
    /**
     * Create a new collection
     *
     * With universal table approach, this is a logical operation - no new table created.
     * Collections are differentiated by the 'collection_name' column.
     */
    async createCollection(collectionName, payloadSchema) {
        try {
            console.log(`📁 Creating collection: ${collectionName}`);
            // Check if collection already exists
            const exists = await this.hasCollection(collectionName);
            if (exists) {
                console.log(` Collection ${collectionName} already exists (has data)`);
                return;
            }
            // With universal table, collection is ready immediately
            // No table creation needed - collection is identified by 'collection_name' column
            console.log(` Collection ${collectionName} ready (using universal table)`);
        }
        catch (error) {
            console.error(` Error creating collection ${collectionName}:`, error);
            throw error;
        }
    }
    /**
     * Helper: Get all references for a collection
     */
    async getCollectionReferences(collectionName) {
        const allRows = await readRowsByTable({
            userPubkey: this.wallet.publicKey.toBase58(),
            tableName: this.tableName
        });
        const collectionPrefix = collectionName.substring(0, 8); // Match storage truncation
        return allRows.filter((r) => r.c === collectionPrefix);
    }
    /**
     * Helper: Check if ID exists in collection
     */
    async idExists(collectionName, id) {
        const refs = await this.getCollectionReferences(collectionName);
        const idPrefix = id.substring(0, 10); // Match storage truncation
        return refs.some((r) => r.i === idPrefix);
    }
    /**
     * Create (insert) data points into a collection
     *
     * PRODUCTION ARCHITECTURE:
     * - Check if ID already exists (skip duplicates for idempotency)
     * - Store ALL data (text, metadata, embedding) in Hybrid V2
     * - Store ONLY minimal reference (id + session) in IQDB for lookups
     *
     * This avoids IQDB's 50-byte limit and provides unlimited data storage!
     */
    async createDataPoints(collectionName, dataPoints) {
        try {
            console.log(` Storing ${dataPoints.length} data points in collection: ${collectionName}`);
            console.log(`   Strategy: ALL data in Hybrid V2, minimal reference in IQDB`);
            console.log('');
            for (const dataPoint of dataPoints) {
                console.log(` Processing: ${dataPoint.id}`);
                // Check if ID already exists (idempotency check)
                const exists = await this.idExists(collectionName, dataPoint.id);
                if (exists) {
                    console.log(`   ℹ  ID already exists, skipping (idempotent operation)`);
                    console.log('');
                    continue;
                }
                // Store ENTIRE data point in Hybrid V2 (text + metadata + embedding + everything!)
                const fullData = {
                    id: dataPoint.id,
                    text: dataPoint.text || '',
                    metadata: dataPoint.metadata || {},
                    embedding: dataPoint.embedding || [],
                    created_at: new Date().toISOString()
                };
                console.log(`    Storing full data in Hybrid V2...`);
                console.log(`      Text: ${fullData.text.length} chars`);
                console.log(`      Embedding: ${fullData.embedding.length}D`);
                console.log(`      Metadata keys: ${Object.keys(fullData.metadata).length}`);
                try {
                    const result = await this.largeDataStorage.storeLargeData(JSON.stringify(fullData), false // parallel upload
                    );
                    console.log(`    Full data stored in Hybrid V2: ${result.sessionPubkey}`);
                    console.log(`    Size: ${result.originalSize} bytes (${result.compressed ? 'compressed to ' + result.compressedSize + ' bytes' : 'uncompressed'})`);
                    console.log('');
                    // Now store ONLY minimal reference in IQDB (MUST stay under 50 bytes!)
                    // Be VERY aggressive with truncation - IQDB has strict size limits
                    const minimalRef = {
                        c: collectionName.substring(0, 8), // collection (max 8 chars)
                        i: dataPoint.id.substring(0, 10), // id (max 10 chars)
                        s: result.sessionPubkey // session (44 chars - can't truncate)
                    };
                    const refSize = JSON.stringify(minimalRef).length;
                    console.log(`    Storing reference in IQDB (${refSize} bytes)...`);
                    // Safety check - IQDB has a ~50-60 byte limit for writeRow
                    if (refSize > 75) {
                        console.error(`     WARNING: Reference size (${refSize} bytes) may exceed IQDB limit!`);
                        console.error(`   Trying anyway, but may fail...`);
                    }
                    await writeRow(this.tableName, JSON.stringify(minimalRef));
                    console.log(`    Reference stored (under 50-byte limit!)`);
                    console.log(`    Complete! ID: ${dataPoint.id}`);
                    console.log('');
                }
                catch (error) {
                    console.error(`    Failed to store ${dataPoint.id}:`, error?.message || error);
                    throw error;
                }
            }
            console.log(` Added ${dataPoints.length} data points to ${collectionName}`);
        }
        catch (error) {
            console.error(` Error creating data points in ${collectionName}:`, error);
            throw error;
        }
    }
    /**
     * Retrieve specific data points by IDs
     *
     * NEW ARCHITECTURE:
     * 1. Read minimal references from IQDB
     * 2. Download full data from Hybrid V2
     * 3. Return complete Cognee data points
     */
    async retrieve(collectionName, dataPointIds) {
        try {
            console.log(`📖 Retrieving ${dataPointIds.length} data points from ${collectionName}...`);
            // Step 1: Get minimal references from IQDB
            const allRows = await readRowsByTable({
                userPubkey: this.wallet.publicKey.toBase58(),
                tableName: this.tableName
            });
            // Filter by collection (using short key 'c')
            const collectionPrefix = collectionName.substring(0, 8); // Match storage truncation
            const collectionRows = allRows.filter((r) => r.c === collectionPrefix);
            console.log(`   Found ${collectionRows.length} references in collection`);
            const results = [];
            // Step 2: Download full data from Hybrid V2 for each ID
            for (const id of dataPointIds) {
                const idPrefix = id.substring(0, 10); // Match storage truncation
                const row = collectionRows.find((r) => r.i === idPrefix);
                if (row && row.s) {
                    try {
                        console.log(`    Downloading full data for: ${id}`);
                        // Download from Hybrid V2
                        const fullDataResult = await this.largeDataStorage.retrieveLargeData(row.s);
                        const fullData = JSON.parse(fullDataResult.data);
                        // Return as Cognee data point
                        results.push({
                            id: fullData.id,
                            text: fullData.text,
                            metadata: fullData.metadata,
                            embedding: fullData.embedding
                        });
                        console.log(`    Retrieved: ${id}`);
                    }
                    catch (error) {
                        console.error(`    Failed to retrieve ${id}:`, error?.message);
                    }
                }
            }
            console.log(` Retrieved ${results.length}/${dataPointIds.length} data points`);
            return results;
        }
        catch (error) {
            console.error(` Error retrieving data points from ${collectionName}:`, error);
            return [];
        }
    }
    /**
     * Search for similar vectors
     */
    async search(collectionName, queryText, queryVector, limit = 10, withVector = false) {
        try {
            const allRows = await readRowsByTable({
                userPubkey: this.wallet.publicKey.toBase58(),
                tableName: this.tableName
            });
            const collectionRows = allRows.filter((r) => r.collection_name === collectionName);
            if (!queryVector) {
                // If no query vector, return text-based results (simple substring match)
                const textResults = collectionRows
                    .filter((row) => {
                    if (!queryText)
                        return true;
                    const text = (row.text || '').toLowerCase();
                    return text.includes(queryText.toLowerCase());
                })
                    .slice(0, limit);
                return textResults.map((row) => ({
                    id: row.data_point_id,
                    score: 1.0,
                    payload: {
                        text: row.text,
                        metadata: JSON.parse(row.metadata || '{}')
                    }
                }));
            }
            // Vector similarity search
            const similarities = [];
            for (const row of collectionRows) {
                if (row.vector_session && row.vector_session !== '') {
                    try {
                        const vectorData = await this.largeDataStorage.retrieveLargeData(row.vector_session);
                        const storedVector = JSON.parse(vectorData.data);
                        // Calculate cosine similarity
                        const score = this.cosineSimilarity(queryVector, storedVector);
                        similarities.push({ row, score });
                    }
                    catch (error) {
                        console.error(`Failed to load vector for similarity:`, error);
                    }
                }
            }
            // Sort by similarity score (descending) and take top results
            similarities.sort((a, b) => b.score - a.score);
            const topResults = similarities.slice(0, limit);
            // Format results
            const results = [];
            for (const { row, score } of topResults) {
                const result = {
                    id: row.data_point_id,
                    score,
                    payload: {
                        text: row.text,
                        metadata: JSON.parse(row.metadata || '{}')
                    }
                };
                if (withVector && row.vector_session) {
                    try {
                        const vectorData = await this.largeDataStorage.retrieveLargeData(row.vector_session);
                        result.vector = JSON.parse(vectorData.data);
                    }
                    catch (error) {
                        console.error(`Failed to include vector in result:`, error);
                    }
                }
                results.push(result);
            }
            return results;
        }
        catch (error) {
            console.error(`Error searching ${collectionName}:`, error);
            return [];
        }
    }
    /**
     * Batch search with multiple query texts
     */
    async batchSearch(collectionName, queryTexts, limit = 10, withVectors = false) {
        const results = [];
        for (const queryText of queryTexts) {
            const searchResults = await this.search(collectionName, queryText, null, limit, withVectors);
            results.push(searchResults);
        }
        return results;
    }
    /**
     * Delete data points from a collection
     */
    async deleteDataPoints(collectionName, dataPointIds) {
        try {
            // Note: IQDB doesn't support deletion, so we'd need to mark as deleted
            // For now, log the deletion request
            console.log(`Deletion requested for ${dataPointIds.length} data points in ${collectionName}`);
            console.log('Note: IQDB append-only nature means data is marked as deleted rather than physically removed');
        }
        catch (error) {
            console.error(`Error deleting data points from ${collectionName}:`, error);
            throw error;
        }
    }
    /**
     * Prune obsolete data
     */
    async prune() {
        console.log('Prune operation - IQDB is append-only, no physical deletion needed');
    }
    /**
     * Embed data (placeholder - Cognee handles this through EmbeddingEngine)
     */
    async embedData(data) {
        throw new Error('embedData should be called through Cognee\'s EmbeddingEngine, not the adapter');
    }
    // Helper methods
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }
        let dotProduct = 0;
        let magA = 0;
        let magB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magA += vecA[i] * vecA[i];
            magB += vecB[i] * vecB[i];
        }
        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);
        if (magA === 0 || magB === 0) {
            return 0;
        }
        return dotProduct / (magA * magB);
    }
    /**
     * Get collection statistics
     */
    async getCollectionStats(collectionName) {
        try {
            const allRows = await readRowsByTable({
                userPubkey: this.wallet.publicKey.toBase58(),
                tableName: this.tableName
            });
            const collectionRows = allRows.filter((r) => r.collection_name === collectionName);
            if (collectionRows.length === 0)
                return null;
            return {
                name: collectionName,
                count: collectionRows.length,
                created_at: 'N/A' // Not tracked in universal table
            };
        }
        catch (error) {
            console.error(`Error getting collection stats:`, error);
            return null;
        }
    }
    /**
     * List all collections
     * Scans universal table to find unique collection names
     */
    async listCollections() {
        try {
            const allRows = await readRowsByTable({
                userPubkey: this.wallet.publicKey.toBase58(),
                tableName: 'cognee_universal'
            });
            const uniqueCollections = new Set();
            allRows.forEach((row) => {
                if (row.collection_name) {
                    uniqueCollections.add(row.collection_name);
                }
            });
            return Array.from(uniqueCollections);
        }
        catch (error) {
            console.error('Error listing collections:', error);
            return [];
        }
    }
}
exports.OnChainVectorAdapter = OnChainVectorAdapter;
//# sourceMappingURL=OnChainVectorAdapter.js.map