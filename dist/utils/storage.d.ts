/**
 * Storage utilities for determining storage strategy
 */
import { StorageStrategy } from '../types';
/**
 * Maximum size for inline storage (bytes)
 */
export declare const INLINE_MAX_SIZE = 1000;
/**
 * Chunk size for Pinocchio (bytes)
 */
export declare const PINOCCHIO_CHUNK_SIZE = 1000;
/**
 * Compression threshold (bytes)
 */
export declare const COMPRESSION_THRESHOLD = 10000;
/**
 * Determine storage strategy based on data size
 */
export declare function determineStorageStrategy(data: any): StorageStrategy;
/**
 * Compute SHA256 hash of content
 */
export declare function computeContentHash(content: any): string;
/**
 * Truncate text to maximum length
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Chunk data into fixed-size pieces
 */
export declare function chunkData(data: Buffer, chunkSize?: number): Buffer[];
/**
 * Reconstruct data from chunks
 */
export declare function reconstructData(chunks: Buffer[]): Buffer;
/**
 * Compress data using gzip
 */
export declare function compressData(data: Buffer): Promise<Buffer>;
/**
 * Decompress data using gzip
 */
export declare function decompressData(data: Buffer): Promise<Buffer>;
/**
 * Generate unique session ID for Pinocchio
 */
export declare function generateSessionId(): Buffer;
/**
 * Validate JSON string
 */
export declare function validateJSON(jsonString: string): {
    valid: boolean;
    error?: string;
};
/**
 * Safe JSON parse with fallback
 */
export declare function safeJSONParse<T>(jsonString: string, fallback: T): T;
/**
 * Estimate transaction cost (in lamports)
 */
export declare function estimateTransactionCost(dataSize: number): number;
/**
 * Format timestamp to ISO string
 */
export declare function formatTimestamp(date?: Date): string;
/**
 * Parse timestamp from ISO string
 */
export declare function parseTimestamp(isoString: string): Date;
//# sourceMappingURL=storage.d.ts.map