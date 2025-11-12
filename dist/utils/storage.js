"use strict";
/**
 * Storage utilities for determining storage strategy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPRESSION_THRESHOLD = exports.PINOCCHIO_CHUNK_SIZE = exports.INLINE_MAX_SIZE = void 0;
exports.determineStorageStrategy = determineStorageStrategy;
exports.computeContentHash = computeContentHash;
exports.truncate = truncate;
exports.chunkData = chunkData;
exports.reconstructData = reconstructData;
exports.compressData = compressData;
exports.decompressData = decompressData;
exports.generateSessionId = generateSessionId;
exports.validateJSON = validateJSON;
exports.safeJSONParse = safeJSONParse;
exports.estimateTransactionCost = estimateTransactionCost;
exports.formatTimestamp = formatTimestamp;
exports.parseTimestamp = parseTimestamp;
const types_1 = require("../types");
const crypto_1 = require("crypto");
/**
 * Maximum size for inline storage (bytes)
 */
exports.INLINE_MAX_SIZE = 1000;
/**
 * Chunk size for Pinocchio (bytes)
 */
exports.PINOCCHIO_CHUNK_SIZE = 1000;
/**
 * Compression threshold (bytes)
 */
exports.COMPRESSION_THRESHOLD = 10000;
/**
 * Determine storage strategy based on data size
 */
function determineStorageStrategy(data) {
    const jsonString = JSON.stringify(data);
    const byteSize = Buffer.from(jsonString, 'utf-8').length;
    if (byteSize <= exports.INLINE_MAX_SIZE) {
        // Fits in single IQDB transaction
        return {
            type: types_1.StorageType.INLINE,
            method: 'write_data',
            chunks: 1,
            compression: false
        };
    }
    else if (byteSize <= exports.COMPRESSION_THRESHOLD) {
        // Small Pinocchio session without compression
        return {
            type: types_1.StorageType.PINOCCHIO,
            method: 'post_hybrid_chunk',
            chunks: Math.ceil(byteSize / exports.PINOCCHIO_CHUNK_SIZE),
            compression: false
        };
    }
    else {
        // Large Pinocchio session with compression
        return {
            type: types_1.StorageType.PINOCCHIO,
            method: 'post_hybrid_chunk',
            chunks: Math.ceil(byteSize / exports.PINOCCHIO_CHUNK_SIZE),
            compression: true
        };
    }
}
/**
 * Compute SHA256 hash of content
 */
function computeContentHash(content) {
    const jsonString = typeof content === 'string' ? content : JSON.stringify(content);
    return (0, crypto_1.createHash)('sha256').update(jsonString, 'utf-8').digest('hex');
}
/**
 * Truncate text to maximum length
 */
function truncate(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}
/**
 * Chunk data into fixed-size pieces
 */
function chunkData(data, chunkSize = exports.PINOCCHIO_CHUNK_SIZE) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
}
/**
 * Reconstruct data from chunks
 */
function reconstructData(chunks) {
    return Buffer.concat(chunks);
}
/**
 * Compress data using gzip
 */
async function compressData(data) {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
        zlib.gzip(data, (err, compressed) => {
            if (err)
                reject(err);
            else
                resolve(compressed);
        });
    });
}
/**
 * Decompress data using gzip
 */
async function decompressData(data) {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
        zlib.gunzip(data, (err, decompressed) => {
            if (err)
                reject(err);
            else
                resolve(decompressed);
        });
    });
}
/**
 * Generate unique session ID for Pinocchio
 */
function generateSessionId() {
    // Generate 16 random bytes
    const bytes = Buffer.alloc(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
}
/**
 * Validate JSON string
 */
function validateJSON(jsonString) {
    try {
        JSON.parse(jsonString);
        return { valid: true };
    }
    catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Invalid JSON'
        };
    }
}
/**
 * Safe JSON parse with fallback
 */
function safeJSONParse(jsonString, fallback) {
    try {
        return JSON.parse(jsonString);
    }
    catch {
        return fallback;
    }
}
/**
 * Estimate transaction cost (in lamports)
 */
function estimateTransactionCost(dataSize) {
    // Base transaction cost: ~5000 lamports
    const baseCost = 5000;
    // Additional cost per byte: ~0.5 lamports
    const perByteCost = 0.5;
    return Math.ceil(baseCost + (dataSize * perByteCost));
}
/**
 * Format timestamp to ISO string
 */
function formatTimestamp(date = new Date()) {
    return date.toISOString();
}
/**
 * Parse timestamp from ISO string
 */
function parseTimestamp(isoString) {
    return new Date(isoString);
}
//# sourceMappingURL=storage.js.map