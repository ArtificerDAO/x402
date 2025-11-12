/**
 * Graph Storage for knowledge graph management
 */
import { IQDBConfig, KnowledgeNode, KnowledgeEdge } from '../types';
/**
 * Graph Storage class for managing knowledge graphs
 */
export declare class GraphStorage {
    private iqdb;
    private vectorStorage;
    constructor(config: IQDBConfig);
    /**
     * Initialize graph storage
     */
    initialize(): Promise<void>;
    /**
     * Store a single node
     */
    storeNode(nodeId: string, name: string, type: string, description: string, properties?: Record<string, any>, vector?: number[]): Promise<string>;
    /**
     * Store multiple nodes in batch
     */
    batchStoreNodes(nodes: Array<{
        nodeId: string;
        name: string;
        type: string;
        description: string;
        properties?: Record<string, any>;
        vector?: number[];
    }>): Promise<string[]>;
    /**
     * Store a single edge
     */
    storeEdge(sourceNodeId: string, targetNodeId: string, relationshipName: string, properties?: Record<string, any>, weight?: number): Promise<string>;
    /**
     * Store multiple edges in batch
     */
    batchStoreEdges(edges: Array<{
        sourceNodeId: string;
        targetNodeId: string;
        relationshipName: string;
        properties?: Record<string, any>;
        weight?: number;
    }>): Promise<string[]>;
    /**
     * Store an entire knowledge graph (nodes + edges)
     */
    storeGraph(nodes: Array<{
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
     * Update node properties
     */
    updateNode(nodeId: string, updates: Partial<{
        name: string;
        type: string;
        description: string;
        properties: Record<string, any>;
    }>): Promise<void>;
    /**
     * Update edge properties
     */
    updateEdge(edgeId: string, updates: Partial<{
        relationshipName: string;
        properties: Record<string, any>;
        weight: number;
    }>): Promise<void>;
    /**
     * Delete a node
     */
    deleteNode(nodeId: string): Promise<void>;
    /**
     * Delete an edge
     */
    deleteEdge(edgeId: string): Promise<void>;
    /**
     * Get node by nodeId from IQDB
     */
    getNode(nodeId: string): Promise<KnowledgeNode | null>;
    /**
     * Get edges for a node from IQDB
     */
    getNodeEdges(nodeId: string): Promise<KnowledgeEdge[]>;
}
//# sourceMappingURL=GraphStorage.d.ts.map