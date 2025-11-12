/**
 * Syncable Memory Index
 *
 * Local cache that syncs with on-chain Pinocchio sessions.
 * - Fast local lookups
 * - Periodic sync to discover new memories
 * - Pinocchio is the source of truth
 */
import { Connection, Keypair } from '@solana/web3.js';
import { LocalMemoryIndex } from './LocalMemoryIndex';
export interface SyncResult {
    discovered: number;
    added: number;
    skipped: number;
    errors: number;
    lastSyncTime: string;
}
export declare class SyncableMemoryIndex extends LocalMemoryIndex {
    private connection;
    private wallet;
    private storage;
    private lastSyncPath;
    constructor(connection: Connection, wallet: Keypair, indexPath?: string);
    /**
     * Get last sync timestamp
     */
    private getLastSyncTime;
    /**
     * Save last sync timestamp
     */
    private saveLastSyncTime;
    /**
     * Get all Pinocchio session PDAs for this wallet
     * Uses RPC getProgramAccounts
     */
    private getAllSessionPDAs;
    /**
     * Sync with on-chain Pinocchio sessions
     * Discovers new memories and adds them to local cache
     */
    sync(options?: {
        downloadAll?: boolean;
        maxDownloads?: number;
    }): Promise<SyncResult>;
    /**
     * Check if sync is needed (based on time threshold)
     */
    shouldSync(thresholdMinutes?: number): boolean;
    /**
     * Auto-sync if needed (convenience method)
     */
    autoSync(thresholdMinutes?: number): Promise<SyncResult | null>;
}
//# sourceMappingURL=SyncableMemoryIndex.d.ts.map