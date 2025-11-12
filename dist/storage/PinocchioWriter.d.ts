/**
 * Pinocchio Writer - REAL Implementation
 * Based on IQLabs Hybrid V2 Protocol Specification
 */
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
export declare const PINOCCHIO_PROGRAM_ID: PublicKey;
export interface PinocchioSession {
    sessionPubkey: PublicKey;
    sessionId: Buffer;
    totalChunks: number;
}
export declare class PinocchioWriter {
    private connection;
    private wallet;
    constructor(connection: Connection, wallet: Keypair);
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Chunk data into pieces
     */
    private chunkData;
    /**
     * Calculate simple merkle root (placeholder - real impl would use proper merkle tree)
     */
    private calculateMerkleRoot;
    /**
     * Create a Pinocchio session account
     * REAL implementation based on protocol spec
     */
    createSession(dataSize: number, chunks: Buffer[]): Promise<PinocchioSession>;
    /**
     * Post a chunk to Pinocchio
     * REAL implementation based on discriminator 0x04
     */
    postChunk(session: PinocchioSession, chunkIndex: number, chunkData: Buffer, method?: number): Promise<string>;
    /**
     * Store large data using Pinocchio protocol
     * COMPLETE implementation
     */
    storeData(data: Buffer | string, compress?: boolean): Promise<string>;
    /**
     * Read data from Pinocchio (using IQLabs reader logic)
     */
    readData(sessionPubkey: string): Promise<Buffer>;
}
//# sourceMappingURL=PinocchioWriter.d.ts.map