"use strict";
/**
 * Vector Search Engine Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const VectorSearchEngine_1 = require("../retrieval/VectorSearchEngine");
// Mock config
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
describe('VectorSearchEngine', () => {
    let engine;
    beforeEach(() => {
        engine = new VectorSearchEngine_1.VectorSearchEngine(mockConfig);
    });
    describe('cosine similarity', () => {
        it('should return 1.0 for identical vectors', async () => {
            const vector1 = [1, 0, 0];
            const vector2 = [1, 0, 0];
            // Access private method for testing
            const similarity = engine.cosineSimilarity(new Float32Array(vector1), new Float32Array(vector2));
            expect(similarity).toBeCloseTo(1.0, 5);
        });
        it('should return 0.0 for orthogonal vectors', async () => {
            const vector1 = [1, 0, 0];
            const vector2 = [0, 1, 0];
            const similarity = engine.cosineSimilarity(new Float32Array(vector1), new Float32Array(vector2));
            expect(similarity).toBeCloseTo(0.0, 5);
        });
        it('should return -1.0 for opposite vectors', async () => {
            const vector1 = [1, 0, 0];
            const vector2 = [-1, 0, 0];
            const similarity = engine.cosineSimilarity(new Float32Array(vector1), new Float32Array(vector2));
            expect(similarity).toBeCloseTo(-1.0, 5);
        });
    });
    describe('search', () => {
        it('should return results sorted by similarity', async () => {
            // Mock loaded vectors
            engine.nodeIdToVector.set('node1', new Float32Array([1, 0, 0]));
            engine.nodeIdToVector.set('node2', new Float32Array([0.9, 0.1, 0]));
            engine.nodeIdToVector.set('node3', new Float32Array([0, 1, 0]));
            const queryVector = [1, 0, 0];
            const results = await engine.search(queryVector, 10);
            expect(results.length).toBe(3);
            expect(results[0].nodeId).toBe('node1'); // Most similar
            expect(results[0].score).toBeGreaterThan(results[1].score);
            expect(results[1].score).toBeGreaterThan(results[2].score);
        });
        it('should respect limit parameter', async () => {
            engine.nodeIdToVector.set('node1', new Float32Array([1, 0, 0]));
            engine.nodeIdToVector.set('node2', new Float32Array([0.9, 0.1, 0]));
            engine.nodeIdToVector.set('node3', new Float32Array([0, 1, 0]));
            const results = await engine.search([1, 0, 0], 2);
            expect(results.length).toBe(2);
        });
        it('should respect threshold parameter', async () => {
            engine.nodeIdToVector.set('node1', new Float32Array([1, 0, 0]));
            engine.nodeIdToVector.set('node2', new Float32Array([0, 1, 0])); // Orthogonal
            const results = await engine.search([1, 0, 0], 10, 0.5);
            expect(results.length).toBe(1); // Only node1 above threshold
            expect(results[0].nodeId).toBe('node1');
        });
    });
    describe('cache statistics', () => {
        it('should return correct cache stats', () => {
            engine.nodeIdToVector.set('node1', new Float32Array(100));
            engine.nodeIdToVector.set('node2', new Float32Array(100));
            const stats = engine.getCacheStats();
            expect(stats.vectorCount).toBe(2);
            expect(stats.totalMemoryMB).toBeGreaterThan(0);
        });
    });
    describe('clearCache', () => {
        it('should clear all cached vectors', () => {
            engine.nodeIdToVector.set('node1', new Float32Array(100));
            engine.clearCache();
            const stats = engine.getCacheStats();
            expect(stats.vectorCount).toBe(0);
            expect(stats.totalMemoryMB).toBe(0);
        });
    });
});
//# sourceMappingURL=VectorSearchEngine.test.js.map