/**
 * Table schemas for on-chain memory system
 */
import { TableSchema } from '../types';
/**
 * Schema for agent_memory_metadata table
 */
export declare const MEMORY_METADATA_SCHEMA: TableSchema;
/**
 * Schema for agent_knowledge_nodes table
 */
export declare const KNOWLEDGE_NODES_SCHEMA: TableSchema;
/**
 * Schema for agent_knowledge_edges table
 */
export declare const KNOWLEDGE_EDGES_SCHEMA: TableSchema;
/**
 * Schema for agent_datasets table
 */
export declare const DATASETS_SCHEMA: TableSchema;
/**
 * Schema for agent_data_items table
 */
export declare const DATA_ITEMS_SCHEMA: TableSchema;
/**
 * All table schemas
 */
export declare const ALL_SCHEMAS: TableSchema[];
/**
 * Get schema by table name
 */
export declare function getSchema(tableName: string): TableSchema | null;
/**
 * Validate row against schema
 */
export declare function validateRow(tableName: string, row: Record<string, any>): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=schemas.d.ts.map