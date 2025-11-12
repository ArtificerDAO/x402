/**
 * Agent Memory System - Main API for on-chain memory management
 */
import { IQDBConfig, MemoryType, MemorySearchResult, KnowledgeNode, Subgraph } from './types';
import { IQDBAdapter } from './storage/IQDBAdapter';
import { PinocchioAdapter } from './storage/PinocchioAdapter';
import { VectorStorage } from './storage/VectorStorage';
import { GraphStorage } from './storage/GraphStorage';
import { VectorSearchEngine } from './retrieval/VectorSearchEngine';
import { GraphQueryEngine } from './retrieval/GraphQueryEngine';
/**
 * Agent Memory System class - Main entry point for the SDK
 */
export declare class AgentMemorySystem {
    private config;
    private iqdb;
    private pinocchio;
    private vectorStorage;
    private graphStorage;
    private vectorSearch;
    private graphQuery;
    private memoryCache;
    private initialized;
    constructor(config: IQDBConfig);
    /**
     * Initialize the memory system
     */
    initialize(): Promise<void>;
    /**
     * Create all required tables
     */
    setupTables(): Promise<void>;
    /**
     * Load knowledge graph and vectors for search
     */
    loadKnowledgeBase(): Promise<void>;
    /**
     * Store a memory
     */
    storeMemory(agentId: string, memoryType: MemoryType, content: any): Promise<string>;
    /**
     * Store knowledge graph (nodes + edges)
     */
    storeKnowledgeGraph(nodes: Array<{
        nodeId: string;
        name: string;
        type: string;
        description: string;
        properties?: Record<string, any>;
        vector?: number[];
    }>, edges: Array<{
        sourceNodeId: string;
        targetNodeId: string;
        relationshipName: string;
        properties?: Record<string, any>;
        weight?: number;
    }>): Promise<{
        nodeIds: string[];
        edgeIds: string[];
    }>;
    /**
     * Semantic search across memories
     */
    search(queryVector: number[], limit?: number, threshold?: number): Promise<MemorySearchResult[]>;
    /**
     * Search by text (requires embedding function)
     */
    searchByText(text: string, embeddingFunction: (text: string) => Promise<number[]>, limit?: number, threshold?: number): Promise<MemorySearchResult[]>;
    /**
     * Query by relationship
     */
    queryByRelationship(startNodeId: string, relationship: string, maxDepth?: number): Promise<KnowledgeNode[]>;
    /**
     * Get subgraph around a node
     */
    getSubgraph(centerNodeId: string, radius?: number): Subgraph;
    /**
     * Find shortest path between nodes
     */
    findPath(startNodeId: string, endNodeId: string): string[] | null;
    /**
     * Get graph statistics
     */
    getGraphStats(): {
        nodeCount: number;
        edgeCount: number;
        avgDegree: number;
        maxDegree: number;
        componentCount: number;
    };
    /**
     * Get vector cache statistics
     */
    getVectorStats(): {
        vectorCount: number;
        totalMemoryMB: number;
    };
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Get adapters (for advanced usage)
     */
    getAdapters(): {
        iqdb: IQDBAdapter;
        pinocchio: PinocchioAdapter;
        vectorStorage: VectorStorage;
        graphStorage: GraphStorage;
    };
    /**
     * Get engines (for advanced usage)
     */
    getEngines(): {
        vectorSearch: VectorSearchEngine;
        graphQuery: GraphQueryEngine;
    };
}
/**
 * Create and initialize a new Agent Memory System
 */
export declare function createMemorySystem(config: IQDBConfig): Promise<AgentMemorySystem>;
//# sourceMappingURL=AgentMemorySystem.d.ts.map