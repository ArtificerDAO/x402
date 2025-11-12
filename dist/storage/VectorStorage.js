"use strict";
/**
 * Vector Storage for embedding management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStorage = void 0;
const PinocchioAdapter_1 = require("./PinocchioAdapter");
const IQDBAdapter_1 = require("./IQDBAdapter");
const schemas_1 = require("../config/schemas");
const uuid_1 = require("uuid");
const storage_1 = require("../utils/storage");
/**
 * Vector Storage class for managing embeddings
 */
class VectorStorage {
    constructor(config) {
        this.pinocchio = new PinocchioAdapter_1.PinocchioAdapter(config);
        this.iqdb = new IQDBAdapter_1.IQDBAdapter(config);
    }
    /**
     * Initialize vector storage
     */
    async initialize() {
        await this.iqdb.initialize();
    }
    /**
     * Validate a vector for common issues that can cause failures
     * Throws errors for:
     * - Empty vectors
     * - Zero vectors (all components = 0)
     * - NaN or Infinity values
     * - Non-numeric values
     */
    validateVector(vector, context = 'vector') {
        // Check if vector is empty
        if (!vector || vector.length === 0) {
            throw new Error(`Invalid ${context}: Vector cannot be empty`);
        }
        // Check for NaN or Infinity values
        const hasInvalidValues = vector.some(val => {
            if (typeof val !== 'number') {
                throw new Error(`Invalid ${context}: Vector contains non-numeric value: ${val}`);
            }
            return !isFinite(val);
        });
        if (hasInvalidValues) {
            throw new Error(`Invalid ${context}: Vector contains NaN or Infinity values`);
        }
        // Check if it's a zero vector (will cause division by zero in normalization)
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) {
            throw new Error(`Invalid ${context}: Zero vector (all components are 0) cannot be normalized for similarity calculations`);
        }
        // All validation passed
    }
    /**
     * Store a vector embedding with associated node data
     */
    async storeVector(nodeId, name, type, description, vector, properties = {}) {
        // Validate vector before storing
        this.validateVector(vector, `vector for node ${nodeId}`);
        // 1. Store vector in Pinocchio
        const vectorSession = await this.pinocchio.storeData(vector, false);
        // 2. Store node metadata in IQDB
        const nodeRow = {
            id: (0, uuid_1.v4)(),
            nodeId,
            name,
            type,
            description: description.substring(0, 200), // Truncate for inline storage
            properties: properties || {},
            vectorSession,
            createdAt: (0, storage_1.formatTimestamp)(),
            updatedAt: (0, storage_1.formatTimestamp)()
        };
        await this.iqdb.writeRow(schemas_1.KNOWLEDGE_NODES_SCHEMA.tableName, nodeRow, true);
        // 3. If description is long, store full version in Pinocchio
        if (description.length > 200) {
            const descSession = await this.pinocchio.storeData(description, false);
            // Update node with description reference
            // Note: This would require implementing an update mechanism
        }
        return nodeRow.id;
    }
    /**
     * Store multiple vectors in batch
     */
    async batchStoreVectors(nodes) {
        const ids = [];
        // Process in parallel batches
        const BATCH_SIZE = 5;
        for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
            const batch = nodes.slice(i, i + BATCH_SIZE);
            const batchIds = await Promise.all(batch.map(node => this.storeVector(node.nodeId, node.name, node.type, node.description, node.vector, node.properties)));
            ids.push(...batchIds);
            console.log(`Stored vectors: ${i + batch.length}/${nodes.length}`);
        }
        return ids;
    }
    /**
     * Load a vector from storage
     */
    async loadVector(vectorSession) {
        return await this.pinocchio.readJSON(vectorSession);
    }
    /**
     * Load all vectors for a set of nodes
     */
    async loadVectors(nodes) {
        const vectorMap = new Map();
        // Load in parallel batches
        const BATCH_SIZE = 10;
        for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
            const batch = nodes.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (node) => {
                if (node.vectorSession && node.vectorSession !== 'null') {
                    try {
                        const vector = await this.loadVector(node.vectorSession);
                        vectorMap.set(node.nodeId, vector);
                    }
                    catch (error) {
                        console.error(`Failed to load vector for node ${node.nodeId}:`, error);
                    }
                }
            }));
            console.log(`Loaded vectors: ${i + batch.length}/${nodes.length}`);
        }
        return vectorMap;
    }
    /**
     * Update a vector
     */
    async updateVector(nodeId, vector) {
        // Validate vector before updating
        this.validateVector(vector, `updated vector for node ${nodeId}`);
        // Store new vector in Pinocchio
        const newVectorSession = await this.pinocchio.storeData(vector, false);
        // Update node metadata
        // Note: This would require implementing the update mechanism
        // For now, we just return the new session
        return newVectorSession;
    }
    /**
     * Delete a vector (mark as deleted)
     */
    async deleteVector(nodeId) {
        // Mark node as deleted
        // Note: Actual implementation would update the node row
        console.log(`Vector deleted for node: ${nodeId}`);
    }
}
exports.VectorStorage = VectorStorage;
//# sourceMappingURL=VectorStorage.js.map