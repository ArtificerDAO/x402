"use strict";
/**
 * IPFS Memory Index - Decentralized Metadata Storage
 *
 * Architecture:
 * 1. Store metadata index on IPFS via NFT.Storage (fast, decentralized, FREE)
 * 2. Store IPFS CID on-chain (permanent pointer)
 * 3. Full memory data stored via Pinocchio (on-chain)
 *
 * Benefits:
 * - Fast metadata lookups via IPFS
 * - Permanent index (Filecoin backup via NFT.Storage)
 * - No size limits
 * - Decentralized and censorship-resistant
 * - FREE (no tokens needed)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPFSMemoryIndex = void 0;
class IPFSMemoryIndex {
    constructor(config) {
        this.initialized = false;
        // In-memory cache of CID mappings (memory_id -> IPFS CID)
        this.cidCache = new Map();
        this.config = config || {};
        this.apiKey = config?.apiKey || process.env.NFT_STORAGE_API_KEY;
        // Use public gateway (or NFT.Storage gateway if API key provided)
        this.gateway = config?.gateway || 'https://ipfs.io';
    }
    /**
     * Initialize IPFS connection
     */
    async initialize() {
        if (this.initialized)
            return;
        console.log('🌐 Initializing IPFS connection...');
        console.log(`   Gateway: ${this.gateway}`);
        if (this.apiKey) {
            console.log(`   API Key: ${this.apiKey.substring(0, 10)}...`);
        }
        else {
            console.log('   Mode: Public IPFS (no API key - using local storage simulation)');
        }
        this.initialized = true;
        console.log('✅ IPFS ready!');
    }
    /**
     * Index a memory (store metadata on IPFS)
     * For now, simulates IPFS storage locally and generates a mock CID
     * In production, this would upload to a real IPFS pinning service
     */
    async indexMemory(entry) {
        await this.initialize();
        console.log(`📇 Indexing memory on IPFS: ${entry.memory_id.substring(0, 8)}...`);
        // Prepare metadata object
        const metadata = {
            memory_id: entry.memory_id,
            user_id: entry.user_id,
            session_pubkey: entry.session_pubkey,
            memory_type: entry.memory_type,
            tags: entry.tags,
            created_at: entry.created_at,
            updated_at: entry.updated_at,
            size: entry.size,
            cost: entry.cost,
            num_chunks: entry.num_chunks,
            num_entities: entry.num_entities,
            num_relationships: entry.num_relationships,
            has_embeddings: entry.has_embeddings,
            preview: entry.preview,
            indexed_at: new Date().toISOString()
        };
        try {
            // Generate a mock CID (in production, this would be from IPFS)
            // Format: Qm + base58 hash
            const hash = this.generateMockCID(metadata);
            // Store locally for retrieval (simulating IPFS)
            this.cidCache.set(entry.memory_id, hash);
            this.cidCache.set(hash, JSON.stringify(metadata)); // Store data by CID
            console.log(`✅ Indexed on IPFS (simulated)!`);
            console.log(`   CID: ${hash}`);
            console.log(`   Size: ${JSON.stringify(metadata).length} bytes`);
            console.log(`   📝 Note: Using local simulation. For production, integrate real IPFS pinning service.`);
            return hash;
        }
        catch (error) {
            throw new Error(`Failed to index memory on IPFS: ${error.message}`);
        }
    }
    /**
     * Generate a mock IPFS CID for testing
     */
    generateMockCID(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        // Generate a fake CID that looks real
        const base58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let cid = 'Qm';
        const absHash = Math.abs(hash);
        for (let i = 0; i < 44; i++) {
            cid += base58chars[Math.floor((absHash + i) % base58chars.length)];
        }
        return cid;
    }
    /**
     * Get memory metadata by IPFS CID
     */
    async getMemoryByCID(cid) {
        await this.initialize();
        console.log(`📥 Fetching metadata from IPFS: ${cid}`);
        try {
            // Retrieve from local cache (simulating IPFS)
            const dataStr = this.cidCache.get(cid);
            if (!dataStr) {
                console.warn(`⚠️  CID not found in cache: ${cid}`);
                return null;
            }
            const metadata = JSON.parse(dataStr);
            console.log(`✅ Retrieved from IPFS (simulated)!`);
            return metadata;
        }
        catch (error) {
            console.error(`❌ Failed to fetch from IPFS: ${error.message}`);
            return null;
        }
    }
    /**
     * Get memory metadata by memory ID (requires CID cache or lookup)
     */
    async getMemoryById(memory_id) {
        await this.initialize();
        // Check cache first
        const cid = this.cidCache.get(memory_id);
        if (!cid) {
            console.warn(`⚠️  No CID cached for memory_id: ${memory_id}`);
            console.warn(`   Use getMemoryByCID() with the IPFS CID instead`);
            return null;
        }
        console.log(`💾 Found CID in cache: ${cid}`);
        return await this.getMemoryByCID(cid);
    }
    /**
     * Index multiple memories in batch
     */
    async indexBatch(entries) {
        await this.initialize();
        console.log(`📇 Batch indexing ${entries.length} memories on IPFS...`);
        const cids = [];
        for (const entry of entries) {
            const cid = await this.indexMemory(entry);
            cids.push(cid);
        }
        console.log(`✅ Batch indexed ${cids.length} memories!`);
        return cids;
    }
    /**
     * Create a user index (all memories for a user)
     */
    async createUserIndex(user_id, memoryCIDs) {
        await this.initialize();
        console.log(`📇 Creating user index on IPFS: ${user_id}`);
        const userIndex = {
            user_id,
            memory_cids: memoryCIDs,
            created_at: new Date().toISOString(),
            total_memories: memoryCIDs.length
        };
        try {
            const cid = await this.jsonStore.add(userIndex);
            const cidString = cid.toString();
            console.log(`✅ User index created!`);
            console.log(`   CID: ${cidString}`);
            console.log(`   Memories: ${memoryCIDs.length}`);
            return cidString;
        }
        catch (error) {
            throw new Error(`Failed to create user index: ${error.message}`);
        }
    }
    /**
     * Get user index (all memories for a user)
     */
    async getUserIndex(cid) {
        await this.initialize();
        try {
            const cidObj = CID.parse(cid);
            const userIndex = await this.jsonStore.get(cidObj);
            return userIndex;
        }
        catch (error) {
            console.error(`❌ Failed to fetch user index: ${error.message}`);
            return null;
        }
    }
    /**
     * Shutdown IPFS connection
     */
    async shutdown() {
        if (this.initialized) {
            console.log('🛑 Shutting down IPFS connection...');
            this.initialized = false;
            console.log('✅ IPFS connection closed');
        }
    }
    /**
     * Get CID cache (for persistence/backup)
     */
    getCIDCache() {
        return this.cidCache;
    }
    /**
     * Load CID cache (from persistence/backup)
     */
    loadCIDCache(cache) {
        if (cache instanceof Map) {
            this.cidCache = cache;
        }
        else {
            this.cidCache = new Map(Object.entries(cache));
        }
        console.log(`💾 Loaded ${this.cidCache.size} CIDs into cache`);
    }
}
exports.IPFSMemoryIndex = IPFSMemoryIndex;
//# sourceMappingURL=IPFSMemoryIndex.js.map