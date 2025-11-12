/**
 * Pinocchio Adapter for large data storage on Solana
 */
import { IQDBConfig, PinocchioSessionMetadata } from '../types';
/**
 * Pinocchio Program ID
 */
export declare const PINOCCHIO_PROGRAM_ID = "4jB7tZybufNfgs8HRj9DiSCMYfEqb8jWkxKcnZnA1vBt";
/**
 * Pinocchio instruction discriminator for post_hybrid_chunk
 */
export declare const POST_CHUNK_DISCRIMINATOR = 4;
/**
 * Pinocchio Adapter for chunked data storage
 */
export declare class PinocchioAdapter {
    private connection;
    private config;
    constructor(config: IQDBConfig);
    /**
     * Store large data using Pinocchio protocol
     */
    storeData(data: any, compression?: boolean): Promise<string>;
    /**
     * Read data from Pinocchio session
     */
    readData(sessionPubkey: string): Promise<Buffer>;
    /**
     * Read data and parse as JSON
     */
    readJSON<T = any>(sessionPubkey: string): Promise<T>;
    /**
     * Create a Pinocchio session account
     */
    private createSession;
    /**
     * Post a chunk to Pinocchio session
     */
    private postChunk;
    /**
     * Get session metadata
     */
    getSessionMetadata(sessionPubkey: string): Promise<PinocchioSessionMetadata>;
}
//# sourceMappingURL=PinocchioAdapter.d.ts.map