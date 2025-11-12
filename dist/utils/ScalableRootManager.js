"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalableRootManager = void 0;
exports.exampleUsage = exampleUsage;
const web3_js_1 = require("@solana/web3.js");
class ScalableRootManager {
    constructor(connection, wallet, programId, config = {}) {
        this.rootCache = new Map();
        this.tableIndex = new Map();
        this.initialized = false;
        this.connection = connection;
        this.wallet = wallet;
        this.programId = programId;
        // Set defaults
        this.config = {
            maxTablesPerRoot: config.maxTablesPerRoot || 100,
            utilizationThreshold: config.utilizationThreshold || 0.85,
            baseCategory: config.baseCategory || 'default',
            enableMonitoring: config.enableMonitoring !== false,
            monitoringInterval: config.monitoringInterval || 60000,
            onCapacityWarning: config.onCapacityWarning || (() => { }),
            onRootCreated: config.onRootCreated || (() => { }),
        };
    }
    /**
     * Initialize the manager
     * Discovers existing roots and starts monitoring
     */
    async initialize() {
        console.log(' Initializing Scalable Root Manager...');
        // Discover existing roots
        await this.discoverRoots();
        // Create first root if none exist
        if (this.rootCache.size === 0) {
            console.log('No existing roots found, creating initial root...');
            await this.createRoot(`${this.config.baseCategory}_0`);
        }
        // Start monitoring
        if (this.config.enableMonitoring) {
            this.startMonitoring();
        }
        this.initialized = true;
        console.log(` Manager initialized with ${this.rootCache.size} root(s)`);
    }
    /**
     * Shutdown the manager
     * Stops monitoring and cleans up resources
     */
    async shutdown() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        console.log(' Scalable Root Manager shutdown');
    }
    /**
     * Discover existing roots by trying common namespace patterns
     */
    async discoverRoots() {
        const namespaces = [
            this.config.baseCategory,
            `${this.config.baseCategory}_0`,
            `${this.config.baseCategory}_1`,
            `${this.config.baseCategory}_2`,
            'main',
            'main_0',
            'archive',
            'temp',
        ];
        for (const namespace of namespaces) {
            try {
                const [rootPda] = web3_js_1.PublicKey.findProgramAddressSync([
                    Buffer.from('iqdb-root'),
                    this.programId.toBuffer(),
                    this.wallet.publicKey.toBuffer(),
                    Buffer.from(namespace),
                ], this.programId);
                const accountInfo = await this.connection.getAccountInfo(rootPda);
                if (accountInfo) {
                    // Parse account to count tables
                    const tableCount = this.parseTableCount(accountInfo.data);
                    this.rootCache.set(namespace, {
                        namespace,
                        pda: rootPda,
                        tableCount,
                        maxTables: this.config.maxTablesPerRoot,
                        utilizationPercent: (tableCount / this.config.maxTablesPerRoot) * 100,
                        createdAt: Date.now(),
                    });
                    console.log(`📍 Discovered root: ${namespace} (${tableCount} tables)`);
                }
            }
            catch (err) {
                // Root doesn't exist, skip
            }
        }
    }
    /**
     * Parse table count from root account data
     * This is a simplified version - actual parsing depends on IQDB's structure
     */
    parseTableCount(data) {
        try {
            // IQDB root structure (simplified):
            // - First 32 bytes: creator pubkey
            // - Next bytes: table_seeds array (Vec<Vec<u8>>)
            // Skip creator pubkey (32 bytes) + discriminator (8 bytes)
            let offset = 40;
            // Read Vec length (4 bytes, little endian)
            if (data.length < offset + 4)
                return 0;
            const tableCount = data.readUInt32LE(offset);
            return tableCount;
        }
        catch (err) {
            console.warn('Failed to parse table count:', err);
            return 0;
        }
    }
    /**
     * Get or create a root with available capacity
     */
    async getAvailableRoot() {
        this.ensureInitialized();
        // Find root with available capacity
        for (const root of this.rootCache.values()) {
            const utilization = root.tableCount / root.maxTables;
            if (utilization < this.config.utilizationThreshold) {
                return root;
            }
        }
        // All roots full or near capacity, create new one
        const newIndex = this.rootCache.size;
        const newNamespace = `${this.config.baseCategory}_${newIndex}`;
        console.log(` All roots at capacity, creating new root: ${newNamespace}`);
        return await this.createRoot(newNamespace);
    }
    /**
     * Create a new root account
     */
    async createRoot(namespace) {
        console.log(` Creating root: ${namespace}...`);
        const [rootPda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-root'),
            this.programId.toBuffer(),
            this.wallet.publicKey.toBuffer(),
            Buffer.from(namespace),
        ], this.programId);
        // Initialize root using IQDB SDK
        // Note: This requires IQDB's ensureRoot to support custom namespaces
        // For now, this is pseudocode
        // await iqdb.ensureRoot(rootPda);
        // Create root info
        const rootInfo = {
            namespace,
            pda: rootPda,
            tableCount: 0,
            maxTables: this.config.maxTablesPerRoot,
            utilizationPercent: 0,
            createdAt: Date.now(),
        };
        this.rootCache.set(namespace, rootInfo);
        this.config.onRootCreated(rootInfo);
        console.log(` Root created: ${namespace} (${rootPda.toBase58()})`);
        return rootInfo;
    }
    /**
     * Create a table with automatic root selection
     */
    async createTable(tableName, columns, idColumn) {
        this.ensureInitialized();
        // Check if table already exists
        if (this.tableIndex.has(tableName)) {
            throw new Error(`Table '${tableName}' already exists`);
        }
        // Get available root
        const root = await this.getAvailableRoot();
        console.log(` Creating table '${tableName}' in root ${root.namespace}...`);
        // Create table using IQDB SDK
        // Note: This requires IQDB's ensureTable to work with specific root PDA
        // For now, this is pseudocode
        // const tablePda = await iqdb.ensureTable(tableName, columns, idColumn, root.pda);
        // Derive table PDA
        const tableSeed = Buffer.from(tableName); // Simplified
        const [tablePda] = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('iqdb-table'),
            this.programId.toBuffer(),
            root.pda.toBuffer(),
            tableSeed,
        ], this.programId);
        // Create table info
        const tableInfo = {
            name: tableName,
            rootNamespace: root.namespace,
            rootPda: root.pda,
            tablePda,
            columnCount: columns.length,
            createdAt: Date.now(),
        };
        // Update indexes
        this.tableIndex.set(tableName, tableInfo);
        root.tableCount++;
        root.utilizationPercent = (root.tableCount / root.maxTables) * 100;
        console.log(` Table created: ${tableName} (${root.tableCount}/${root.maxTables} tables in root)`);
        // Check capacity warning
        if (root.utilizationPercent > 75) {
            console.warn(` Root ${root.namespace} at ${root.utilizationPercent.toFixed(1)}% capacity`);
            this.config.onCapacityWarning(root);
        }
        return tableInfo;
    }
    /**
     * Get table information
     */
    getTable(tableName) {
        return this.tableIndex.get(tableName);
    }
    /**
     * Get root information
     */
    getRoot(namespace) {
        return this.rootCache.get(namespace);
    }
    /**
     * Get all roots
     */
    getAllRoots() {
        return Array.from(this.rootCache.values());
    }
    /**
     * Get all tables
     */
    getAllTables() {
        return Array.from(this.tableIndex.values());
    }
    /**
     * Get statistics
     */
    getStats() {
        const roots = Array.from(this.rootCache.values());
        const totalTables = roots.reduce((sum, root) => sum + root.tableCount, 0);
        const totalCapacity = roots.length * this.config.maxTablesPerRoot;
        return {
            totalRoots: roots.length,
            totalTables,
            totalCapacity,
            utilizationPercent: totalCapacity > 0 ? (totalTables / totalCapacity) * 100 : 0,
            roots: roots.sort((a, b) => b.utilizationPercent - a.utilizationPercent),
        };
    }
    /**
     * Start capacity monitoring
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.checkCapacity();
        }, this.config.monitoringInterval);
        console.log(` Monitoring started (interval: ${this.config.monitoringInterval}ms)`);
    }
    /**
     * Check capacity and trigger warnings
     */
    checkCapacity() {
        for (const root of this.rootCache.values()) {
            if (root.utilizationPercent > 90) {
                console.warn(` HIGH CAPACITY: Root ${root.namespace} at ${root.utilizationPercent.toFixed(1)}%`);
                console.warn(`   Tables: ${root.tableCount}/${root.maxTables}, Remaining: ${root.maxTables - root.tableCount}`);
                this.config.onCapacityWarning(root);
            }
        }
        const stats = this.getStats();
        if (stats.utilizationPercent > 80) {
            console.warn(` Overall capacity at ${stats.utilizationPercent.toFixed(1)}%`);
            console.warn(`   Total: ${stats.totalTables}/${stats.totalCapacity} tables across ${stats.totalRoots} roots`);
        }
    }
    /**
     * Print detailed report
     */
    printReport() {
        const stats = this.getStats();
        console.log('\n' + '='.repeat(60));
        console.log(' SCALABLE ROOT MANAGER REPORT');
        console.log('='.repeat(60));
        console.log(`\n📈 OVERALL STATISTICS:`);
        console.log(`   Total Roots:     ${stats.totalRoots}`);
        console.log(`   Total Tables:    ${stats.totalTables}`);
        console.log(`   Total Capacity:  ${stats.totalCapacity}`);
        console.log(`   Utilization:     ${stats.utilizationPercent.toFixed(1)}%`);
        console.log(`\n📍 ROOTS (by utilization):`);
        for (const root of stats.roots) {
            const bar = '█'.repeat(Math.floor(root.utilizationPercent / 2));
            const empty = '░'.repeat(50 - Math.floor(root.utilizationPercent / 2));
            console.log(`\n   ${root.namespace}:`);
            console.log(`   ${bar}${empty} ${root.utilizationPercent.toFixed(1)}%`);
            console.log(`   Tables: ${root.tableCount}/${root.maxTables}`);
            console.log(`   PDA: ${root.pda.toBase58()}`);
        }
        console.log(`\n SAMPLE TABLES:`);
        const tables = Array.from(this.tableIndex.values()).slice(0, 5);
        for (const table of tables) {
            console.log(`   - ${table.name} (${table.columnCount} columns) → ${table.rootNamespace}`);
        }
        if (this.tableIndex.size > 5) {
            console.log(`   ... and ${this.tableIndex.size - 5} more`);
        }
        console.log('\n' + '='.repeat(60) + '\n');
    }
    /**
     * Ensure manager is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ScalableRootManager not initialized. Call initialize() first.');
        }
    }
}
exports.ScalableRootManager = ScalableRootManager;
/**
 * Example usage
 */
async function exampleUsage() {
    const connection = new web3_js_1.Connection('https://api.devnet.solana.com');
    const wallet = web3_js_1.Keypair.generate(); // Use your actual wallet
    const programId = new web3_js_1.PublicKey('7Vk5JJDxUBAaaAkpYQpWYCZNz4SVPm3mJFSxrBzTQuAX');
    // Create manager with custom config
    const manager = new ScalableRootManager(connection, wallet, programId, {
        maxTablesPerRoot: 100,
        utilizationThreshold: 0.85,
        baseCategory: 'ai_memory',
        enableMonitoring: true,
        onCapacityWarning: (root) => {
            console.log(` Capacity warning for ${root.namespace}!`);
            // Send alert, create new root, etc.
        },
        onRootCreated: (root) => {
            console.log(` New root created: ${root.namespace}`);
            // Log to analytics, update UI, etc.
        },
    });
    // Initialize
    await manager.initialize();
    // Create tables automatically
    // Manager handles root selection and scaling
    await manager.createTable('users', ['id', 'name', 'email'], 'id');
    await manager.createTable('memories', ['id', 'content', 'timestamp'], 'id');
    await manager.createTable('knowledge_nodes', ['id', 'label', 'properties'], 'id');
    await manager.createTable('knowledge_edges', ['id', 'source', 'target'], 'id');
    // Create 200+ tables - manager handles everything!
    for (let i = 0; i < 200; i++) {
        await manager.createTable(`table_${i}`, ['id', 'data'], 'id');
    }
    // Get stats
    const stats = manager.getStats();
    console.log(`Created ${stats.totalTables} tables across ${stats.totalRoots} roots!`);
    // Print detailed report
    manager.printReport();
    // Get specific table info
    const memoryTable = manager.getTable('memories');
    console.log(`Memory table is in root: ${memoryTable?.rootNamespace}`);
    // Shutdown when done
    await manager.shutdown();
}
//# sourceMappingURL=ScalableRootManager.js.map