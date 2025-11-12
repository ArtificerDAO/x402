/**
 * Local Memory Index
 *
 * Simple in-memory/file-based index for Cognee memories
 * Can be upgraded to on-chain indexing later when IQDB or similar service is available
 *
 * For production, you'd want to use:
 * - Database (PostgreSQL, MongoDB, etc.)
 * - Redis for caching
 * - Vector database for semantic search
 */
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
export declare class LocalMemoryIndex {
    private indexPath;
    private index;
    constructor(indexPath?: string);
    /**
     * Load index from file
     */
    private loadIndex;
    /**
     * Save index to file
     */
    private saveIndex;
    /**
     * Index a memory entry
     */
    indexMemory(entry: MemoryIndexEntry): Promise<void>;
    /**
     * Get memory metadata by ID
     */
    getMemoryById(memory_id: string): Promise<MemoryIndexEntry | null>;
    /**
     * Search memories by criteria
     */
    searchMemories(query: SearchQuery): Promise<MemoryIndexEntry[]>;
    /**
     * Get all memories for a user
     */
    getMemoriesByUser(user_id: string, limit?: number): Promise<MemoryIndexEntry[]>;
    /**
     * Search by keyword (in tags or preview text)
     */
    searchByKeyword(keyword: string, limit?: number): Promise<MemoryIndexEntry[]>;
    /**
     * Delete a memory from index
     */
    deleteMemory(memory_id: string): Promise<boolean>;
    /**
     * Get all memories
     */
    getAllMemories(): Promise<MemoryIndexEntry[]>;
    /**
     * Get index statistics
     */
    getStats(): {
        total: number;
        by_user: Record<string, number>;
        by_type: Record<string, number>;
        total_size: number;
    };
}
//# sourceMappingURL=LocalMemoryIndex.d.ts.map