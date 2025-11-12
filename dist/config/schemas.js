"use strict";
/**
 * Table schemas for on-chain memory system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_SCHEMAS = exports.DATA_ITEMS_SCHEMA = exports.DATASETS_SCHEMA = exports.KNOWLEDGE_EDGES_SCHEMA = exports.KNOWLEDGE_NODES_SCHEMA = exports.MEMORY_METADATA_SCHEMA = void 0;
exports.getSchema = getSchema;
exports.validateRow = validateRow;
/**
 * Schema for agent_memory_metadata table
 */
exports.MEMORY_METADATA_SCHEMA = {
    tableName: 'agent_memory_metadata',
    columns: [
        'id',
        'agent_id',
        'memory_type',
        'content_hash',
        'storage_type',
        'storage_ref',
        'created_at',
        'updated_at',
        'metadata'
    ],
    idColumn: 'id'
};
/**
 * Schema for agent_knowledge_nodes table
 */
exports.KNOWLEDGE_NODES_SCHEMA = {
    tableName: 'agent_knowledge_nodes',
    columns: [
        'id',
        'node_id',
        'name',
        'type',
        'description',
        'properties',
        'vector_session',
        'created_at',
        'updated_at'
    ],
    idColumn: 'id'
};
/**
 * Schema for agent_knowledge_edges table
 */
exports.KNOWLEDGE_EDGES_SCHEMA = {
    tableName: 'agent_knowledge_edges',
    columns: [
        'id',
        'source_node_id',
        'target_node_id',
        'relationship_name',
        'properties',
        'weight',
        'created_at',
        'updated_at'
    ],
    idColumn: 'id',
    extKeys: ['source_node_id', 'target_node_id']
};
/**
 * Schema for agent_datasets table
 */
exports.DATASETS_SCHEMA = {
    tableName: 'agent_datasets',
    columns: [
        'id',
        'name',
        'agent_id',
        'owner_id',
        'created_at',
        'updated_at'
    ],
    idColumn: 'id'
};
/**
 * Schema for agent_data_items table
 */
exports.DATA_ITEMS_SCHEMA = {
    tableName: 'agent_data_items',
    columns: [
        'id',
        'dataset_id',
        'name',
        'content_hash',
        'storage_ref',
        'mime_type',
        'token_count',
        'data_size',
        'node_set',
        'pipeline_status',
        'created_at',
        'updated_at'
    ],
    idColumn: 'id',
    extKeys: ['dataset_id']
};
/**
 * All table schemas
 */
exports.ALL_SCHEMAS = [
    exports.MEMORY_METADATA_SCHEMA,
    exports.KNOWLEDGE_NODES_SCHEMA,
    exports.KNOWLEDGE_EDGES_SCHEMA,
    exports.DATASETS_SCHEMA,
    exports.DATA_ITEMS_SCHEMA
];
/**
 * Get schema by table name
 */
function getSchema(tableName) {
    return exports.ALL_SCHEMAS.find(schema => schema.tableName === tableName) || null;
}
/**
 * Validate row against schema
 */
function validateRow(tableName, row) {
    const schema = getSchema(tableName);
    if (!schema) {
        return { valid: false, errors: [`Schema not found for table: ${tableName}`] };
    }
    const errors = [];
    const rowKeys = Object.keys(row);
    // Check all required columns are present
    for (const column of schema.columns) {
        if (!rowKeys.includes(column)) {
            errors.push(`Missing required column: ${column}`);
        }
    }
    // Check no extra columns
    for (const key of rowKeys) {
        if (!schema.columns.includes(key)) {
            errors.push(`Unexpected column: ${key}`);
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=schemas.js.map