"use strict";
/**
 * Vector Search Engine for semantic similarity search
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorSearchEngine = void 0;
const PinocchioAdapter_1 = require("../storage/PinocchioAdapter");
/**
 * Vector Search Engine class
 */
class VectorSearchEngine {
    constructor(config) {
        this.vectorCache = new Map();
        this.nodeIdToVector = new Map();
        this.vectorMetadata = new Map();
        this.config = config;
        this.pinocchio = new PinocchioAdapter_1.PinocchioAdapter(config);
    }
    /**
     * Load all vectors from on-chain storage
     */
    async loadVectors(nodes) {
        console.log(`Loading ${nodes.length} vectors...`);
        // Filter nodes with vector embeddings
        const nodesWithVectors = nodes.filter(node => node.vectorSession && node.vectorSession !== 'null');
        console.log(`Found ${nodesWithVectors.length} nodes with vectors`);
        // Load in batches
        const BATCH_SIZE = 10;
        let loaded = 0;
        for (let i = 0; i < nodesWithVectors.length; i += BATCH_SIZE) {
            const batch = nodesWithVectors.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (node) => {
                try {
                    // Read vector from Pinocchio
                    const vectorData = await this.pinocchio.readJSON(node.vectorSession);
                    // Convert to Float32Array
                    const vectorArray = new Float32Array(vectorData);
                    // Store in cache
                    this.nodeIdToVector.set(node.nodeId, vectorArray);
                    this.vectorMetadata.set(node.nodeId, node);
                    loaded++;
                }
                catch (error) {
                    console.error(`Failed to load vector for node ${node.nodeId}:`, error);
                }
            }));
            console.log(`Loaded ${Math.min(i + BATCH_SIZE, nodesWithVectors.length)}/${nodesWithVectors.length} vectors`);
        }
        console.log(`Successfully loaded ${loaded} vectors`);
    }
    /**
     * Search for similar vectors using cosine similarity
     */
    async search(queryVector, limit = 10, threshold = 0.0) {
        const queryArray = new Float32Array(queryVector);
        const results = [];
        // Compute similarity for all vectors
        for (const [nodeId, vector] of this.nodeIdToVector.entries()) {
            const similarity = this.cosineSimilarity(queryArray, vector);
            if (similarity >= threshold) {
                results.push({
                    nodeId,
                    score: similarity,
                    node: this.vectorMetadata.get(nodeId)
                });
            }
        }
        // Sort by similarity (descending) and take top-K
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }
    /**
     * Search by text (requires embedding function)
     */
    async searchByText(text, limit = 10, threshold = 0.0, embeddingFunction) {
        // Get embedding for query text
        const queryVector = await embeddingFunction(text);
        // Search with vector
        return this.search(queryVector, limit, threshold);
    }
    /**
     * Batch search for multiple queries
     */
    async batchSearch(queryVectors, limit = 10, threshold = 0.0) {
        return Promise.all(queryVectors.map(query => this.search(query, limit, threshold)));
    }
    /**
     * Find nearest neighbors for a node
     */
    async findNearestNeighbors(nodeId, limit = 10) {
        const vector = this.nodeIdToVector.get(nodeId);
        if (!vector) {
            throw new Error(`Node not found: ${nodeId}`);
        }
        const results = await this.search(Array.from(vector), limit + 1, 0.0);
        // Filter out the query node itself
        return results.filter(r => r.nodeId !== nodeId).slice(0, limit);
    }
    /**
     * Cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0) {
            return 0;
        }
        return dotProduct / denominator;
    }
    /**
     * Dot product similarity
     */
    dotProduct(a, b) {
        let product = 0;
        for (let i = 0; i < a.length; i++) {
            product += a[i] * b[i];
        }
        return product;
    }
    /**
     * Euclidean distance
     */
    euclideanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
    /**
     * Manhattan distance
     */
    manhattanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.abs(a[i] - b[i]);
        }
        return sum;
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        let totalElements = 0;
        for (const vector of this.nodeIdToVector.values()) {
            totalElements += vector.length;
        }
        // Each float is 4 bytes
        const totalMemoryBytes = totalElements * 4;
        const totalMemoryMB = totalMemoryBytes / (1024 * 1024);
        return {
            vectorCount: this.nodeIdToVector.size,
            totalMemoryMB: Math.round(totalMemoryMB * 100) / 100
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.nodeIdToVector.clear();
        this.vectorMetadata.clear();
        this.vectorCache.clear();
    }
}
exports.VectorSearchEngine = VectorSearchEngine;
//# sourceMappingURL=VectorSearchEngine.js.map