/**
 * IQLabs API Client
 *
 * Client for interacting with IQLabs' Pinocchio and Hybrid V2 APIs
 * for storing large data on Solana blockchain.
 */
import { Connection, Keypair } from '@solana/web3.js';
export interface PinocchioSessionResponse {
    sessionId: string;
    sessionPubkey?: string;
    createSessionTransaction: string;
    initStorageTransaction?: string;
    chunkTransactions: string[];
    finalizeTransaction: string;
    merkleRoot: string;
    totalChunks: number;
    uploadType: string;
}
export interface SessionMetadata {
    owner: string;
    sessionId: string;
    totalChunks: number;
    status: 'pending' | 'finalized';
    merkleRoot: string;
    storageAccount?: string;
}
export interface CreateSessionParams {
    pubkey: string;
    text?: string;
    chunks?: string[];
    chunkSize?: number;
    method?: number;
}
export declare class IQLabsAPI {
    private client;
    private connection;
    constructor(connection: Connection, baseUrl?: string);
    /**
     * Create a BUNDLE session (event-based, NO accounts created!)
     * This should cost ONLY 5k lamports per tx - NO RENT!
     * RECOMMENDED for Cognee memories!
     */
    createBundleSession(params: CreateSessionParams): Promise<PinocchioSessionResponse>;
    /**
     * Create a Hybrid V2 upload session (WORKING but creates accounts!)
     * WARNING: Creates session PDA (1.5M lamports rent per upload)
     * Use createBundleSession() instead for Cognee!
     */
    createHybridV2Session(params: CreateSessionParams): Promise<PinocchioSessionResponse>;
    /**
     * Create a Pinocchio upload session (RECOMMENDED - MOST UP-TO-DATE!)
     * IQ Team: "Use the pinocchio routes. They are the most up to date"
     *
     * This endpoint:
     * - Chunks data into 675-byte pieces (optimal per IQ team)
     * - Converts each chunk to base64 for transmission
     * - Costs exactly 5k lamports per transaction
     * - Works on mainnet with proper download support
     */
    createPinocchioSession(params: CreateSessionParams): Promise<PinocchioSessionResponse>;
    /**
     * Create a hybrid V2 upload session (alternative to Pinocchio)
     */
    createHybridSession(params: CreateSessionParams): Promise<PinocchioSessionResponse>;
    /**
     * Download and reconstruct data from a Pinocchio session
     */
    downloadSession(sessionPubkey: string): Promise<Buffer>;
    /**
     * Check if user's storage account exists
     * This helps avoid unnecessary initStorageTransaction calls
     */
    checkStorageAccountStatus(pubkey: string): Promise<boolean>;
    /**
     * Get session metadata
     */
    getSessionMetadata(sessionPubkey: string): Promise<SessionMetadata>;
    /**
     * Peek at file type without downloading full data
     */
    peekSession(sessionPubkey: string): Promise<{
        fileExtension: string;
        metadata: any;
    }>;
    /**
     * Sign and send a transaction via IQLabs broadcast API
     * This handles compute units and TPU optimization automatically
     */
    signAndSendTransaction(transactionData: string | any, wallet: Keypair, retries?: number): Promise<string>;
    /**
     * Sign and send a transaction WITHOUT waiting for confirmation (fast!)
     * Uses provided blockhash to avoid rate limits
     */
    private signAndSendTransactionNoConfirm;
    /**
     * Confirm multiple signatures in batch (MUCH faster than individual)
     */
    private confirmSignaturesBatch;
    /**
     * Sign and send multiple transactions with smart retry logic:
     * 1. Send all transactions
     * 2. Check which ones confirmed
     * 3. Retry only the failed ones
     */
    signAndSendTransactionsParallel(transactions: string[], wallet: Keypair, batchSize?: number): Promise<string[]>;
    /**
     * Check confirmation status and return confirmed vs failed indices
     */
    private checkConfirmationStatus;
    /**
     * Sign and send transactions sequentially with optimized confirmation
     * - Send all transactions one-by-one with 100ms delays
     * - Wait 5 seconds, then confirm all at once
     * - Much faster than old sequential mode!
     */
    signAndSendTransactionsSequential(transactions: string[], wallet: Keypair): Promise<string[]>;
    /**
     * IQDB Methods - Key-Value Store for Indexing
     *
     * IQDB is IQLabs' on-chain key-value database
     * Perfect for storing memory indexes/metadata
     */
    /**
     * Set a value in IQDB
     */
    setIQDBValue(key: string, value: string, wallet: Keypair): Promise<string>;
    /**
     * Get a value from IQDB
     */
    getIQDBValue(key: string, wallet: Keypair): Promise<string | null>;
    /**
     * Delete a value from IQDB
     */
    deleteIQDBValue(key: string, wallet: Keypair): Promise<string>;
}
//# sourceMappingURL=IQLabsAPI.d.ts.map