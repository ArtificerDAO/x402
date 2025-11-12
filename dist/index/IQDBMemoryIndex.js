"use strict";
/**
 * IQDB Memory Index - On-Chain Metadata Storage
 *
 * Uses IQLabs IQDB for storing memory metadata on-chain.
 * This provides decentralized, permanent indexing for fast memory lookups.
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
exports.IQDBMemoryIndex = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class IQDBMemoryIndex {
    constructor(config) {
        this.initialized = false;
        this.connection = config.connection;
        this.wallet = config.wallet;
        this.tableName = config.tableName || 'cognee_memories';
    }
    /**
     * Initialize IQDB connection and ensure table exists
     */
    async initialize() {
        if (this.initialized)
            return;
        // Setup Anchor wallet for IQDB SDK
        const solanaDir = path.join(os.homedir(), '.config', 'solana');
        const walletPath = path.join(solanaDir, 'id.json');
        if (!fs.existsSync(solanaDir)) {
            fs.mkdirSync(solanaDir, { recursive: true });
        }
        fs.writeFileSync(walletPath, JSON.stringify(Array.from(this.wallet.secretKey)));
        process.env.ANCHOR_PROVIDER_URL = this.connection.rpcEndpoint;
        process.env.ANCHOR_WALLET = walletPath;
        // Import IQDB SDK
        const { createIQDB } = require('@iqlabsteam/iqdatabase');
        this.iqdb = createIQDB();
        // Ensure root exists (one-time setup)
        try {
            await this.iqdb.ensureRoot(this.wallet);
        }
        catch (error) {
            console.warn('  Root already exists or initialization failed:', error.message);
        }
        // Ensure table exists (one-time setup, expensive)
        try {
            await this.iqdb.ensureTable(this.tableName, [
                'memory_id', // Single char ID (a-z, 0-9)
                'full_id', // Full UUID
                'user_id',
                'session_pubkey',
                'memory_type',
                'tags',
                'size',
                'num_chunks',
                'num_entities',
                'num_relationships',
                'created_at',
                'preview'
            ], 'memory_id', // ID column (must be single char!)
            []);
        }
        catch (error) {
            // Table might already exist
            console.warn('  Table creation failed (may already exist):', error.message);
        }
        this.initialized = true;
    }
    /**
     * Convert full memory_id (UUID) to single-char ID for IQDB
     * Uses deterministic hashing to ensure consistency
     */
    getShortId(fullId) {
        // Simple hash to single char (a-z, 0-9 = 36 options)
        let hash = 0;
        for (let i = 0; i < fullId.length; i++) {
            hash = ((hash << 5) - hash) + fullId.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return chars[Math.abs(hash) % chars.length];
    }
    /**
     * Index a memory (store metadata in IQDB)
     */
    async indexMemory(entry) {
        await this.initialize();
        // Convert entry to IQDB row format
        const shortId = this.getShortId(entry.memory_id);
        // writeRow expects STRING in format: "{ key:'value', key2:'value2' }"
        // IQDB "Tx too long" error happens > ~100 chars
        // Use MINIMAL data - LocalMemoryIndex will have full details
        // Successful format: { memory_id:'a', user_id:'alice', memory_type:'doc', size:'100', preview:'Memory A' }
        const rowString = `{ memory_id:'${shortId}', user_id:'${entry.user_id.substring(0, 8)}', memory_type:'${entry.memory_type.substring(0, 4)}', size:'${entry.size}', preview:'${entry.preview.substring(0, 10).replace(/[^a-zA-Z0-9 ]/g, '')}' }`;
        console.log(` IQDB row (${rowString.length} chars): ${rowString}`);
        try {
            await this.iqdb.writeRow(this.tableName, rowString);
            console.log(` Indexed in IQDB with short ID: ${shortId}`);
        }
        catch (error) {
            console.error(` IQDB write failed`);
            throw new Error(`Failed to index memory in IQDB: ${error.message}`);
        }
    }
    /**
     * Get memory metadata by ID
     */
    async getMemoryById(memory_id) {
        await this.initialize();
        const shortId = this.getShortId(memory_id);
        try {
            const rows = await this.iqdb.readRowsByTable({
                userPubkey: this.wallet.publicKey.toBase58(),
                tableName: this.tableName
            });
            // Since we can't store full_id, we need to match by shortId and then verify
            // For now, we'll just return the first match (collision possible but rare)
            // TODO: Better solution would be to store full UUID in preview or tags
            const shortIdToFind = this.getShortId(memory_id);
            const row = rows.find((r) => r.memory_id === shortIdToFind);
            if (!row) {
                return null;
            }
            // Convert back to MemoryIndexEntry format
            // Remember: preview contains the FULL session_pubkey!
            return {
                memory_id: memory_id, // Use the full ID that was passed in
                user_id: row.user_id,
                session_pubkey: row.preview, // Full pubkey stored in preview!
                memory_type: row.memory_type,
                tags: row.tags ? [row.tags] : [],
                created_at: new Date().toISOString(), // Not stored in this schema
                updated_at: new Date().toISOString(), // Not stored in this schema
                size: parseInt(row.size || '0'),
                cost: 0, // Not tracked in IQDB
                num_chunks: 0, // Not stored in this schema
                num_entities: 0, // Not stored in this schema
                num_relationships: 0, // Not stored in this schema
                has_embeddings: false, // Not tracked in IQDB
                preview: '' // Preview was used for session_pubkey
            };
        }
        catch (error) {
            throw new Error(`Failed to get memory from IQDB: ${error.message}`);
        }
    }
    /**
     * Search memories by criteria
     */
    async searchMemories(query) {
        await this.initialize();
        try {
            const rows = await this.iqdb.readRowsByTable({
                userPubkey: this.wallet.publicKey.toBase58(),
                tableName: this.tableName
            });
            // Filter rows based on query
            let filtered = rows;
            if (query.user_id) {
                filtered = filtered.filter((r) => r.user_id === query.user_id);
            }
            if (query.memory_type) {
                filtered = filtered.filter((r) => r.memory_type === query.memory_type);
            }
            if (query.memory_ids && query.memory_ids.length > 0) {
                // Convert memory_ids to short IDs for matching
                const shortIds = query.memory_ids.map(id => this.getShortId(id));
                filtered = filtered.filter((r) => shortIds.includes(r.memory_id));
            }
            if (query.tags && query.tags.length > 0) {
                filtered = filtered.filter((r) => {
                    const rowTags = JSON.parse(r.tags || '[]');
                    return query.tags.some(tag => rowTags.includes(tag));
                });
            }
            // Convert to MemoryIndexEntry format
            // Remember: preview contains the FULL session_pubkey!
            return filtered.map((row) => ({
                memory_id: row.memory_id, // Short ID (single char)
                user_id: row.user_id,
                session_pubkey: row.preview, // Full pubkey stored in preview!
                memory_type: row.memory_type,
                tags: row.tags ? [row.tags] : [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                size: parseInt(row.size || '0'),
                cost: 0,
                num_chunks: 0,
                num_entities: 0,
                num_relationships: 0,
                has_embeddings: false,
                preview: '' // Preview was used for session_pubkey
            }));
        }
        catch (error) {
            throw new Error(`Failed to search memories in IQDB: ${error.message}`);
        }
    }
    /**
     * Get all memories
     */
    async getAllMemories() {
        return await this.searchMemories({});
    }
}
exports.IQDBMemoryIndex = IQDBMemoryIndex;
//# sourceMappingURL=IQDBMemoryIndex.js.map