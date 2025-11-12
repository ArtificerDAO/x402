/**
 * IQDB Adapter for on-chain storage operations
 */
import { IQDBConfig, WriterContext, ReaderParams, IQDBRow, TableSchema, ReadOptions, BatchWriteOptions } from '../types';
/**
 * IQDB Adapter class for table operations
 */
export declare class IQDBAdapter {
    private connection;
    private config;
    private program;
    constructor(config: IQDBConfig);
    /**
     * Initialize the adapter and create program instance
     */
    initialize(): Promise<void>;
    /**
     * Get writer context for operations
     */
    getWriterContext(): WriterContext;
    /**
     * Get reader parameters
     */
    getReaderParams(): ReaderParams;
    /**
     * Create a table with the given schema
     */
    createTable(schema: TableSchema): Promise<string>;
    /**
     * Write a row to a table
     */
    writeRow(tableName: string, row: IQDBRow, validateSchema?: boolean): Promise<string>;
    /**
     * Write multiple rows in batch
     */
    batchWriteRows(tableName: string, rows: IQDBRow[], options?: BatchWriteOptions): Promise<string[]>;
    /**
     * Read rows from a table
     * Note: This is a placeholder. Actual implementation should use
     * the readRowsByTable function from IQDB SDK
     */
    readRows(tableName: string, options?: ReadOptions): Promise<IQDBRow[]>;
    /**
     * Update a row by pushing an instruction
     */
    updateRow(tableName: string, targetTxSignature: string, updates: Partial<IQDBRow>): Promise<string>;
    /**
     * Delete a row by pushing a delete instruction
     */
    deleteRow(tableName: string, targetTxSignature: string): Promise<string>;
}
//# sourceMappingURL=IQDBAdapter.d.ts.map