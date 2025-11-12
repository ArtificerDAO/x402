/**
 * IQDB Memory Index - On-Chain Metadata Storage
 *
 * Uses IQLabs IQDB for storing memory metadata on-chain.
 * This provides decentralized, permanent indexing for fast memory lookups.
 */
import { Connection, Keypair } from '@solana/web3.js';
import { MemoryIndexEntry } from './LocalMemoryIndex';
export interface IQDBConfig {
    connection: Connection;
    wallet: Keypair;
    tableName?: string;
}
export declare class IQDBMemoryIndex {
    private connection;
    private wallet;
    private tableName;
    private iqdb;
    private initialized;
    constructor(config: IQDBConfig);
    /**
     * Initialize IQDB connection and ensure table exists
     */
    initialize(): Promise<void>;
    /**
     * Convert full memory_id (UUID) to single-char ID for IQDB
     * Uses deterministic hashing to ensure consistency
     */
    private getShortId;
    /**
     * Index a memory (store metadata in IQDB)
     */
    indexMemory(entry: MemoryIndexEntry): Promise<void>;
    /**
     * Get memory metadata by ID
     */
    getMemoryById(memory_id: string): Promise<MemoryIndexEntry | null>;
    /**
     * Search memories by criteria
     */
    searchMemories(query: {
        user_id?: string;
        memory_type?: string;
        tags?: string[];
        memory_ids?: string[];
    }): Promise<MemoryIndexEntry[]>;
    /**
     * Get all memories
     */
    getAllMemories(): Promise<MemoryIndexEntry[]>;
}
//# sourceMappingURL=IQDBMemoryIndex.d.ts.map