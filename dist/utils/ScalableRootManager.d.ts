/**
 * Scalable Root Manager
 *
 * Automatically handles IQDB root account scaling by:
 * 1. Creating multiple roots when capacity is reached
 * 2. Monitoring capacity and alerting
 * 3. Load balancing tables across roots
 * 4. Providing unified interface for table operations
 *
 * Usage:
 * ```typescript
 * const manager = new ScalableRootManager(connection, wallet, programId);
 * await manager.initialize();
 *
 * // Automatically selects best root
 * await manager.createTable('users', ['id', 'name'], 'id');
 * await manager.createTable('memories', ['id', 'content'], 'id');
 * // ... create 200+ tables without worrying about limits!
 * ```
 */
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
export interface RootInfo {
    namespace: string;
    pda: PublicKey;
    tableCount: number;
    maxTables: number;
    utilizationPercent: number;
    createdAt: number;
}
export interface TableInfo {
    name: string;
    rootNamespace: string;
    rootPda: PublicKey;
    tablePda: PublicKey;
    columnCount: number;
    createdAt: number;
}
export interface ScalableRootStats {
    totalRoots: number;
    totalTables: number;
    totalCapacity: number;
    utilizationPercent: number;
    roots: RootInfo[];
}
export interface ScalableRootConfig {
    /**
     * Maximum tables per root before creating new one
     * Default: 100 (conservative, actual limit ~120)
     */
    maxTablesPerRoot?: number;
    /**
     * Utilization threshold for creating new root (0-1)
     * Default: 0.85 (85%)
     */
    utilizationThreshold?: number;
    /**
     * Base category for organizing roots
     * Default: 'default'
     */
    baseCategory?: string;
    /**
     * Enable automatic capacity monitoring
     * Default: true
     */
    enableMonitoring?: boolean;
    /**
     * Monitoring interval in milliseconds
     * Default: 60000 (1 minute)
     */
    monitoringInterval?: number;
    /**
     * Callback for capacity warnings
     */
    onCapacityWarning?: (root: RootInfo) => void;
    /**
     * Callback for new root creation
     */
    onRootCreated?: (root: RootInfo) => void;
}
export declare class ScalableRootManager {
    private connection;
    private wallet;
    private programId;
    private config;
    private rootCache;
    private tableIndex;
    private monitoringInterval?;
    private initialized;
    constructor(connection: Connection, wallet: Keypair, programId: PublicKey, config?: ScalableRootConfig);
    /**
     * Initialize the manager
     * Discovers existing roots and starts monitoring
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the manager
     * Stops monitoring and cleans up resources
     */
    shutdown(): Promise<void>;
    /**
     * Discover existing roots by trying common namespace patterns
     */
    private discoverRoots;
    /**
     * Parse table count from root account data
     * This is a simplified version - actual parsing depends on IQDB's structure
     */
    private parseTableCount;
    /**
     * Get or create a root with available capacity
     */
    getAvailableRoot(): Promise<RootInfo>;
    /**
     * Create a new root account
     */
    createRoot(namespace: string): Promise<RootInfo>;
    /**
     * Create a table with automatic root selection
     */
    createTable(tableName: string, columns: string[], idColumn: string): Promise<TableInfo>;
    /**
     * Get table information
     */
    getTable(tableName: string): TableInfo | undefined;
    /**
     * Get root information
     */
    getRoot(namespace: string): RootInfo | undefined;
    /**
     * Get all roots
     */
    getAllRoots(): RootInfo[];
    /**
     * Get all tables
     */
    getAllTables(): TableInfo[];
    /**
     * Get statistics
     */
    getStats(): ScalableRootStats;
    /**
     * Start capacity monitoring
     */
    private startMonitoring;
    /**
     * Check capacity and trigger warnings
     */
    private checkCapacity;
    /**
     * Print detailed report
     */
    printReport(): void;
    /**
     * Ensure manager is initialized
     */
    private ensureInitialized;
}
/**
 * Example usage
 */
export declare function exampleUsage(): Promise<void>;
//# sourceMappingURL=ScalableRootManager.d.ts.map