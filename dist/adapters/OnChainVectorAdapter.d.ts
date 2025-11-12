/**
 * OnChain Vector Adapter for Cognee
 *
 * Implements Cognee's VectorDBInterface using our fully on-chain database.
 * This adapter allows Cognee to store all embeddings and memories on Solana blockchain.
 */
import { Connection, Keypair } from '@solana/web3.js';
/**
 * DataPoint interface matching Cognee's structure
 */
export interface CogneeDataPoint {
    id: string;
    embedding?: number[];
    text?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
}
/**
 * Search result matching Cognee's expectations
 */
export interface SearchResult {
    id: string;
    score: number;
    payload: Record<string, any>;
    vector?: number[];
}
/**
 * OnChain Vector Adapter implementing Cognee's VectorDBInterface
 */
export declare class OnChainVectorAdapter {
    private connection;
    private wallet;
    private largeDataStorage;
    private rootName;
    private tableName;
    private embeddingDimensions;
    private initialized;
    private walletPath;
    constructor(connection: Connection, wallet: Keypair, rootName?: string, embeddingDimensions?: number);
    /**
     * Initialize the adapter
     */
    initialize(): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    /**
     * Check if a collection exists (checks if any data exists for this collection)
     */
    hasCollection(collectionName: string): Promise<boolean>;
    /**
     * Create a new collection
     *
     * With universal table approach, this is a logical operation - no new table created.
     * Collections are differentiated by the 'collection_name' column.
     */
    createCollection(collectionName: string, payloadSchema?: Record<string, any>): Promise<void>;
    /**
     * Helper: Get all references for a collection
     */
    private getCollectionReferences;
    /**
     * Helper: Check if ID exists in collection
     */
    private idExists;
    /**
     * Create (insert) data points into a collection
     *
     * PRODUCTION ARCHITECTURE:
     * - Check if ID already exists (skip duplicates for idempotency)
     * - Store ALL data (text, metadata, embedding) in Hybrid V2
     * - Store ONLY minimal reference (id + session) in IQDB for lookups
     *
     * This avoids IQDB's 50-byte limit and provides unlimited data storage!
     */
    createDataPoints(collectionName: string, dataPoints: CogneeDataPoint[]): Promise<void>;
    /**
     * Retrieve specific data points by IDs
     *
     * NEW ARCHITECTURE:
     * 1. Read minimal references from IQDB
     * 2. Download full data from Hybrid V2
     * 3. Return complete Cognee data points
     */
    retrieve(collectionName: string, dataPointIds: string[]): Promise<CogneeDataPoint[]>;
    /**
     * Search for similar vectors
     */
    search(collectionName: string, queryText: string | null, queryVector: number[] | null, limit?: number, withVector?: boolean): Promise<SearchResult[]>;
    /**
     * Batch search with multiple query texts
     */
    batchSearch(collectionName: string, queryTexts: string[], limit?: number, withVectors?: boolean): Promise<SearchResult[][]>;
    /**
     * Delete data points from a collection
     */
    deleteDataPoints(collectionName: string, dataPointIds: string[]): Promise<void>;
    /**
     * Prune obsolete data
     */
    prune(): Promise<void>;
    /**
     * Embed data (placeholder - Cognee handles this through EmbeddingEngine)
     */
    embedData(data: string[]): Promise<number[][]>;
    private cosineSimilarity;
    /**
     * Get collection statistics
     */
    getCollectionStats(collectionName: string): Promise<{
        name: string;
        count: number;
        created_at: string;
    } | null>;
    /**
     * List all collections
     * Scans universal table to find unique collection names
     */
    listCollections(): Promise<string[]>;
}
//# sourceMappingURL=OnChainVectorAdapter.d.ts.map