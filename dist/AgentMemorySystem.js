"use strict";
/**
 * Agent Memory System - Main API for on-chain memory management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMemorySystem = void 0;
exports.createMemorySystem = createMemorySystem;
const types_1 = require("./types");
const IQDBAdapter_1 = require("./storage/IQDBAdapter");
const PinocchioAdapter_1 = require("./storage/PinocchioAdapter");
const VectorStorage_1 = require("./storage/VectorStorage");
const GraphStorage_1 = require("./storage/GraphStorage");
const VectorSearchEngine_1 = require("./retrieval/VectorSearchEngine");
const GraphQueryEngine_1 = require("./retrieval/GraphQueryEngine");
const schemas_1 = require("./config/schemas");
const storage_1 = require("./utils/storage");
const uuid_1 = require("uuid");
/**
 * Agent Memory System class - Main entry point for the SDK
 */
class AgentMemorySystem {
    constructor(config) {
        this.memoryCache = new Map();
        this.initialized = false;
        this.config = config;
        this.iqdb = new IQDBAdapter_1.IQDBAdapter(config);
        this.pinocchio = new PinocchioAdapter_1.PinocchioAdapter(config);
        this.vectorStorage = new VectorStorage_1.VectorStorage(config);
        this.graphStorage = new GraphStorage_1.GraphStorage(config);
        this.vectorSearch = new VectorSearchEngine_1.VectorSearchEngine(config);
        this.graphQuery = new GraphQueryEngine_1.GraphQueryEngine();
    }
    /**
     * Initialize the memory system
     */
    async initialize() {
        if (this.initialized) {
            console.log('Memory system already initialized');
            return;
        }
        console.log('Initializing on-chain memory system...');
        // Initialize adapters
        await this.iqdb.initialize();
        await this.vectorStorage.initialize();
        await this.graphStorage.initialize();
        this.initialized = true;
        console.log('Memory system initialized');
    }
    /**
     * Create all required tables
     */
    async setupTables() {
        console.log('Setting up tables...');
        for (const schema of schemas_1.ALL_SCHEMAS) {
            try {
                await this.iqdb.createTable(schema);
                console.log(` Table created: ${schema.tableName}`);
            }
            catch (error) {
                console.error(`Failed to create table ${schema.tableName}:`, error);
            }
        }
        console.log('Tables setup complete');
    }
    /**
     * Load knowledge graph and vectors for search
     */
    async loadKnowledgeBase() {
        console.log('Loading knowledge base...');
        // Note: This would typically read from IQDB tables
        // For now, we'll provide a method signature that users can implement
        throw new Error('loadKnowledgeBase must be implemented by reading from IQDB tables');
    }
    /**
     * Store a memory
     */
    async storeMemory(agentId, memoryType, content) {
        if (!this.initialized) {
            throw new Error('Memory system not initialized. Call initialize() first.');
        }
        // Determine storage strategy
        const strategy = (0, storage_1.determineStorageStrategy)(content);
        const contentHash = (0, storage_1.computeContentHash)(content);
        let storageRef;
        if (strategy.type === 'inline') {
            // Store directly in IQDB
            const memoryRow = {
                id: (0, uuid_1.v4)(),
                agentId,
                memoryType,
                contentHash,
                storageType: types_1.StorageType.INLINE,
                storageRef: 'self',
                createdAt: (0, storage_1.formatTimestamp)(),
                updatedAt: (0, storage_1.formatTimestamp)(),
                metadata: typeof content === 'object' ? content : { content }
            };
            storageRef = await this.iqdb.writeRow('agent_memory_metadata', memoryRow, true);
        }
        else {
            // Store in Pinocchio
            const sessionPubkey = await this.pinocchio.storeData(content, strategy.compression);
            const memoryRow = {
                id: (0, uuid_1.v4)(),
                agentId,
                memoryType,
                contentHash,
                storageType: types_1.StorageType.PINOCCHIO,
                storageRef: sessionPubkey,
                createdAt: (0, storage_1.formatTimestamp)(),
                updatedAt: (0, storage_1.formatTimestamp)(),
                metadata: {}
            };
            storageRef = await this.iqdb.writeRow('agent_memory_metadata', memoryRow, true);
        }
        // Invalidate cache
        this.memoryCache.delete(`memories:${agentId}:${memoryType}`);
        console.log(`Memory stored: ${storageRef}`);
        return storageRef;
    }
    /**
     * Store knowledge graph (nodes + edges)
     */
    async storeKnowledgeGraph(nodes, edges) {
        if (!this.initialized) {
            throw new Error('Memory system not initialized');
        }
        return await this.graphStorage.storeGraph(nodes, edges);
    }
    /**
     * Semantic search across memories
     */
    async search(queryVector, limit = 10, threshold = 0.0) {
        if (!this.initialized) {
            throw new Error('Memory system not initialized');
        }
        // Vector similarity search
        const similarNodes = await this.vectorSearch.search(queryVector, limit * 2, // Get more candidates
        threshold);
        // Expand with graph context
        const results = [];
        for (const { nodeId, score, node } of similarNodes.slice(0, limit)) {
            if (!node)
                continue;
            // Get related nodes (1-hop neighborhood)
            const subgraph = this.graphQuery.getSubgraph(nodeId, 1);
            results.push({
                node,
                score,
                context: subgraph
            });
        }
        return results;
    }
    /**
     * Search by text (requires embedding function)
     */
    async searchByText(text, embeddingFunction, limit = 10, threshold = 0.0) {
        const queryVector = await embeddingFunction(text);
        return this.search(queryVector, limit, threshold);
    }
    /**
     * Query by relationship
     */
    async queryByRelationship(startNodeId, relationship, maxDepth = 2) {
        const relatedNodeIds = this.graphQuery.bfsTraverse(startNodeId, maxDepth, [relationship]);
        return Array.from(relatedNodeIds)
            .map(id => this.graphQuery.getNode(id))
            .filter((node) => node !== null);
    }
    /**
     * Get subgraph around a node
     */
    getSubgraph(centerNodeId, radius = 1) {
        return this.graphQuery.getSubgraph(centerNodeId, radius);
    }
    /**
     * Find shortest path between nodes
     */
    findPath(startNodeId, endNodeId) {
        return this.graphQuery.findShortestPath(startNodeId, endNodeId);
    }
    /**
     * Get graph statistics
     */
    getGraphStats() {
        return this.graphQuery.getStats();
    }
    /**
     * Get vector cache statistics
     */
    getVectorStats() {
        return this.vectorSearch.getCacheStats();
    }
    /**
     * Clear all caches
     */
    clearCaches() {
        this.memoryCache.clear();
        this.vectorSearch.clearCache();
    }
    /**
     * Get adapters (for advanced usage)
     */
    getAdapters() {
        return {
            iqdb: this.iqdb,
            pinocchio: this.pinocchio,
            vectorStorage: this.vectorStorage,
            graphStorage: this.graphStorage
        };
    }
    /**
     * Get engines (for advanced usage)
     */
    getEngines() {
        return {
            vectorSearch: this.vectorSearch,
            graphQuery: this.graphQuery
        };
    }
}
exports.AgentMemorySystem = AgentMemorySystem;
/**
 * Create and initialize a new Agent Memory System
 */
async function createMemorySystem(config) {
    const system = new AgentMemorySystem(config);
    await system.initialize();
    return system;
}
//# sourceMappingURL=AgentMemorySystem.js.map