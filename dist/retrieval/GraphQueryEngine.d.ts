/**
 * Graph Query Engine for knowledge graph traversal and queries
 */
import { KnowledgeNode, KnowledgeEdge, Subgraph } from '../types';
/**
 * Graph Query Engine class
 */
export declare class GraphQueryEngine {
    private nodes;
    private edges;
    private reverseEdges;
    private edgesByRelationship;
    /**
     * Load graph from nodes and edges
     */
    loadGraph(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): void;
    /**
     * Get node by ID
     */
    getNode(nodeId: string): KnowledgeNode | null;
    /**
     * Get all nodes
     */
    getAllNodes(): KnowledgeNode[];
    /**
     * Get outgoing edges from a node
     */
    getOutgoingEdges(nodeId: string): KnowledgeEdge[];
    /**
     * Get incoming edges to a node
     */
    getIncomingEdges(nodeId: string): KnowledgeEdge[];
    /**
     * Get all edges for a node (both directions)
     */
    getAllEdges(nodeId: string): KnowledgeEdge[];
    /**
     * Get neighbors of a node
     */
    getNeighbors(nodeId: string, direction?: 'outgoing' | 'incoming' | 'both'): string[];
    /**
     * BFS traversal from a starting node
     */
    bfsTraverse(startNodeId: string, maxDepth?: number, relationshipFilter?: string[]): Set<string>;
    /**
     * DFS traversal from a starting node
     */
    dfsTraverse(startNodeId: string, maxDepth?: number, relationshipFilter?: string[]): Set<string>;
    /**
     * Find shortest path between two nodes
     */
    findShortestPath(startNodeId: string, endNodeId: string): string[] | null;
    /**
     * Find all paths between two nodes (up to max length)
     */
    findAllPaths(startNodeId: string, endNodeId: string, maxLength?: number): string[][];
    /**
     * Get subgraph around a center node
     */
    getSubgraph(centerNodeId: string, radius?: number): Subgraph;
    /**
     * Query nodes by type
     */
    queryNodesByType(type: string): KnowledgeNode[];
    /**
     * Query edges by relationship
     */
    queryEdgesByRelationship(relationship: string): KnowledgeEdge[];
    /**
     * Get connected components
     */
    getConnectedComponents(): Set<string>[];
    /**
     * Get graph statistics
     */
    getStats(): {
        nodeCount: number;
        edgeCount: number;
        avgDegree: number;
        maxDegree: number;
        componentCount: number;
    };
}
//# sourceMappingURL=GraphQueryEngine.d.ts.map