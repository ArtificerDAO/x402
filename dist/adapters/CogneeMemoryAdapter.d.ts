/**
 * Cognee Memory Adapter for On-Chain Storage
 *
 * Two-layer architecture:
 * 1. Metadata Layer (IQDB) - Fast lookups
 * 2. Full Data Layer (Pinocchio) - Complete memories
 */
import { Connection, Keypair } from '@solana/web3.js';
import { MemoryIndexEntry } from '../index/LocalMemoryIndex';
export interface DocumentChunk {
    chunk_id: string;
    text: string;
    chunk_index: number;
    chunk_size: number;
    cut_type: string;
    metadata?: Record<string, any>;
}
export interface Entity {
    entity_id: string;
    name: string;
    type: string;
    description: string;
    metadata?: Record<string, any>;
}
export interface Relationship {
    source_id: string;
    target_id: string;
    relationship_name: string;
    properties?: Record<string, any>;
}
export interface VectorEmbedding {
    chunk_id: string;
    vector: number[];
    dimensions: number;
    model: string;
}
export interface CogneeMemory {
    memory_id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    memory_type: string;
    tags?: string[];
    chunks: DocumentChunk[];
    entities: Entity[];
    relationships: Relationship[];
    embeddings?: VectorEmbedding[];
}
export interface MemoryStorageResult {
    memory_id: string;
    session_pubkey: string;
    cost: number;
    size: number;
}
export declare class CogneeMemoryAdapter {
    private storage;
    private index;
    private wallet;
    constructor(connection: Connection, wallet: Keypair, indexPath?: string);
    /**
     * Store a complete cognee memory on-chain
     */
    storeMemory(memory: CogneeMemory): Promise<MemoryStorageResult>;
    /**
     * Retrieve a memory from on-chain storage by session pubkey
     */
    getMemory(session_pubkey: string): Promise<CogneeMemory>;
    /**
     * Retrieve a memory by its memory ID (uses index for lookup)
     */
    getMemoryById(memory_id: string): Promise<CogneeMemory>;
    /**
     * Get memory metadata without downloading full data
     */
    getMemoryMetadata(memory_id: string): Promise<MemoryIndexEntry | null>;
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
     * Create a simple test memory
     */
    static createTestMemory(text: string, user_id: string, includeEmbeddings?: boolean): CogneeMemory;
}
//# sourceMappingURL=CogneeMemoryAdapter.d.ts.map