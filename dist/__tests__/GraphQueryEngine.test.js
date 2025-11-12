"use strict";
/**
 * Graph Query Engine Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const GraphQueryEngine_1 = require("../retrieval/GraphQueryEngine");
describe('GraphQueryEngine', () => {
    let engine;
    let nodes;
    let edges;
    beforeEach(() => {
        engine = new GraphQueryEngine_1.GraphQueryEngine();
        // Create test graph: A -> B -> C, A -> D
        nodes = [
            {
                id: '1',
                nodeId: 'A',
                name: 'Node A',
                type: 'Type1',
                description: 'First node',
                properties: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                nodeId: 'B',
                name: 'Node B',
                type: 'Type1',
                description: 'Second node',
                properties: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '3',
                nodeId: 'C',
                name: 'Node C',
                type: 'Type2',
                description: 'Third node',
                properties: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '4',
                nodeId: 'D',
                name: 'Node D',
                type: 'Type2',
                description: 'Fourth node',
                properties: '{}',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        edges = [
            {
                id: 'e1',
                sourceNodeId: 'A',
                targetNodeId: 'B',
                relationshipName: 'rel1',
                properties: '{}',
                weight: 1.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'e2',
                sourceNodeId: 'B',
                targetNodeId: 'C',
                relationshipName: 'rel1',
                properties: '{}',
                weight: 1.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'e3',
                sourceNodeId: 'A',
                targetNodeId: 'D',
                relationshipName: 'rel2',
                properties: '{}',
                weight: 1.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        engine.loadGraph(nodes, edges);
    });
    describe('loadGraph', () => {
        it('should load nodes and edges correctly', () => {
            expect(engine.getAllNodes().length).toBe(4);
            expect(engine.getOutgoingEdges('A').length).toBe(2);
            expect(engine.getIncomingEdges('B').length).toBe(1);
        });
    });
    describe('getNode', () => {
        it('should return node by ID', () => {
            const node = engine.getNode('A');
            expect(node).not.toBeNull();
            expect(node.name).toBe('Node A');
        });
        it('should return null for non-existent node', () => {
            const node = engine.getNode('X');
            expect(node).toBeNull();
        });
    });
    describe('getNeighbors', () => {
        it('should return outgoing neighbors', () => {
            const neighbors = engine.getNeighbors('A', 'outgoing');
            expect(neighbors).toContain('B');
            expect(neighbors).toContain('D');
            expect(neighbors.length).toBe(2);
        });
        it('should return incoming neighbors', () => {
            const neighbors = engine.getNeighbors('B', 'incoming');
            expect(neighbors).toContain('A');
            expect(neighbors.length).toBe(1);
        });
        it('should return both directions', () => {
            const neighbors = engine.getNeighbors('B', 'both');
            expect(neighbors).toContain('A');
            expect(neighbors).toContain('C');
            expect(neighbors.length).toBe(2);
        });
    });
    describe('bfsTraverse', () => {
        it('should traverse graph with BFS', () => {
            const visited = engine.bfsTraverse('A', 2);
            expect(visited.has('A')).toBe(true);
            expect(visited.has('B')).toBe(true);
            expect(visited.has('C')).toBe(true);
            expect(visited.has('D')).toBe(true);
        });
        it('should respect max depth', () => {
            const visited = engine.bfsTraverse('A', 1);
            expect(visited.has('A')).toBe(true);
            expect(visited.has('B')).toBe(true);
            expect(visited.has('D')).toBe(true);
            expect(visited.has('C')).toBe(false); // Depth 2
        });
        it('should filter by relationship', () => {
            const visited = engine.bfsTraverse('A', 2, ['rel1']);
            expect(visited.has('A')).toBe(true);
            expect(visited.has('B')).toBe(true);
            expect(visited.has('C')).toBe(true);
            expect(visited.has('D')).toBe(false); // Connected by rel2
        });
    });
    describe('findShortestPath', () => {
        it('should find shortest path', () => {
            const path = engine.findShortestPath('A', 'C');
            expect(path).not.toBeNull();
            expect(path).toEqual(['A', 'B', 'C']);
        });
        it('should return null for disconnected nodes', () => {
            // Add isolated node
            engine.loadGraph([...nodes, {
                    id: '5',
                    nodeId: 'E',
                    name: 'Node E',
                    type: 'Type1',
                    description: 'Isolated',
                    properties: '{}',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }], edges);
            const path = engine.findShortestPath('A', 'E');
            expect(path).toBeNull();
        });
    });
    describe('getSubgraph', () => {
        it('should extract subgraph', () => {
            const subgraph = engine.getSubgraph('A', 1);
            expect(subgraph.nodes.length).toBe(3); // A, B, D
            expect(subgraph.edges.length).toBe(2); // A->B, A->D
        });
    });
    describe('queryNodesByType', () => {
        it('should filter nodes by type', () => {
            const type1Nodes = engine.queryNodesByType('Type1');
            expect(type1Nodes.length).toBe(2);
            expect(type1Nodes.map(n => n.nodeId)).toContain('A');
            expect(type1Nodes.map(n => n.nodeId)).toContain('B');
        });
    });
    describe('getStats', () => {
        it('should return correct graph statistics', () => {
            const stats = engine.getStats();
            expect(stats.nodeCount).toBe(4);
            expect(stats.edgeCount).toBe(3);
            expect(stats.componentCount).toBe(1);
        });
    });
});
//# sourceMappingURL=GraphQueryEngine.test.js.map