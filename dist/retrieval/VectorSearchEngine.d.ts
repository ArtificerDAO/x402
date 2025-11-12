/**
 * Vector Search Engine for semantic similarity search
 */
import { KnowledgeNode, VectorSearchResult, IQDBConfig } from '../types';
/**
 * Vector Search Engine class
 */
export declare class VectorSearchEngine {
    private vectorCache;
    private nodeIdToVector;
    private vectorMetadata;
    private pinocchio;
    private config;
    constructor(config: IQDBConfig);
    /**
     * Load all vectors from on-chain storage
     */
    loadVectors(nodes: KnowledgeNode[]): Promise<void>;
    /**
     * Search for similar vectors using cosine similarity
     */
    search(queryVector: number[], limit?: number, threshold?: number): Promise<VectorSearchResult[]>;
    /**
     * Search by text (requires embedding function)
     */
    searchByText(text: string, limit: number | undefined, threshold: number | undefined, embeddingFunction: (text: string) => Promise<number[]>): Promise<VectorSearchResult[]>;
    /**
     * Batch search for multiple queries
     */
    batchSearch(queryVectors: number[][], limit?: number, threshold?: number): Promise<VectorSearchResult[][]>;
    /**
     * Find nearest neighbors for a node
     */
    findNearestNeighbors(nodeId: string, limit?: number): Promise<VectorSearchResult[]>;
    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Dot product similarity
     */
    private dotProduct;
    /**
     * Euclidean distance
     */
    private euclideanDistance;
    /**
     * Manhattan distance
     */
    private manhattanDistance;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        vectorCount: number;
        totalMemoryMB: number;
    };
    /**
     * Clear cache
     */
    clearCache(): void;
}
//# sourceMappingURL=VectorSearchEngine.d.ts.map