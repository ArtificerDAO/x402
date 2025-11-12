"use strict";
/**
 * Integration Tests
 * Tests the full system with mocked blockchain interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const VectorSearchEngine_1 = require("../retrieval/VectorSearchEngine");
const GraphQueryEngine_1 = require("../retrieval/GraphQueryEngine");
// Mock configuration
const mockConfig = {
    rpcUrl: 'https://api.devnet.solana.com',
    programId: '7Vk5JJDxUBAaaAkpYQpWYCZNz4SVPm3mJFSxrBzTQuAX',
    idl: {},
    wallet: {
        publicKey: {},
        signTransaction: async (tx) => tx,
        signAllTransactions: async (txs) => txs
    }
};
// Mock embedding function
function createMockEmbedding(text, dimension = 128) {
    const vector = new Array(dimension).fill(0);
    for (let i = 0; i < Math.min(text.length, dimension); i++) {
        vector[i] = (text.charCodeAt(i) % 256) / 128 - 1;
    }
    return vector;
}
describe('Integration Tests', () => {
    describe('Complete Workflow', () => {
        it('should handle full knowledge graph workflow', async () => {
            // Create sample data
            const nodes = [
                {
                    id: '1',
                    nodeId: 'alice',
                    name: 'Alice',
                    type: 'Person',
                    description: 'Software engineer',
                    properties: '{"age": 30}',
                    vectorSession: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: '2',
                    nodeId: 'bob',
                    name: 'Bob',
                    type: 'Person',
                    description: 'Product manager',
                    properties: '{"age": 35}',
                    vectorSession: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: '3',
                    nodeId: 'techcorp',
                    name: 'TechCorp',
                    type: 'Company',
                    description: 'Technology company',
                    properties: '{"size": 500}',
                    vectorSession: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            const edges = [
                {
                    id: 'e1',
                    sourceNodeId: 'alice',
                    targetNodeId: 'techcorp',
                    relationshipName: 'works_at',
                    properties: '{}',
                    weight: 1.0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'e2',
                    sourceNodeId: 'bob',
                    targetNodeId: 'techcorp',
                    relationshipName: 'works_at',
                    properties: '{}',
                    weight: 1.0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            // Load into graph engine
            const graphQuery = new GraphQueryEngine_1.GraphQueryEngine();
            graphQuery.loadGraph(nodes, edges);
            // Test graph operations
            const aliceNeighbors = graphQuery.getNeighbors('alice');
            expect(aliceNeighbors).toContain('techcorp');
            const path = graphQuery.findShortestPath('alice', 'bob');
            expect(path).toEqual(['alice', 'techcorp', 'bob']);
            const subgraph = graphQuery.getSubgraph('techcorp', 1);
            expect(subgraph.nodes.length).toBe(3);
            expect(subgraph.edges.length).toBe(2);
            const stats = graphQuery.getStats();
            expect(stats.nodeCount).toBe(3);
            expect(stats.edgeCount).toBe(2);
        });
        it('should handle vector search workflow', async () => {
            const vectorSearch = new VectorSearchEngine_1.VectorSearchEngine(mockConfig);
            // Create test vectors
            const aliceVector = new Float32Array(createMockEmbedding('software engineer AI'));
            const bobVector = new Float32Array(createMockEmbedding('product manager'));
            const queryVector = createMockEmbedding('engineer programming');
            // Manually populate cache
            vectorSearch.nodeIdToVector.set('alice', aliceVector);
            vectorSearch.nodeIdToVector.set('bob', bobVector);
            vectorSearch.vectorMetadata.set('alice', {
                nodeId: 'alice',
                name: 'Alice'
            });
            vectorSearch.vectorMetadata.set('bob', {
                nodeId: 'bob',
                name: 'Bob'
            });
            // Search
            const results = await vectorSearch.search(queryVector, 2);
            expect(results.length).toBe(2);
            expect(results[0].score).toBeGreaterThan(0);
            expect(results[0].score).toBeGreaterThan(results[1].score);
        });
    });
    describe('Error Handling', () => {
        it('should handle missing nodes gracefully', () => {
            const graphQuery = new GraphQueryEngine_1.GraphQueryEngine();
            graphQuery.loadGraph([], []);
            const node = graphQuery.getNode('nonexistent');
            expect(node).toBeNull();
            const neighbors = graphQuery.getNeighbors('nonexistent');
            expect(neighbors).toEqual([]);
        });
        it('should handle empty graph queries', () => {
            const graphQuery = new GraphQueryEngine_1.GraphQueryEngine();
            graphQuery.loadGraph([], []);
            const path = graphQuery.findShortestPath('a', 'b');
            expect(path).toBeNull();
            const subgraph = graphQuery.getSubgraph('a', 1);
            expect(subgraph.nodes).toEqual([]);
            expect(subgraph.edges).toEqual([]);
        });
        it('should handle vector dimension mismatch', async () => {
            const vectorSearch = new VectorSearchEngine_1.VectorSearchEngine(mockConfig);
            const vector1 = new Float32Array([1, 0, 0]);
            const vector2 = new Float32Array([1, 0]); // Different dimension
            expect(() => {
                vectorSearch.cosineSimilarity(vector1, vector2);
            }).toThrow();
        });
    });
    describe('Performance', () => {
        it('should handle large graph efficiently', () => {
            const graphQuery = new GraphQueryEngine_1.GraphQueryEngine();
            // Create 1000 nodes
            const nodes = [];
            for (let i = 0; i < 1000; i++) {
                nodes.push({
                    id: `${i}`,
                    nodeId: `node-${i}`,
                    name: `Node ${i}`,
                    type: 'Test',
                    description: 'Test node',
                    properties: '{}',
                    vectorSession: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            // Create edges (chain)
            const edges = [];
            for (let i = 0; i < 999; i++) {
                edges.push({
                    id: `e${i}`,
                    sourceNodeId: `node-${i}`,
                    targetNodeId: `node-${i + 1}`,
                    relationshipName: 'connects_to',
                    properties: '{}',
                    weight: 1.0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            const startLoad = Date.now();
            graphQuery.loadGraph(nodes, edges);
            const loadTime = Date.now() - startLoad;
            expect(loadTime).toBeLessThan(1000); // Should load in <1 second
            const startBFS = Date.now();
            const visited = graphQuery.bfsTraverse('node-0', 10);
            const bfsTime = Date.now() - startBFS;
            expect(bfsTime).toBeLessThan(100); // BFS should be <100ms
            expect(visited.size).toBeGreaterThan(0);
        });
        it('should handle vector search on 1000 vectors', async () => {
            const vectorSearch = new VectorSearchEngine_1.VectorSearchEngine(mockConfig);
            // Create 1000 vectors
            for (let i = 0; i < 1000; i++) {
                const vector = new Float32Array(128);
                for (let j = 0; j < 128; j++) {
                    vector[j] = Math.random() * 2 - 1;
                }
                vectorSearch.nodeIdToVector.set(`node-${i}`, vector);
            }
            const queryVector = Array(128).fill(0).map(() => Math.random() * 2 - 1);
            const startSearch = Date.now();
            const results = await vectorSearch.search(queryVector, 10);
            const searchTime = Date.now() - startSearch;
            expect(searchTime).toBeLessThan(1000); // Should search in <1 second
            expect(results.length).toBe(10);
        });
    });
    describe('Data Integrity', () => {
        it('should maintain graph consistency', () => {
            const graphQuery = new GraphQueryEngine_1.GraphQueryEngine();
            const nodes = [
                {
                    id: '1',
                    nodeId: 'a',
                    name: 'A',
                    type: 'Test',
                    description: 'Test',
                    properties: '{}',
                    vectorSession: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: '2',
                    nodeId: 'b',
                    name: 'B',
                    type: 'Test',
                    description: 'Test',
                    properties: '{}',
                    vectorSession: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            const edges = [
                {
                    id: 'e1',
                    sourceNodeId: 'a',
                    targetNodeId: 'b',
                    relationshipName: 'connects',
                    properties: '{}',
                    weight: 1.0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            graphQuery.loadGraph(nodes, edges);
            // Check forward edge
            const outgoing = graphQuery.getOutgoingEdges('a');
            expect(outgoing.length).toBe(1);
            expect(outgoing[0].targetNodeId).toBe('b');
            // Check reverse edge
            const incoming = graphQuery.getIncomingEdges('b');
            expect(incoming.length).toBe(1);
            expect(incoming[0].sourceNodeId).toBe('a');
        });
        it('should normalize vector similarity scores', async () => {
            const vectorSearch = new VectorSearchEngine_1.VectorSearchEngine(mockConfig);
            const v1 = new Float32Array([1, 0, 0]);
            const v2 = new Float32Array([1, 0, 0]);
            const similarity = vectorSearch.cosineSimilarity(v1, v2);
            expect(similarity).toBeGreaterThanOrEqual(-1);
            expect(similarity).toBeLessThanOrEqual(1);
            expect(similarity).toBeCloseTo(1, 5);
        });
    });
});
//# sourceMappingURL=integration.test.js.map