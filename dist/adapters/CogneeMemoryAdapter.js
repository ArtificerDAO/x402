"use strict";
/**
 * Cognee Memory Adapter for On-Chain Storage
 *
 * Two-layer architecture:
 * 1. Metadata Layer (IQDB) - Fast lookups
 * 2. Full Data Layer (Pinocchio) - Complete memories
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CogneeMemoryAdapter = void 0;
const LargeDataStorage_1 = require("../storage/LargeDataStorage");
const LocalMemoryIndex_1 = require("../index/LocalMemoryIndex");
const uuid_1 = require("uuid");
class CogneeMemoryAdapter {
    constructor(connection, wallet, indexPath) {
        this.storage = new LargeDataStorage_1.LargeDataStorage(connection, wallet);
        this.index = new LocalMemoryIndex_1.LocalMemoryIndex(indexPath);
        this.wallet = wallet;
    }
    /**
     * Store a complete cognee memory on-chain
     */
    async storeMemory(memory) {
        console.log('\n Storing Cognee Memory...');
        console.log(`   Memory ID: ${memory.memory_id}`);
        console.log(`   Chunks: ${memory.chunks.length}`);
        console.log(`   Entities: ${memory.entities.length}`);
        console.log(`   Relationships: ${memory.relationships.length}`);
        // Serialize the complete memory
        const memoryData = JSON.stringify(memory, null, 2);
        console.log(`   Total size: ${memoryData.length} bytes`);
        console.log('');
        // Store in Pinocchio (using fast sequential mode)
        const result = await this.storage.storeLargeData(memoryData, true);
        console.log(' Memory stored on-chain!');
        console.log(`   Session: ${result.sessionPubkey}`);
        console.log(`   Cost: $${((result.cost || 0) * 200).toFixed(4)}`);
        console.log('');
        // Create index entry for fast lookups
        const indexEntry = {
            memory_id: memory.memory_id,
            user_id: memory.user_id,
            session_pubkey: result.sessionPubkey,
            memory_type: memory.memory_type,
            tags: memory.tags || [],
            created_at: memory.created_at,
            updated_at: memory.updated_at,
            size: memoryData.length,
            cost: result.cost || 0,
            num_chunks: memory.chunks.length,
            num_entities: memory.entities.length,
            num_relationships: memory.relationships.length,
            has_embeddings: !!memory.embeddings && memory.embeddings.length > 0,
            preview: memory.chunks[0]?.text.substring(0, 100) || ''
        };
        // Index the memory (for fast retrieval by ID)
        try {
            await this.index.indexMemory(indexEntry);
        }
        catch (error) {
            console.warn('  Warning: Failed to index memory:', error.message);
            console.warn('   Memory is stored but not indexed (can still retrieve by session pubkey)');
        }
        return {
            memory_id: memory.memory_id,
            session_pubkey: result.sessionPubkey,
            cost: result.cost || 0,
            size: memoryData.length
        };
    }
    /**
     * Retrieve a memory from on-chain storage by session pubkey
     */
    async getMemory(session_pubkey) {
        console.log('\n Retrieving Cognee Memory...');
        console.log(`   Session: ${session_pubkey}`);
        console.log('');
        const result = await this.storage.retrieveLargeData(session_pubkey);
        console.log(' Memory retrieved!');
        console.log(`   Size: ${result.data.length} bytes`);
        console.log('');
        return JSON.parse(result.data);
    }
    /**
     * Retrieve a memory by its memory ID (uses index for lookup)
     */
    async getMemoryById(memory_id) {
        console.log('\n Retrieving memory by ID...');
        console.log(`   Memory ID: ${memory_id}`);
        // Look up session pubkey in index
        const indexEntry = await this.index.getMemoryById(memory_id);
        if (!indexEntry) {
            throw new Error(`Memory not found: ${memory_id}`);
        }
        console.log(`   Found session: ${indexEntry.session_pubkey}`);
        // Retrieve full memory from Pinocchio
        return await this.getMemory(indexEntry.session_pubkey);
    }
    /**
     * Get memory metadata without downloading full data
     */
    async getMemoryMetadata(memory_id) {
        return await this.index.getMemoryById(memory_id);
    }
    /**
     * Search memories by criteria
     */
    async searchMemories(query) {
        return await this.index.searchMemories(query);
    }
    /**
     * Create a simple test memory
     */
    static createTestMemory(text, user_id, includeEmbeddings = false) {
        const memory_id = (0, uuid_1.v4)();
        const chunk_id = (0, uuid_1.v4)();
        const entity1_id = (0, uuid_1.v4)();
        const entity2_id = (0, uuid_1.v4)();
        // Create chunk
        const chunks = [{
                chunk_id,
                text,
                chunk_index: 0,
                chunk_size: text.length,
                cut_type: 'sentence',
                metadata: { source: 'test' }
            }];
        // Extract entities (simple keyword extraction)
        const words = text.split(' ');
        const entities = [
            {
                entity_id: entity1_id,
                name: words[0] || 'Entity1',
                type: 'Concept',
                description: `Concept from text: ${words[0]}`,
                metadata: {}
            }
        ];
        if (words.length > 3) {
            entities.push({
                entity_id: entity2_id,
                name: words[3] || 'Entity2',
                type: 'Concept',
                description: `Concept from text: ${words[3]}`,
                metadata: {}
            });
        }
        // Create relationships
        const relationships = [];
        if (entities.length >= 2) {
            relationships.push({
                source_id: entity1_id,
                target_id: entity2_id,
                relationship_name: 'RELATES_TO',
                properties: { confidence: 0.8 }
            });
        }
        // Optionally add embeddings (mock data)
        const embeddings = includeEmbeddings ? [{
                chunk_id,
                vector: Array(384).fill(0).map(() => Math.random() - 0.5), // 384-dim
                dimensions: 384,
                model: 'sentence-transformers/all-MiniLM-L6-v2'
            }] : undefined;
        return {
            memory_id,
            user_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            memory_type: 'document',
            tags: ['test', 'onchain'],
            chunks,
            entities,
            relationships,
            embeddings
        };
    }
}
exports.CogneeMemoryAdapter = CogneeMemoryAdapter;
//# sourceMappingURL=CogneeMemoryAdapter.js.map