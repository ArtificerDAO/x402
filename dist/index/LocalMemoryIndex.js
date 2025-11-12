"use strict";
/**
 * Local Memory Index
 *
 * Simple in-memory/file-based index for Cognee memories
 * Can be upgraded to on-chain indexing later when IQDB or similar service is available
 *
 * For production, you'd want to use:
 * - Database (PostgreSQL, MongoDB, etc.)
 * - Redis for caching
 * - Vector database for semantic search
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalMemoryIndex = void 0;
const fs = __importStar(require("fs"));
class LocalMemoryIndex {
    constructor(indexPath = './memory-index.json') {
        this.indexPath = indexPath;
        this.index = new Map();
        this.loadIndex();
    }
    /**
     * Load index from file
     */
    loadIndex() {
        try {
            if (fs.existsSync(this.indexPath)) {
                const data = fs.readFileSync(this.indexPath, 'utf-8');
                const entries = JSON.parse(data);
                this.index = new Map(entries.map(e => [e.memory_id, e]));
                console.log(` Loaded ${this.index.size} entries from index`);
            }
        }
        catch (error) {
            console.warn(`  Failed to load index: ${error.message}`);
        }
    }
    /**
     * Save index to file
     */
    saveIndex() {
        try {
            const entries = Array.from(this.index.values());
            fs.writeFileSync(this.indexPath, JSON.stringify(entries, null, 2));
        }
        catch (error) {
            console.error(` Failed to save index: ${error.message}`);
        }
    }
    /**
     * Index a memory entry
     */
    async indexMemory(entry) {
        console.log(` Indexing memory: ${entry.memory_id}`);
        this.index.set(entry.memory_id, entry);
        this.saveIndex();
        console.log(` Memory indexed locally!`);
    }
    /**
     * Get memory metadata by ID
     */
    async getMemoryById(memory_id) {
        console.log(` Looking up memory: ${memory_id}`);
        const entry = this.index.get(memory_id);
        if (!entry) {
            console.log(` Memory not found in local index`);
            return null;
        }
        console.log(` Found memory: ${entry.session_pubkey}`);
        return entry;
    }
    /**
     * Search memories by criteria
     */
    async searchMemories(query) {
        console.log(` Searching memories...`);
        let results = Array.from(this.index.values());
        // Filter by memory_ids
        if (query.memory_ids && query.memory_ids.length > 0) {
            results = results.filter(e => query.memory_ids.includes(e.memory_id));
        }
        // Filter by user_id
        if (query.user_id) {
            results = results.filter(e => e.user_id === query.user_id);
        }
        // Filter by memory_type
        if (query.memory_type) {
            results = results.filter(e => e.memory_type === query.memory_type);
        }
        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            results = results.filter(e => query.tags.some(tag => e.tags.includes(tag)));
        }
        // Filter by embeddings
        if (query.has_embeddings !== undefined) {
            results = results.filter(e => e.has_embeddings === query.has_embeddings);
        }
        // Filter by time range
        if (query.time_from) {
            results = results.filter(e => e.created_at >= query.time_from);
        }
        if (query.time_to) {
            results = results.filter(e => e.created_at <= query.time_to);
        }
        console.log(` Found ${results.length} memories`);
        return results;
    }
    /**
     * Get all memories for a user
     */
    async getMemoriesByUser(user_id, limit = 10) {
        return this.searchMemories({ user_id }).then(results => results.slice(0, limit));
    }
    /**
     * Search by keyword (in tags or preview text)
     */
    async searchByKeyword(keyword, limit = 10) {
        console.log(` Searching by keyword: "${keyword}"`);
        const lowerKeyword = keyword.toLowerCase();
        const results = Array.from(this.index.values()).filter(e => e.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
            e.preview.toLowerCase().includes(lowerKeyword));
        console.log(` Found ${results.length} memories`);
        return results.slice(0, limit);
    }
    /**
     * Delete a memory from index
     */
    async deleteMemory(memory_id) {
        const deleted = this.index.delete(memory_id);
        if (deleted) {
            this.saveIndex();
            console.log(` Memory removed from index: ${memory_id}`);
        }
        return deleted;
    }
    /**
     * Get all memories
     */
    async getAllMemories() {
        return Array.from(this.index.values());
    }
    /**
     * Get index statistics
     */
    getStats() {
        const entries = Array.from(this.index.values());
        const by_user = {};
        const by_type = {};
        let total_size = 0;
        entries.forEach(e => {
            by_user[e.user_id] = (by_user[e.user_id] || 0) + 1;
            by_type[e.memory_type] = (by_type[e.memory_type] || 0) + 1;
            total_size += e.size;
        });
        return {
            total: entries.length,
            by_user,
            by_type,
            total_size
        };
    }
}
exports.LocalMemoryIndex = LocalMemoryIndex;
//# sourceMappingURL=LocalMemoryIndex.js.map