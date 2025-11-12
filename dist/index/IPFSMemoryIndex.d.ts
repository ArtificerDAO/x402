/**
 * IPFS Memory Index - Decentralized Metadata Storage
 *
 * Architecture:
 * 1. Store metadata index on IPFS via NFT.Storage (fast, decentralized, FREE)
 * 2. Store IPFS CID on-chain (permanent pointer)
 * 3. Full memory data stored via Pinocchio (on-chain)
 *
 * Benefits:
 * - Fast metadata lookups via IPFS
 * - Permanent index (Filecoin backup via NFT.Storage)
 * - No size limits
 * - Decentralized and censorship-resistant
 * - FREE (no tokens needed)
 */
import { MemoryIndexEntry } from './LocalMemoryIndex';
export interface IPFSConfig {
    gateway?: string;
}
export declare class IPFSMemoryIndex {
    private initialized;
    private config;
    private apiKey;
    private gateway;
    private cidCache;
    constructor(config?: IPFSConfig & {
        apiKey?: string;
    });
    /**
     * Initialize IPFS connection
     */
    initialize(): Promise<void>;
    /**
     * Index a memory (store metadata on IPFS)
     * For now, simulates IPFS storage locally and generates a mock CID
     * In production, this would upload to a real IPFS pinning service
     */
    indexMemory(entry: MemoryIndexEntry): Promise<string>;
    /**
     * Generate a mock IPFS CID for testing
     */
    private generateMockCID;
    /**
     * Get memory metadata by IPFS CID
     */
    getMemoryByCID(cid: string): Promise<MemoryIndexEntry | null>;
    /**
     * Get memory metadata by memory ID (requires CID cache or lookup)
     */
    getMemoryById(memory_id: string): Promise<MemoryIndexEntry | null>;
    /**
     * Index multiple memories in batch
     */
    indexBatch(entries: MemoryIndexEntry[]): Promise<string[]>;
    /**
     * Create a user index (all memories for a user)
     */
    createUserIndex(user_id: string, memoryCIDs: string[]): Promise<string>;
    /**
     * Get user index (all memories for a user)
     */
    getUserIndex(cid: string): Promise<{
        user_id: string;
        memory_cids: string[];
        total_memories: number;
    } | null>;
    /**
     * Shutdown IPFS connection
     */
    shutdown(): Promise<void>;
    /**
     * Get CID cache (for persistence/backup)
     */
    getCIDCache(): Map<string, string>;
    /**
     * Load CID cache (from persistence/backup)
     */
    loadCIDCache(cache: Map<string, string> | Record<string, string>): void;
}
//# sourceMappingURL=IPFSMemoryIndex.d.ts.map