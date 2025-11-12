/**
 * Memory Index for On-Chain Cognee Data
 *
 * Provides fast lookups by:
 * - Memory ID
 * - User ID
 * - Tags/Keywords
 * - Data type
 * - Time range
 *
 * Architecture:
 * - Index stored in IQDB (metadata only, small & fast)
 * - Full data stored in Pinocchio (on-chain, immutable)
 */
import { Connection, Keypair } from '@solana/web3.js';
export interface MemoryIndexEntry {
    memory_id: string;
    user_id: string;
    session_pubkey: string;
    memory_type: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    size: number;
    cost: number;
    num_chunks: number;
    num_entities: number;
    num_relationships: number;
    has_embeddings: boolean;
    preview: string;
}
export interface SearchQuery {
    user_id?: string;
    memory_type?: string;
    tags?: string[];
    memory_ids?: string[];
    time_from?: string;
    time_to?: string;
    has_embeddings?: boolean;
}
export declare class MemoryIndex {
    private api;
    private wallet;
    private indexName;
    constructor(connection: Connection, wallet: Keypair, indexName?: string);
    /**
     * Index a memory entry (called after storing to Pinocchio)
     */
    indexMemory(entry: MemoryIndexEntry): Promise<void>;
    /**
     * Get memory metadata by ID
     */
    getMemoryById(memory_id: string): Promise<MemoryIndexEntry | null>;
    /**
     * Search memories by criteria
     *
     * Note: This is a simple implementation. For production, you'd want:
     * - Proper indexing strategy
     * - Pagination
     * - More efficient tag queries
     * - Vector search for semantic queries
     */
    searchMemories(query: SearchQuery): Promise<MemoryIndexEntry[]>;
    /**
     * Get all memories for a user
     *
     * Note: In production, you'd want pagination and proper indexing
     */
    getMemoriesByUser(user_id: string, limit?: number): Promise<MemoryIndexEntry[]>;
    /**
     * Search by keyword (in tags or preview text)
     */
    searchByKeyword(keyword: string, limit?: number): Promise<MemoryIndexEntry[]>;
}
//# sourceMappingURL=MemoryIndex.d.ts.map