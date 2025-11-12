/**
 * Large Data Storage using Pinocchio
 *
 * Handles storage and retrieval of data > 50 bytes using IQLabs' Pinocchio API.
 */
import { Connection, Keypair } from '@solana/web3.js';
import { SessionMetadata } from '../api/IQLabsAPI';
export interface StorageResult {
    sessionPubkey: string;
    sessionId: string;
    size: number;
    chunks: number;
    signatures: string[];
    merkleRoot: string;
    compressed: boolean;
    originalSize: number;
    compressedSize: number;
    cost?: number;
    costPerMB?: number;
}
export interface RetrievalResult {
    data: string;
    size: number;
    metadata: SessionMetadata;
}
export declare class LargeDataStorage {
    private api;
    private wallet;
    constructor(connection: Connection, wallet: Keypair);
    /**
     * Store large data using Pinocchio with smart compression
     */
    storeLargeData(data: string, useSequential?: boolean): Promise<StorageResult>;
    /**
     * Retrieve large data from Hybrid V2 with retry logic
     */
    retrieveLargeData(sessionPubkey: string, maxRetries?: number, retryDelay?: number): Promise<RetrievalResult>;
    /**
     * Check if a session is finalized
     */
    isSessionFinalized(sessionPubkey: string): Promise<boolean>;
    /**
     * Get session status
     */
    getSessionStatus(sessionPubkey: string): Promise<{
        status: string;
        totalChunks: number;
        owner: string;
    }>;
}
//# sourceMappingURL=LargeDataStorage.d.ts.map