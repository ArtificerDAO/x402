/**
 * Vector Storage for embedding management
 */
import { IQDBConfig, KnowledgeNode } from '../types';
/**
 * Vector Storage class for managing embeddings
 */
export declare class VectorStorage {
    private pinocchio;
    private iqdb;
    constructor(config: IQDBConfig);
    /**
     * Initialize vector storage
     */
    initialize(): Promise<void>;
    /**
     * Validate a vector for common issues that can cause failures
     * Throws errors for:
     * - Empty vectors
     * - Zero vectors (all components = 0)
     * - NaN or Infinity values
     * - Non-numeric values
     */
    private validateVector;
    /**
     * Store a vector embedding with associated node data
     */
    storeVector(nodeId: string, name: string, type: string, description: string, vector: number[], properties?: Record<string, any>): Promise<string>;
    /**
     * Store multiple vectors in batch
     */
    batchStoreVectors(nodes: Array<{
        nodeId: string;
        name: string;
        type: string;
        description: string;
        vector: number[];
        properties?: Record<string, any>;
    }>): Promise<string[]>;
    /**
     * Load a vector from storage
     */
    loadVector(vectorSession: string): Promise<number[]>;
    /**
     * Load all vectors for a set of nodes
     */
    loadVectors(nodes: KnowledgeNode[]): Promise<Map<string, number[]>>;
    /**
     * Update a vector
     */
    updateVector(nodeId: string, vector: number[]): Promise<string>;
    /**
     * Delete a vector (mark as deleted)
     */
    deleteVector(nodeId: string): Promise<void>;
}
//# sourceMappingURL=VectorStorage.d.ts.map