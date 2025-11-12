/**
 * On-Chain Memory SDK
 *
 * Production-ready SDK for storing Cognee memories on Solana blockchain.
 *
 * @packageDocumentation
 */
export { CogneeMemoryAdapter, MemoryStorageResult } from './adapters/CogneeMemoryAdapter';
export type { DocumentChunk, Entity, Relationship, VectorEmbedding, CogneeMemory } from './adapters/CogneeMemoryAdapter';
export { LocalMemoryIndex, MemoryIndexEntry } from './index/LocalMemoryIndex';
export { SyncableMemoryIndex } from './index/SyncableMemoryIndex';
export { LargeDataStorage } from './storage/LargeDataStorage';
export { IQLabsAPI } from './api/IQLabsAPI';
export declare const VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map