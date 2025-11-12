"use strict";
/**
 * Syncable Memory Index
 *
 * Local cache that syncs with on-chain Pinocchio sessions.
 * - Fast local lookups
 * - Periodic sync to discover new memories
 * - Pinocchio is the source of truth
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncableMemoryIndex = void 0;
const web3_js_1 = require("@solana/web3.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LocalMemoryIndex_1 = require("./LocalMemoryIndex");
const LargeDataStorage_1 = require("../storage/LargeDataStorage");
class SyncableMemoryIndex extends LocalMemoryIndex_1.LocalMemoryIndex {
    constructor(connection, wallet, indexPath) {
        super(indexPath);
        this.connection = connection;
        this.wallet = wallet;
        this.storage = new LargeDataStorage_1.LargeDataStorage(connection, wallet);
        this.lastSyncPath = path.join(process.cwd(), indexPath ? indexPath.replace('.json', '-sync.json') : 'memory-sync.json');
    }
    /**
     * Get last sync timestamp
     */
    getLastSyncTime() {
        try {
            if (fs.existsSync(this.lastSyncPath)) {
                const data = JSON.parse(fs.readFileSync(this.lastSyncPath, 'utf-8'));
                return new Date(data.lastSyncTime);
            }
        }
        catch (error) {
            console.warn('Failed to read last sync time:', error);
        }
        return null;
    }
    /**
     * Save last sync timestamp
     */
    saveLastSyncTime() {
        try {
            fs.writeFileSync(this.lastSyncPath, JSON.stringify({
                lastSyncTime: new Date().toISOString(),
                walletPubkey: this.wallet.publicKey.toBase58()
            }, null, 2));
        }
        catch (error) {
            console.warn('Failed to save last sync time:', error);
        }
    }
    /**
     * Get all Pinocchio session PDAs for this wallet
     * Uses RPC getProgramAccounts
     */
    async getAllSessionPDAs() {
        console.log(' Querying Pinocchio sessions from blockchain...');
        const PINOCCHIO_PROGRAM_ID = '4jB7tZybufNfgs8HRj9DiSCMYfEqb8jWkxKcnZnA1vBt';
        try {
            // Query all Pinocchio program accounts
            const accounts = await this.connection.getProgramAccounts(new web3_js_1.PublicKey(PINOCCHIO_PROGRAM_ID), {
                filters: [
                    {
                        // Filter for finalized sessions (status = 1)
                        dataSize: 1000 // Adjust based on actual account size
                    }
                ]
            });
            console.log(`   Found ${accounts.length} total Pinocchio sessions on chain`);
            // Filter by owner (our wallet)
            // Note: This is done client-side since RPC filter needs exact offset
            const ourSessions = [];
            for (const account of accounts) {
                try {
                    // Try to read owner from account data
                    // Pinocchio session structure: discriminator(8) + owner(32) + ...
                    if (account.account.data.length >= 40) {
                        const ownerBytes = account.account.data.slice(8, 40);
                        const owner = new web3_js_1.PublicKey(ownerBytes);
                        if (owner.equals(this.wallet.publicKey)) {
                            ourSessions.push(account.pubkey.toBase58());
                        }
                    }
                }
                catch (error) {
                    // Skip accounts we can't parse
                    continue;
                }
            }
            console.log(`   Found ${ourSessions.length} sessions owned by your wallet`);
            return ourSessions;
        }
        catch (error) {
            console.warn(`  RPC query failed: ${error.message}`);
            console.warn('   Falling back to existing cache...');
            return [];
        }
    }
    /**
     * Sync with on-chain Pinocchio sessions
     * Discovers new memories and adds them to local cache
     */
    async sync(options = {}) {
        console.log('\n========================================================');
        console.log('  SYNCING WITH PINOCCHIO (ON-CHAIN)');
        console.log('========================================================\n');
        const lastSync = this.getLastSyncTime();
        if (lastSync) {
            console.log(`📅 Last sync: ${lastSync.toLocaleString()}`);
        }
        else {
            console.log('📅 First sync - will discover all memories');
        }
        console.log('');
        const result = {
            discovered: 0,
            added: 0,
            skipped: 0,
            errors: 0,
            lastSyncTime: new Date().toISOString()
        };
        // Step 1: Get all session PDAs from blockchain
        const sessionPDAs = await this.getAllSessionPDAs();
        result.discovered = sessionPDAs.length;
        if (sessionPDAs.length === 0) {
            console.log('ℹ  No sessions found on chain\n');
            this.saveLastSyncTime();
            return result;
        }
        console.log('');
        // Step 2: Find new sessions (not in local cache)
        const existingMemories = await this.getAllMemories();
        const existingSessions = new Set(existingMemories.map(m => m.session_pubkey));
        const newSessions = sessionPDAs.filter(pda => !existingSessions.has(pda));
        console.log(` Analysis:`);
        console.log(`   Total on-chain: ${sessionPDAs.length}`);
        console.log(`   Already cached: ${existingSessions.size}`);
        console.log(`   New to download: ${newSessions.length}\n`);
        if (newSessions.length === 0 && !options.downloadAll) {
            console.log(' Cache is up to date!\n');
            this.saveLastSyncTime();
            return result;
        }
        // Step 3: Download new sessions
        const toDownload = options.downloadAll ? sessionPDAs : newSessions;
        const maxDownloads = options.maxDownloads || toDownload.length;
        const limited = toDownload.slice(0, maxDownloads);
        console.log(` Downloading ${limited.length} session(s)...\n`);
        for (let i = 0; i < limited.length; i++) {
            const sessionPDA = limited[i];
            console.log(`${i + 1}/${limited.length}. Session: ${sessionPDA.substring(0, 20)}...`);
            try {
                // Download and parse memory data
                const downloadResult = await this.storage.retrieveLargeData(sessionPDA);
                const memoryData = JSON.parse(downloadResult.data);
                // Validate it's a Cognee memory
                if (!memoryData.memory_id || !memoryData.user_id) {
                    console.log(`     Skipped: Not a valid Cognee memory\n`);
                    result.skipped++;
                    continue;
                }
                // Create index entry
                const entry = {
                    memory_id: memoryData.memory_id,
                    user_id: memoryData.user_id,
                    session_pubkey: sessionPDA,
                    memory_type: memoryData.memory_type || 'unknown',
                    tags: memoryData.tags || [],
                    created_at: memoryData.created_at || new Date().toISOString(),
                    updated_at: memoryData.updated_at || new Date().toISOString(),
                    size: downloadResult.data.length,
                    cost: 0,
                    num_chunks: memoryData.chunks?.length || 0,
                    num_entities: memoryData.entities?.length || 0,
                    num_relationships: memoryData.relationships?.length || 0,
                    has_embeddings: !!(memoryData.embeddings && memoryData.embeddings.length > 0),
                    preview: memoryData.chunks?.[0]?.text?.substring(0, 100) || ''
                };
                // Add to index
                await this.indexMemory(entry);
                console.log(`    Added: ${entry.memory_id.substring(0, 8)}... (${entry.memory_type})`);
                console.log(`      User: ${entry.user_id}, Size: ${entry.size} bytes\n`);
                result.added++;
            }
            catch (error) {
                console.log(`    Error: ${error.message}\n`);
                result.errors++;
            }
        }
        // Save sync time
        this.saveLastSyncTime();
        console.log('========================================================');
        console.log('  SYNC COMPLETE');
        console.log('========================================================\n');
        console.log(` Results:`);
        console.log(`   Discovered: ${result.discovered}`);
        console.log(`   Added: ${result.added}`);
        console.log(`   Skipped: ${result.skipped}`);
        console.log(`   Errors: ${result.errors}\n`);
        return result;
    }
    /**
     * Check if sync is needed (based on time threshold)
     */
    shouldSync(thresholdMinutes = 60) {
        const lastSync = this.getLastSyncTime();
        if (!lastSync) {
            return true; // Never synced
        }
        const now = new Date();
        const diffMs = now.getTime() - lastSync.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        return diffMinutes >= thresholdMinutes;
    }
    /**
     * Auto-sync if needed (convenience method)
     */
    async autoSync(thresholdMinutes = 60) {
        if (this.shouldSync(thresholdMinutes)) {
            console.log(`⏰ Auto-sync triggered (last sync > ${thresholdMinutes} minutes ago)`);
            return await this.sync();
        }
        else {
            console.log(` Cache is fresh (synced within ${thresholdMinutes} minutes)`);
            return null;
        }
    }
}
exports.SyncableMemoryIndex = SyncableMemoryIndex;
//# sourceMappingURL=SyncableMemoryIndex.js.map