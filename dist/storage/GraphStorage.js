"use strict";
/**
 * Graph Storage for knowledge graph management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphStorage = void 0;
const IQDBAdapter_1 = require("./IQDBAdapter");
const VectorStorage_1 = require("./VectorStorage");
const schemas_1 = require("../config/schemas");
const uuid_1 = require("uuid");
const storage_1 = require("../utils/storage");
/**
 * Graph Storage class for managing knowledge graphs
 */
class GraphStorage {
    constructor(config) {
        this.iqdb = new IQDBAdapter_1.IQDBAdapter(config);
        this.vectorStorage = new VectorStorage_1.VectorStorage(config);
    }
    /**
     * Initialize graph storage
     */
    async initialize() {
        await this.iqdb.initialize();
        await this.vectorStorage.initialize();
    }
    /**
     * Store a single node
     */
    async storeNode(nodeId, name, type, description, properties = {}, vector) {
        // If vector is provided, use VectorStorage
        if (vector) {
            return await this.vectorStorage.storeVector(nodeId, name, type, description, vector, properties);
        }
        // Otherwise, store node without vector
        const nodeRow = {
            id: (0, uuid_1.v4)(),
            nodeId,
            name,
            type,
            description: description.substring(0, 200),
            properties: properties || {},
            vectorSession: undefined,
            createdAt: (0, storage_1.formatTimestamp)(),
            updatedAt: (0, storage_1.formatTimestamp)()
        };
        await this.iqdb.writeRow(schemas_1.KNOWLEDGE_NODES_SCHEMA.tableName, nodeRow, true);
        return nodeRow.id;
    }
    /**
     * Store multiple nodes in batch
     */
    async batchStoreNodes(nodes) {
        // Separate nodes with and without vectors
        const nodesWithVectors = nodes.filter(n => n.vector);
        const nodesWithoutVectors = nodes.filter(n => !n.vector);
        const ids = [];
        // Store nodes with vectors
        if (nodesWithVectors.length > 0) {
            const vectorIds = await this.vectorStorage.batchStoreVectors(nodesWithVectors);
            ids.push(...vectorIds);
        }
        // Store nodes without vectors
        if (nodesWithoutVectors.length > 0) {
            const nodeRows = nodesWithoutVectors.map(node => ({
                id: (0, uuid_1.v4)(),
                nodeId: node.nodeId,
                name: node.name,
                type: node.type,
                description: node.description.substring(0, 200),
                properties: node.properties || {},
                vectorSession: undefined,
                createdAt: (0, storage_1.formatTimestamp)(),
                updatedAt: (0, storage_1.formatTimestamp)()
            }));
            await this.iqdb.batchWriteRows(schemas_1.KNOWLEDGE_NODES_SCHEMA.tableName, nodeRows, { parallel: true, batchSize: 10 });
            ids.push(...nodeRows.map(r => r.id));
        }
        return ids;
    }
    /**
     * Store a single edge
     */
    async storeEdge(sourceNodeId, targetNodeId, relationshipName, properties = {}, weight = 1.0) {
        const edgeRow = {
            id: (0, uuid_1.v4)(),
            sourceNodeId,
            targetNodeId,
            relationshipName,
            properties,
            weight,
            createdAt: (0, storage_1.formatTimestamp)(),
            updatedAt: (0, storage_1.formatTimestamp)()
        };
        await this.iqdb.writeRow(schemas_1.KNOWLEDGE_EDGES_SCHEMA.tableName, edgeRow, true);
        return edgeRow.id;
    }
    /**
     * Store multiple edges in batch
     */
    async batchStoreEdges(edges) {
        const edgeRows = edges.map(edge => ({
            id: (0, uuid_1.v4)(),
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            relationshipName: edge.relationshipName,
            properties: edge.properties || {},
            weight: edge.weight || 1.0,
            createdAt: (0, storage_1.formatTimestamp)(),
            updatedAt: (0, storage_1.formatTimestamp)()
        }));
        await this.iqdb.batchWriteRows(schemas_1.KNOWLEDGE_EDGES_SCHEMA.tableName, edgeRows, { parallel: true, batchSize: 10 });
        return edgeRows.map(r => r.id);
    }
    /**
     * Store an entire knowledge graph (nodes + edges)
     */
    async storeGraph(nodes, edges) {
        console.log(`Storing knowledge graph: ${nodes.length} nodes, ${edges.length} edges`);
        // Store nodes first
        const nodeIds = await this.batchStoreNodes(nodes);
        console.log(`Stored ${nodeIds.length} nodes`);
        // Then store edges
        const edgeIds = await this.batchStoreEdges(edges);
        console.log(`Stored ${edgeIds.length} edges`);
        return { nodeIds, edgeIds };
    }
    /**
     * Update node properties
     */
    async updateNode(nodeId, updates) {
        // Note: This would require implementing the update mechanism
        // For now, log the operation
        console.log(`Update node ${nodeId}:`, updates);
    }
    /**
     * Update edge properties
     */
    async updateEdge(edgeId, updates) {
        // Note: This would require implementing the update mechanism
        console.log(`Update edge ${edgeId}:`, updates);
    }
    /**
     * Delete a node
     */
    async deleteNode(nodeId) {
        // Mark as deleted
        console.log(`Delete node: ${nodeId}`);
    }
    /**
     * Delete an edge
     */
    async deleteEdge(edgeId) {
        // Mark as deleted
        console.log(`Delete edge: ${edgeId}`);
    }
    /**
     * Get node by nodeId from IQDB
     */
    async getNode(nodeId) {
        try {
            const rows = await this.iqdb.readRows(schemas_1.KNOWLEDGE_NODES_SCHEMA.tableName);
            const row = rows.find(r => r.nodeId === nodeId);
            if (!row)
                return null;
            return {
                id: row.id,
                nodeId: row.nodeId,
                name: row.name,
                type: row.type,
                description: row.description,
                properties: row.properties,
                vectorSession: row.vectorSession,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            };
        }
        catch (error) {
            console.error('Failed to read node from IQDB:', error);
            return null;
        }
    }
    /**
     * Get edges for a node from IQDB
     */
    async getNodeEdges(nodeId) {
        try {
            const rows = await this.iqdb.readRows(schemas_1.KNOWLEDGE_EDGES_SCHEMA.tableName);
            return rows
                .filter(r => r.sourceNodeId === nodeId || r.targetNodeId === nodeId)
                .map(row => ({
                id: row.id,
                sourceNodeId: row.sourceNodeId,
                targetNodeId: row.targetNodeId,
                relationshipName: row.relationshipName,
                properties: row.properties,
                weight: typeof row.weight === 'number' ? row.weight : parseFloat(row.weight),
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            }));
        }
        catch (error) {
            console.error('Failed to read edges from IQDB:', error);
            return [];
        }
    }
}
exports.GraphStorage = GraphStorage;
//# sourceMappingURL=GraphStorage.js.map