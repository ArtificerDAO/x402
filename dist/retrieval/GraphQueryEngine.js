"use strict";
/**
 * Graph Query Engine for knowledge graph traversal and queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQueryEngine = void 0;
/**
 * Graph Query Engine class
 */
class GraphQueryEngine {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map(); // sourceNodeId -> edges
        this.reverseEdges = new Map(); // targetNodeId -> edges
        this.edgesByRelationship = new Map();
    }
    /**
     * Load graph from nodes and edges
     */
    loadGraph(nodes, edges) {
        console.log(`Loading graph: ${nodes.length} nodes, ${edges.length} edges`);
        // Clear existing data
        this.nodes.clear();
        this.edges.clear();
        this.reverseEdges.clear();
        this.edgesByRelationship.clear();
        // Load nodes
        for (const node of nodes) {
            this.nodes.set(node.nodeId, node);
        }
        // Build adjacency lists
        for (const edge of edges) {
            // Forward edges (outgoing)
            if (!this.edges.has(edge.sourceNodeId)) {
                this.edges.set(edge.sourceNodeId, []);
            }
            this.edges.get(edge.sourceNodeId).push(edge);
            // Reverse edges (incoming)
            if (!this.reverseEdges.has(edge.targetNodeId)) {
                this.reverseEdges.set(edge.targetNodeId, []);
            }
            this.reverseEdges.get(edge.targetNodeId).push(edge);
            // Index by relationship
            if (!this.edgesByRelationship.has(edge.relationshipName)) {
                this.edgesByRelationship.set(edge.relationshipName, []);
            }
            this.edgesByRelationship.get(edge.relationshipName).push(edge);
        }
        console.log(`Graph loaded successfully`);
    }
    /**
     * Get node by ID
     */
    getNode(nodeId) {
        return this.nodes.get(nodeId) || null;
    }
    /**
     * Get all nodes
     */
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    /**
     * Get outgoing edges from a node
     */
    getOutgoingEdges(nodeId) {
        return this.edges.get(nodeId) || [];
    }
    /**
     * Get incoming edges to a node
     */
    getIncomingEdges(nodeId) {
        return this.reverseEdges.get(nodeId) || [];
    }
    /**
     * Get all edges for a node (both directions)
     */
    getAllEdges(nodeId) {
        return [
            ...this.getOutgoingEdges(nodeId),
            ...this.getIncomingEdges(nodeId)
        ];
    }
    /**
     * Get neighbors of a node
     */
    getNeighbors(nodeId, direction = 'both') {
        const neighbors = new Set();
        if (direction === 'outgoing' || direction === 'both') {
            for (const edge of this.getOutgoingEdges(nodeId)) {
                neighbors.add(edge.targetNodeId);
            }
        }
        if (direction === 'incoming' || direction === 'both') {
            for (const edge of this.getIncomingEdges(nodeId)) {
                neighbors.add(edge.sourceNodeId);
            }
        }
        return Array.from(neighbors);
    }
    /**
     * BFS traversal from a starting node
     */
    bfsTraverse(startNodeId, maxDepth = 2, relationshipFilter) {
        const visited = new Set();
        const queue = [
            { nodeId: startNodeId, depth: 0 }
        ];
        while (queue.length > 0) {
            const { nodeId, depth } = queue.shift();
            if (visited.has(nodeId)) {
                continue;
            }
            visited.add(nodeId);
            if (depth < maxDepth) {
                // Add neighbors to queue
                const edges = this.getOutgoingEdges(nodeId);
                for (const edge of edges) {
                    // Filter by relationship if specified
                    if (!relationshipFilter ||
                        relationshipFilter.includes(edge.relationshipName)) {
                        if (!visited.has(edge.targetNodeId)) {
                            queue.push({
                                nodeId: edge.targetNodeId,
                                depth: depth + 1
                            });
                        }
                    }
                }
            }
        }
        return visited;
    }
    /**
     * DFS traversal from a starting node
     */
    dfsTraverse(startNodeId, maxDepth = 2, relationshipFilter) {
        const visited = new Set();
        const dfs = (nodeId, depth) => {
            if (visited.has(nodeId) || depth > maxDepth) {
                return;
            }
            visited.add(nodeId);
            if (depth < maxDepth) {
                const edges = this.getOutgoingEdges(nodeId);
                for (const edge of edges) {
                    if (!relationshipFilter ||
                        relationshipFilter.includes(edge.relationshipName)) {
                        dfs(edge.targetNodeId, depth + 1);
                    }
                }
            }
        };
        dfs(startNodeId, 0);
        return visited;
    }
    /**
     * Find shortest path between two nodes
     */
    findShortestPath(startNodeId, endNodeId) {
        const visited = new Set();
        const queue = [
            { nodeId: startNodeId, path: [startNodeId] }
        ];
        while (queue.length > 0) {
            const { nodeId, path } = queue.shift();
            if (nodeId === endNodeId) {
                return path;
            }
            if (visited.has(nodeId)) {
                continue;
            }
            visited.add(nodeId);
            // Add neighbors
            const neighbors = this.getNeighbors(nodeId, 'outgoing');
            for (const neighborId of neighbors) {
                if (!visited.has(neighborId)) {
                    queue.push({
                        nodeId: neighborId,
                        path: [...path, neighborId]
                    });
                }
            }
        }
        return null; // No path found
    }
    /**
     * Find all paths between two nodes (up to max length)
     */
    findAllPaths(startNodeId, endNodeId, maxLength = 5) {
        const paths = [];
        const dfs = (currentId, path) => {
            if (path.length > maxLength) {
                return;
            }
            if (currentId === endNodeId) {
                paths.push([...path]);
                return;
            }
            const neighbors = this.getNeighbors(currentId, 'outgoing');
            for (const neighborId of neighbors) {
                // Avoid cycles
                if (!path.includes(neighborId)) {
                    dfs(neighborId, [...path, neighborId]);
                }
            }
        };
        dfs(startNodeId, [startNodeId]);
        return paths;
    }
    /**
     * Get subgraph around a center node
     */
    getSubgraph(centerNodeId, radius = 1) {
        const nodeIds = this.bfsTraverse(centerNodeId, radius);
        const nodes = Array.from(nodeIds)
            .map(id => this.getNode(id))
            .filter((node) => node !== null);
        // Get edges between nodes in subgraph
        const edges = [];
        const edgeSet = new Set();
        for (const nodeId of nodeIds) {
            for (const edge of this.getOutgoingEdges(nodeId)) {
                if (nodeIds.has(edge.targetNodeId)) {
                    const edgeKey = `${edge.sourceNodeId}-${edge.targetNodeId}-${edge.relationshipName}`;
                    if (!edgeSet.has(edgeKey)) {
                        edges.push(edge);
                        edgeSet.add(edgeKey);
                    }
                }
            }
        }
        return { nodes, edges };
    }
    /**
     * Query nodes by type
     */
    queryNodesByType(type) {
        return Array.from(this.nodes.values()).filter(node => node.type === type);
    }
    /**
     * Query edges by relationship
     */
    queryEdgesByRelationship(relationship) {
        return this.edgesByRelationship.get(relationship) || [];
    }
    /**
     * Get connected components
     */
    getConnectedComponents() {
        const visited = new Set();
        const components = [];
        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                const component = this.bfsTraverse(nodeId, Infinity);
                components.push(component);
                for (const id of component) {
                    visited.add(id);
                }
            }
        }
        return components;
    }
    /**
     * Get graph statistics
     */
    getStats() {
        const nodeCount = this.nodes.size;
        let totalEdges = 0;
        let maxDegree = 0;
        for (const nodeId of this.nodes.keys()) {
            const degree = this.getAllEdges(nodeId).length;
            maxDegree = Math.max(maxDegree, degree);
        }
        // Count unique edges
        const edgeSet = new Set();
        for (const edges of this.edges.values()) {
            for (const edge of edges) {
                edgeSet.add(`${edge.sourceNodeId}-${edge.targetNodeId}`);
            }
        }
        totalEdges = edgeSet.size;
        const avgDegree = nodeCount > 0 ? (totalEdges * 2) / nodeCount : 0;
        const components = this.getConnectedComponents();
        return {
            nodeCount,
            edgeCount: totalEdges,
            avgDegree: Math.round(avgDegree * 100) / 100,
            maxDegree,
            componentCount: components.length
        };
    }
}
exports.GraphQueryEngine = GraphQueryEngine;
//# sourceMappingURL=GraphQueryEngine.js.map