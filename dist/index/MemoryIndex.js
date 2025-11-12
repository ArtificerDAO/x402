"use strict";
/**
 * Memory Index for On-Chain Cognee Data
 *
 * Provides fast lookups by:
 * - Memory ID
 * - User ID
 * - Tags/Keywords
 * - Data type
 * - Time range
 *
 * Architecture:
 * - Index stored in IQDB (metadata only, small & fast)
 * - Full data stored in Pinocchio (on-chain, immutable)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryIndex = void 0;
const IQLabsAPI_1 = require("../api/IQLabsAPI");
class MemoryIndex {
    constructor(connection, wallet, indexName = 'cognee_memory_index') {
        this.api = new IQLabsAPI_1.IQLabsAPI(connection);
        this.wallet = wallet;
        this.indexName = indexName;
    }
    /**
     * Index a memory entry (called after storing to Pinocchio)
     */
    async indexMemory(entry) {
        console.log(`\n Indexing memory: ${entry.memory_id}`);
        // Store in IQDB for fast retrieval
        // Note: IQDB is key-value store, we use memory_id as key
        const indexKey = `mem:${entry.memory_id}`;
        const indexData = JSON.stringify(entry);
        await this.api.setIQDBValue(indexKey, indexData, this.wallet);
        // Also index by user_id for user queries
        const userIndexKey = `user:${entry.user_id}:mem:${entry.memory_id}`;
        await this.api.setIQDBValue(userIndexKey, entry.session_pubkey, this.wallet);
        // Index by tags
        for (const tag of entry.tags) {
            const tagIndexKey = `tag:${tag}:mem:${entry.memory_id}`;
            await this.api.setIQDBValue(tagIndexKey, entry.session_pubkey, this.wallet);
        }
        console.log(` Memory indexed!`);
    }
    /**
     * Get memory metadata by ID
     */
    async getMemoryById(memory_id) {
        console.log(`\n Looking up memory: ${memory_id}`);
        const indexKey = `mem:${memory_id}`;
        const data = await this.api.getIQDBValue(indexKey, this.wallet);
        if (!data) {
            console.log(` Memory not found`);
            return null;
        }
        const entry = JSON.parse(data);
        console.log(` Found memory: ${entry.session_pubkey}`);
        return entry;
    }
    /**
     * Search memories by criteria
     *
     * Note: This is a simple implementation. For production, you'd want:
     * - Proper indexing strategy
     * - Pagination
     * - More efficient tag queries
     * - Vector search for semantic queries
     */
    async searchMemories(query) {
        console.log(`\n Searching memories...`);
        console.log(`   Query:`, JSON.stringify(query, null, 2));
        const results = [];
        // For now, we implement basic search
        // In production, you'd use a proper index structure
        if (query.memory_ids && query.memory_ids.length > 0) {
            // Direct ID lookup
            for (const memory_id of query.memory_ids) {
                const entry = await this.getMemoryById(memory_id);
                if (entry) {
                    results.push(entry);
                }
            }
        }
        console.log(` Found ${results.length} memories`);
        return results;
    }
    /**
     * Get all memories for a user
     *
     * Note: In production, you'd want pagination and proper indexing
     */
    async getMemoriesByUser(user_id, limit = 10) {
        console.log(`\n Getting memories for user: ${user_id}`);
        // In production, you'd have a proper index structure
        // For now, this is a placeholder that shows the concept
        console.log(`  getUserMemories not fully implemented yet`);
        console.log(`   Use searchMemories with memory_ids for now`);
        return [];
    }
    /**
     * Search by keyword (in tags or preview text)
     */
    async searchByKeyword(keyword, limit = 10) {
        console.log(`\n Searching by keyword: "${keyword}"`);
        // In production, you'd use full-text search or vector search
        // For now, this is a placeholder
        console.log(`  Keyword search not fully implemented yet`);
        console.log(`   Use searchMemories with specific criteria for now`);
        return [];
    }
}
exports.MemoryIndex = MemoryIndex;
//# sourceMappingURL=MemoryIndex.js.map