/**
 * Type definitions for on-chain memory system
 */
import { PublicKey, Connection } from '@solana/web3.js';
import { Program, Idl } from '@coral-xyz/anchor';
/**
 * Storage strategy for data
 */
export declare enum StorageType {
    INLINE = "inline",
    PINOCCHIO = "pinocchio"
}
/**
 * Memory types for AI agents
 */
export declare enum MemoryType {
    EPISODIC = "episodic",
    SEMANTIC = "semantic",
    PROCEDURAL = "procedural"
}
/**
 * Storage strategy determination
 */
export interface StorageStrategy {
    type: StorageType;
    method: string;
    chunks: number;
    compression: boolean;
}
/**
 * Configuration for IQDB connection
 */
export interface IQDBConfig {
    rpcUrl: string;
    programId: string;
    idl: Idl;
    wallet: {
        publicKey: PublicKey;
        signTransaction: (tx: any) => Promise<any>;
        signAllTransactions: (txs: any[]) => Promise<any[]>;
    };
}
/**
 * Pinocchio session metadata
 */
export interface PinocchioSessionMetadata {
    owner: string;
    sessionId: string;
    totalChunks: number;
    merkleRoot: string;
    status: 'active' | 'finalized';
    storageAccount: string;
}
/**
 * Node in knowledge graph
 */
export interface KnowledgeNode {
    id: string;
    nodeId: string;
    name: string;
    type: string;
    description: string;
    properties: Record<string, any>;
    vectorSession?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Edge in knowledge graph
 */
export interface KnowledgeEdge {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    relationshipName: string;
    properties: Record<string, any>;
    weight: number;
    createdAt: string;
    updatedAt: string;
}
/**
 * Agent memory metadata
 */
export interface AgentMemory {
    id: string;
    agentId: string;
    memoryType: MemoryType;
    contentHash: string;
    storageType: StorageType;
    storageRef: string;
    createdAt: string;
    updatedAt: string;
    metadata: Record<string, any>;
}
/**
 * Dataset metadata
 */
export interface Dataset {
    id: string;
    name: string;
    agentId: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Data item metadata
 */
export interface DataItem {
    id: string;
    datasetId: string;
    name: string;
    contentHash: string;
    storageRef: string;
    mimeType: string;
    tokenCount: number;
    dataSize: number;
    nodeSet: string[];
    pipelineStatus: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
/**
 * Vector search result
 */
export interface VectorSearchResult {
    nodeId: string;
    score: number;
    node?: KnowledgeNode;
}
/**
 * Subgraph result
 */
export interface Subgraph {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
}
/**
 * Memory search result
 */
export interface MemorySearchResult {
    node: KnowledgeNode;
    score: number;
    context: Subgraph;
}
/**
 * Table schema for IQDB
 */
export interface TableSchema {
    tableName: string;
    columns: string[];
    idColumn: string;
    extKeys?: string[];
}
/**
 * IQDB row (generic)
 */
export type IQDBRow = Record<string, any>;
/**
 * Cache entry
 */
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}
/**
 * Cache options
 */
export interface CacheOptions {
    maxSize?: number;
    defaultTTL?: number;
}
/**
 * Batch write options
 */
export interface BatchWriteOptions {
    parallel?: boolean;
    batchSize?: number;
}
/**
 * Read options
 */
export interface ReadOptions {
    useCache?: boolean;
    maxRetries?: number;
}
/**
 * Write context for IQDB operations
 */
export interface WriterContext {
    connection: Connection;
    wallet: IQDBConfig['wallet'];
    idl: Idl;
    program?: Program;
}
/**
 * Reader parameters
 */
export interface ReaderParams {
    userPublicKey: string;
    idl: Idl;
    rpcUrl?: string;
}
//# sourceMappingURL=index.d.ts.map