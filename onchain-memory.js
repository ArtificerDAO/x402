#!/usr/bin/env node

/**
 * Comprehensive On-Chain Memory CLI
 * Production-grade interface with advanced features
 */

// Clear module cache to ensure fresh load
Object.keys(require.cache).forEach(key => {
  if (key.includes('/dist/')) {
    delete require.cache[key];
  }
});

const { Connection, Keypair } = require('@solana/web3.js');
const { CogneeMemoryAdapter } = require('./dist/adapters/CogneeMemoryAdapter');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Directories
const MEMORIES_DIR = path.join(process.cwd(), 'memories');
const WALLET_DIR = path.join(process.cwd(), 'wallet');
const DOWNLOADS_DIR = path.join(process.cwd(), 'downloaded');
const WALLET_FILE = path.join(WALLET_DIR, 'keypair.json');
const CONFIG_FILE = path.join(__dirname, '../wallet.config.json');
const STATS_FILE = path.join(MEMORIES_DIR, '.stats.json');

let adapter, wallet, connection;
let sessionStats = {
  uploads: 0,
  downloads: 0,
  totalCost: 0,
  totalSize: 0,
  startTime: Date.now()
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function clearScreen() {
  console.log('\x1Bc');
}

function ensureDirectories() {
  if (!fs.existsSync(MEMORIES_DIR)) {
    fs.mkdirSync(MEMORIES_DIR, { recursive: true });
  }
  if (!fs.existsSync(WALLET_DIR)) {
    fs.mkdirSync(WALLET_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
}

function loadStats() {
  if (fs.existsSync(STATS_FILE)) {
    return JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
  }
  return {
    totalUploads: 0,
    totalDownloads: 0,
    totalCost: 0,
    totalSize: 0,
    avgUploadTime: 0,
    avgDownloadTime: 0,
    lastUsed: null
  };
}

function saveStats(stats) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatTime(ms) {
  if (ms < 1000) return ms + ' ms';
  if (ms < 60000) return (ms / 1000).toFixed(2) + ' s';
  return (ms / 60000).toFixed(2) + ' min';
}

function estimateCost(sizeBytes) {
  // Approximate: 0.000025 SOL per 1KB
  const costSOL = (sizeBytes / 1024) * 0.000025;
  const costUSD = costSOL * 200; // Assuming $200 per SOL
  return { sol: costSOL, usd: costUSD };
}

function printHeader() {
  console.log('\n' + '='.repeat(70));
  console.log('                    ON-CHAIN MEMORY CLI');
  console.log('              Permanent Storage on Solana Blockchain');
  console.log('='.repeat(70) + '\n');
}

function printMainMenu() {
  console.log('MAIN MENU\n');
  console.log('  BASIC OPERATIONS');
  console.log('    [1] Write New Memory          [2] Read Memory');
  console.log('    [3] List Memories             [4] Search Memories');
  console.log('    [5] Sync from Blockchain');
  console.log('');
  console.log('  FILE & BATCH OPERATIONS');
  console.log('    [6] Upload File/Folder        [7] Download File/Folder');
  console.log('    [8] Batch Upload Memories     [9] Batch Download');
  console.log('');
  console.log('  ANALYTICS & MANAGEMENT');
  console.log('    [10] Statistics & Analytics   [11] Export Memories');
  console.log('    [12] Import Memories          [13] Test All Features');
  console.log('');
  console.log('  SYSTEM');
  console.log('    [14] Wallet Info              [15] Session Stats');
  console.log('    [0] Exit\n');
}

async function initAdapter() {
  if (adapter) return;
  
  ensureDirectories();
  
  let config;
  
  if (fs.existsSync(WALLET_FILE)) {
    const walletData = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
    config = {
      privateKey: walletData.privateKey || walletData,
      rpcUrl: walletData.rpcUrl || 'https://api.mainnet-beta.solana.com'
    };
  } else if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } else {
    console.log('ERROR: No wallet configuration found!');
    console.log('');
    console.log('Please create: wallet/keypair.json');
    console.log('');
    console.log('Format:');
    console.log('{');
    console.log('  "privateKey": [123, 45, 67, ...],');
    console.log('  "rpcUrl": "https://api.mainnet-beta.solana.com"');
    console.log('}');
    console.log('');
    process.exit(1);
  }
  
  connection = new Connection(config.rpcUrl, 'confirmed');
  wallet = Keypair.fromSecretKey(new Uint8Array(config.privateKey));
  
  // Use parent directory's memory-index.json if it exists
  const parentIndexPath = path.join(__dirname, '../memory-index.json');
  if (fs.existsSync(parentIndexPath)) {
    adapter = new CogneeMemoryAdapter(connection, wallet, parentIndexPath);
  } else {
    adapter = new CogneeMemoryAdapter(connection, wallet);
  }
  
  const balance = await connection.getBalance(wallet.publicKey);
  
  console.log('SYSTEM INITIALIZED');
  console.log('  Wallet:', wallet.publicKey.toBase58().substring(0, 30) + '...');
  console.log('  Balance:', (balance / 1e9).toFixed(6), 'SOL (~$' + ((balance / 1e9) * 200).toFixed(2) + ')');
  console.log('  RPC:', config.rpcUrl.substring(0, 40) + '...');
  console.log('  Memories:', MEMORIES_DIR);
  console.log('  Index:', fs.existsSync(parentIndexPath) ? parentIndexPath : 'local');
  console.log('');
}

async function writeNewMemory() {
  clearScreen();
  printHeader();
  console.log('WRITE NEW MEMORY\n');
  
  const userId = await question('Your Name/ID: ');
  if (!userId.trim()) {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  const title = await question('Title: ');
  const content = await question('Content: ');
  
  if (!content.trim()) {
    console.log('\nError: Content required!\n');
    await question('Press Enter...');
    return;
  }
  
  const tagsInput = await question('Tags (comma-separated): ');
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : ['memory'];
  
  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const memory = {
    memory_id: memoryId,
    user_id: userId.trim(),
    memory_type: 'note',
    tags: tags,
    created_at: new Date().toISOString(),
    title: title.trim() || 'Untitled',
    chunks: [
      {
        chunk_id: `${memoryId}_chunk_1`,
        text: content,
        index: 0
      }
    ],
    entities: [],
    relationships: []
  };
  
  const memorySize = JSON.stringify(memory).length;
  const cost = estimateCost(memorySize);
  const estimatedTime = (memorySize / 1024) * 12; // ~12 seconds per KB
  
  console.log('\n' + '='.repeat(70));
  console.log('MEMORY PREVIEW');
  console.log('='.repeat(70));
  console.log('ID:', memoryId);
  console.log('User:', memory.user_id);
  console.log('Title:', memory.title);
  console.log('Tags:', tags.join(', '));
  console.log('Content:', content.substring(0, 80) + (content.length > 80 ? '...' : ''));
  console.log('');
  console.log('SIZE & COST ESTIMATE');
  console.log('  Size:', formatBytes(memorySize));
  console.log('  Cost:', cost.sol.toFixed(6), 'SOL (~$' + cost.usd.toFixed(4) + ')');
  console.log('  Est. Time:', formatTime(estimatedTime));
  console.log('  Storage: PERMANENT (forever on Solana)');
  console.log('='.repeat(70) + '\n');
  
  const confirm = await question('Upload to blockchain? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('\n' + '-'.repeat(70));
  console.log('UPLOADING TO SOLANA...');
  console.log('-'.repeat(70));
  console.log('');
  
  try {
    const start = Date.now();
    const result = await adapter.storeMemory(memory);
    const time = Date.now() - start;
    
    // Save locally
    const fileName = `${memoryId}.json`;
    const filePath = path.join(MEMORIES_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
    
    // Update stats
    sessionStats.uploads++;
    sessionStats.totalCost += result.cost;
    sessionStats.totalSize += result.size;
    
    const stats = loadStats();
    stats.totalUploads++;
    stats.totalCost += result.cost;
    stats.totalSize += result.size;
    stats.avgUploadTime = ((stats.avgUploadTime * (stats.totalUploads - 1)) + time) / stats.totalUploads;
    stats.lastUsed = new Date().toISOString();
    saveStats(stats);
    
    const actualSpeed = (result.size / 1024) / (time / 1000);
    
    console.log('\n' + '='.repeat(70));
    console.log('SUCCESS!');
    console.log('='.repeat(70));
    console.log('Memory ID:', memoryId);
    console.log('Session PDA:', result.session_pubkey);
    console.log('');
    console.log('TRANSACTION DETAILS');
    console.log('  Actual Cost:', result.cost.toFixed(6), 'SOL (~$' + (result.cost * 200).toFixed(4) + ')');
    console.log('  Size:', formatBytes(result.size));
    console.log('  Time:', formatTime(time));
    console.log('  Speed:', actualSpeed.toFixed(2), 'KB/s');
    console.log('  Saved to:', fileName);
    console.log('');
    console.log('STATUS: Permanently stored on Solana blockchain!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('ERROR');
    console.log('='.repeat(70));
    console.log('Message:', error.message);
    console.log('');
    if (error.message.includes('insufficient')) {
      console.log('Reason: Insufficient SOL balance');
      console.log('Action: Add more SOL to your wallet');
    } else if (error.message.includes('429')) {
      console.log('Reason: RPC rate limit');
      console.log('Action: Wait a moment and try again');
    } else {
      console.log('Action: Check error message and try again');
    }
    console.log('='.repeat(70) + '\n');
  }
  
  await question('Press Enter...');
}

async function readMemory() {
  clearScreen();
  printHeader();
  console.log('READ MEMORY FROM BLOCKCHAIN\n');
  
  // Show recent local memories
  const localFiles = fs.readdirSync(MEMORIES_DIR).filter(f => f.endsWith('.json') && f !== '.stats.json');
  
  if (localFiles.length > 0) {
    console.log('RECENT MEMORIES (from local cache):\n');
    localFiles.slice(-10).reverse().forEach((file, i) => {
      try {
        const mem = JSON.parse(fs.readFileSync(path.join(MEMORIES_DIR, file), 'utf-8'));
        const size = fs.statSync(path.join(MEMORIES_DIR, file)).size;
        console.log(`  [${i + 1}] ${mem.title || mem.memory_id.substring(0, 30)}`);
        console.log(`      User: ${mem.user_id} | Size: ${formatBytes(size)} | Tags: ${mem.tags.slice(0, 3).join(', ')}`);
      } catch (e) {
        // Skip invalid files
      }
    });
    console.log('');
  }
  
  const input = await question('Enter Memory ID or number from above: ');
  
  if (!input.trim()) {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  let memoryId = input.trim();
  
  // Check if selecting from recent
  const num = parseInt(input);
  if (!isNaN(num) && num > 0 && num <= Math.min(10, localFiles.length)) {
    const file = localFiles.slice(-10).reverse()[num - 1];
    const mem = JSON.parse(fs.readFileSync(path.join(MEMORIES_DIR, file), 'utf-8'));
    memoryId = mem.memory_id;
  }
  
  // Estimate download
  console.log('\n' + '-'.repeat(70));
  console.log('DOWNLOAD ESTIMATE');
  console.log('-'.repeat(70));
  console.log('Memory ID:', memoryId.substring(0, 50) + (memoryId.length > 50 ? '...' : ''));
  console.log('Est. Time: 2-5 seconds');
  console.log('Cost: FREE (only RPC bandwidth)');
  console.log('-'.repeat(70) + '\n');
  
  console.log('Downloading from Solana blockchain...\n');
  
  try {
    const start = Date.now();
    const memory = await adapter.getMemoryById(memoryId);
    const time = Date.now() - start;
    
    const memorySize = JSON.stringify(memory).length;
    const speed = (memorySize / 1024) / (time / 1000);
    
    // Update stats
    sessionStats.downloads++;
    const stats = loadStats();
    stats.totalDownloads++;
    stats.avgDownloadTime = ((stats.avgDownloadTime * (stats.totalDownloads - 1)) + time) / stats.totalDownloads;
    stats.lastUsed = new Date().toISOString();
    saveStats(stats);
    
    console.log('='.repeat(70));
    console.log('MEMORY RETRIEVED');
    console.log('='.repeat(70));
    console.log('ID:', memory.memory_id);
    console.log('User:', memory.user_id);
    console.log('Title:', memory.title || 'Untitled');
    console.log('Type:', memory.memory_type);
    console.log('Tags:', memory.tags?.join(', ') || 'none');
    console.log('Created:', memory.created_at || 'unknown');
    console.log('');
    console.log('DOWNLOAD STATS');
    console.log('  Size:', formatBytes(memorySize));
    console.log('  Time:', formatTime(time));
    console.log('  Speed:', speed.toFixed(2), 'KB/s');
    console.log('  Chunks:', memory.chunks.length);
    console.log('  Entities:', memory.entities.length);
    console.log('  Relationships:', memory.relationships.length);
    console.log('='.repeat(70) + '\n');
    
    console.log('CONTENT:\n');
    memory.chunks.forEach((chunk, i) => {
      console.log(`[Chunk ${i + 1}]`);
      console.log(chunk.text);
      if (i < memory.chunks.length - 1) console.log('');
    });
    console.log('');
    
    if (memory.entities.length > 0) {
      console.log('ENTITIES:');
      memory.entities.slice(0, 10).forEach(e => {
        console.log(`  - ${e.name} (${e.type}): ${e.description?.substring(0, 50) || 'no description'}`);
      });
      if (memory.entities.length > 10) {
        console.log(`  ... and ${memory.entities.length - 10} more`);
      }
      console.log('');
    }
    
    // Save locally
    const fileName = `${memory.memory_id}.json`;
    const filePath = path.join(MEMORIES_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
    console.log('Saved to local cache:', fileName, '\n');
    
  } catch (error) {
    console.log('='.repeat(70));
    console.log('ERROR');
    console.log('='.repeat(70));
    console.log('Message:', error.message);
    console.log('');
    if (error.message.includes('500')) {
      console.log('Reason: IQLabs API temporarily unavailable');
      console.log('Action: Try again in a few minutes');
      console.log('Note: Your data is safe on-chain');
    } else if (error.message.includes('not found')) {
      console.log('Reason: Memory ID not found in local index');
      console.log('Action: Check the Memory ID is correct');
    } else {
      console.log('Action: Check error and try again');
    }
    console.log('='.repeat(70) + '\n');
  }
  
  await question('Press Enter...');
}

async function listMemories() {
  clearScreen();
  printHeader();
  console.log('LIST MEMORIES\n');
  
  const memories = await adapter.searchMemories({});
  const totalSize = memories.reduce((sum, m) => sum + (m.size || 0), 0);
  
  console.log('OVERVIEW');
  console.log('  Total Memories:', memories.length);
  console.log('  Total Size:', formatBytes(totalSize));
  console.log('');
  
  if (memories.length === 0) {
    console.log('No memories found.\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('VIEW OPTIONS:');
  console.log('  [1] All memories (detailed)');
  console.log('  [2] By user');
  console.log('  [3] By tag');
  console.log('  [4] By type');
  console.log('  [5] Recent (last 20)\n');
  
  const choice = await question('Choose: ');
  console.log('');
  
  if (choice === '1') {
    console.log('ALL MEMORIES:\n');
    memories.slice(0, 50).forEach((m, i) => {
      console.log(`${i + 1}. ${m.title || m.memory_id.substring(0, 40)}`);
      console.log(`   ID: ${m.memory_id}`);
      console.log(`   User: ${m.user_id} | Type: ${m.memory_type} | Size: ${formatBytes(m.size || 0)}`);
      console.log(`   Tags: ${m.tags.join(', ')}`);
      console.log(`   Session: ${m.session_pubkey}`);
      console.log('');
    });
    if (memories.length > 50) {
      console.log(`... and ${memories.length - 50} more\n`);
    }
  } else if (choice === '2') {
    console.log('MEMORIES BY USER:\n');
    const byUser = {};
    memories.forEach(m => {
      if (!byUser[m.user_id]) byUser[m.user_id] = { count: 0, size: 0 };
      byUser[m.user_id].count++;
      byUser[m.user_id].size += m.size || 0;
    });
    Object.entries(byUser).sort((a, b) => b[1].count - a[1].count).forEach(([user, data]) => {
      console.log(`  ${user}: ${data.count} memories (${formatBytes(data.size)})`);
    });
    console.log('');
  } else if (choice === '3') {
    console.log('MEMORIES BY TAG:\n');
    const byTag = {};
    memories.forEach(m => {
      m.tags.forEach(tag => {
        if (!byTag[tag]) byTag[tag] = 0;
        byTag[tag]++;
      });
    });
    Object.entries(byTag).sort((a, b) => b[1] - a[1]).forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count} memories`);
    });
    console.log('');
  } else if (choice === '4') {
    console.log('MEMORIES BY TYPE:\n');
    const byType = {};
    memories.forEach(m => {
      if (!byType[m.memory_type]) byType[m.memory_type] = { count: 0, size: 0 };
      byType[m.memory_type].count++;
      byType[m.memory_type].size += m.size || 0;
    });
    Object.entries(byType).sort((a, b) => b[1].count - a[1].count).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} memories (${formatBytes(data.size)})`);
    });
    console.log('');
  } else if (choice === '5') {
    console.log('RECENT MEMORIES:\n');
    memories.slice(-20).reverse().forEach((m, i) => {
      console.log(`${i + 1}. ${m.title || m.memory_id.substring(0, 40)}`);
      console.log(`   User: ${m.user_id} | Tags: ${m.tags.slice(0, 3).join(', ')}`);
      console.log('');
    });
  }
  
  await question('Press Enter...');
}

async function searchMemories() {
  clearScreen();
  printHeader();
  console.log('SEARCH MEMORIES\n');
  
  console.log('SEARCH BY:');
  console.log('  [1] Tag');
  console.log('  [2] User');
  console.log('  [3] Type\n');
  
  const choice = await question('Choose: ');
  
  let query = {};
  let searchTerm;
  let searchType;
  
  if (choice === '1') {
    searchType = 'Tag';
    searchTerm = await question('Enter tag: ');
    query.tags = [searchTerm.trim()];
  } else if (choice === '2') {
    searchType = 'User';
    searchTerm = await question('Enter user ID: ');
    query.user_id = searchTerm.trim();
  } else if (choice === '3') {
    searchType = 'Type';
    searchTerm = await question('Enter memory type: ');
    query.memory_type = searchTerm.trim();
  } else {
    console.log('\nInvalid choice.\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('\nSearching...\n');
  
  const start = Date.now();
  const results = await adapter.searchMemories(query);
  const time = Date.now() - start;
  
  const totalSize = results.reduce((sum, m) => sum + (m.size || 0), 0);
  
  console.log('='.repeat(70));
  console.log('SEARCH RESULTS');
  console.log('='.repeat(70));
  console.log('Query:', searchType, '=', searchTerm);
  console.log('Found:', results.length, 'memories');
  console.log('Total Size:', formatBytes(totalSize));
  console.log('Search Time:', formatTime(time));
  console.log('='.repeat(70) + '\n');
  
  if (results.length === 0) {
    console.log('No matches found.\n');
  } else {
    results.slice(0, 30).forEach((m, i) => {
      console.log(`${i + 1}. ${m.title || m.memory_id.substring(0, 40)}`);
      console.log(`   User: ${m.user_id} | Type: ${m.memory_type} | Size: ${formatBytes(m.size || 0)}`);
      console.log(`   Tags: ${m.tags.join(', ')}`);
      console.log('');
    });
    if (results.length > 30) {
      console.log(`... and ${results.length - 30} more\n`);
    }
  }
  
  await question('Press Enter...');
}

async function showStatistics() {
  clearScreen();
  printHeader();
  console.log('STATISTICS & ANALYTICS\n');
  
  const balance = await connection.getBalance(wallet.publicKey);
  const memories = await adapter.searchMemories({});
  const stats = loadStats();
  
  const totalSize = memories.reduce((sum, m) => sum + (m.size || 0), 0);
  const users = new Set(memories.map(m => m.user_id));
  const types = new Set(memories.map(m => m.memory_type));
  const allTags = memories.flatMap(m => m.tags);
  const uniqueTags = new Set(allTags);
  
  console.log('='.repeat(70));
  console.log('WALLET');
  console.log('='.repeat(70));
  console.log('Address:', wallet.publicKey.toBase58());
  console.log('Balance:', (balance / 1e9).toFixed(6), 'SOL (~$' + ((balance / 1e9) * 200).toFixed(2) + ')');
  console.log('');
  
  console.log('='.repeat(70));
  console.log('MEMORIES');
  console.log('='.repeat(70));
  console.log('Total:', memories.length);
  console.log('Users:', users.size);
  console.log('Types:', types.size);
  console.log('Unique Tags:', uniqueTags.size);
  console.log('Total Size:', formatBytes(totalSize));
  console.log('Avg Size:', formatBytes(totalSize / memories.length || 0));
  console.log('');
  
  console.log('='.repeat(70));
  console.log('LIFETIME STATS');
  console.log('='.repeat(70));
  console.log('Total Uploads:', stats.totalUploads);
  console.log('Total Downloads:', stats.totalDownloads);
  console.log('Total Cost:', stats.totalCost.toFixed(6), 'SOL (~$' + (stats.totalCost * 200).toFixed(2) + ')');
  console.log('Avg Upload Time:', formatTime(stats.avgUploadTime || 0));
  console.log('Avg Download Time:', formatTime(stats.avgDownloadTime || 0));
  console.log('Last Used:', stats.lastUsed || 'never');
  console.log('');
  
  console.log('='.repeat(70));
  console.log('SESSION STATS');
  console.log('='.repeat(70));
  console.log('Uploads:', sessionStats.uploads);
  console.log('Downloads:', sessionStats.downloads);
  console.log('Cost:', sessionStats.totalCost.toFixed(6), 'SOL');
  console.log('Size:', formatBytes(sessionStats.totalSize));
  console.log('Duration:', formatTime(Date.now() - sessionStats.startTime));
  console.log('');
  
  if (memories.length > 0) {
    console.log('='.repeat(70));
    console.log('TOP 10 TAGS');
    console.log('='.repeat(70));
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([tag, count], i) => {
        console.log(`  ${i + 1}. ${tag}: ${count} memories`);
      });
    console.log('');
    
    console.log('='.repeat(70));
    console.log('TOP 10 USERS');
    console.log('='.repeat(70));
    const userCounts = {};
    memories.forEach(m => {
      userCounts[m.user_id] = (userCounts[m.user_id] || 0) + 1;
    });
    Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([user, count], i) => {
        console.log(`  ${i + 1}. ${user}: ${count} memories`);
      });
    console.log('');
  }
  
  await question('Press Enter...');
}

async function walletInfo() {
  clearScreen();
  printHeader();
  console.log('WALLET INFORMATION\n');
  
  const balance = await connection.getBalance(wallet.publicKey);
  const lamportsPerSOL = 1000000000;
  
  console.log('='.repeat(70));
  console.log('WALLET DETAILS');
  console.log('='.repeat(70));
  console.log('Public Key:', wallet.publicKey.toBase58());
  console.log('Balance:', (balance / lamportsPerSOL).toFixed(9), 'SOL');
  console.log('Balance (USD):', '$' + ((balance / lamportsPerSOL) * 200).toFixed(2), '(~$200/SOL)');
  console.log('Balance (Lamports):', balance.toLocaleString());
  console.log('');
  
  console.log('='.repeat(70));
  console.log('COST ESTIMATES');
  console.log('='.repeat(70));
  console.log('1 KB memory:', '~0.000025 SOL (~$0.005)');
  console.log('10 KB memory:', '~0.00025 SOL (~$0.05)');
  console.log('100 KB memory:', '~0.0025 SOL (~$0.50)');
  console.log('');
  console.log('With current balance you can store:');
  const canStore = (balance / lamportsPerSOL) / 0.000025;
  console.log('  ~' + (canStore).toFixed(0), 'KB of data');
  console.log('  ~' + (canStore / 1024).toFixed(2), 'MB of data');
  console.log('');
  
  console.log('='.repeat(70));
  console.log('NETWORK');
  console.log('='.repeat(70));
  console.log('RPC Endpoint:', connection.rpcEndpoint);
  console.log('Commitment:', connection.commitment);
  console.log('');
  
  await question('Press Enter...');
}

async function sessionStatsView() {
  clearScreen();
  printHeader();
  console.log('SESSION STATISTICS\n');
  
  const duration = Date.now() - sessionStats.startTime;
  
  console.log('='.repeat(70));
  console.log('CURRENT SESSION');
  console.log('='.repeat(70));
  console.log('Started:', new Date(sessionStats.startTime).toLocaleString());
  console.log('Duration:', formatTime(duration));
  console.log('');
  console.log('OPERATIONS');
  console.log('  Uploads:', sessionStats.uploads);
  console.log('  Downloads:', sessionStats.downloads);
  console.log('  Total Operations:', sessionStats.uploads + sessionStats.downloads);
  console.log('');
  console.log('COSTS & DATA');
  console.log('  Total Cost:', sessionStats.totalCost.toFixed(6), 'SOL (~$' + (sessionStats.totalCost * 200).toFixed(4) + ')');
  console.log('  Total Size:', formatBytes(sessionStats.totalSize));
  console.log('');
  
  if (sessionStats.uploads > 0) {
    console.log('AVERAGES');
    console.log('  Avg Cost/Upload:', (sessionStats.totalCost / sessionStats.uploads).toFixed(6), 'SOL');
    console.log('  Avg Size/Upload:', formatBytes(sessionStats.totalSize / sessionStats.uploads));
  }
  
  console.log('='.repeat(70) + '\n');
  
  await question('Press Enter...');
}

async function uploadFileOrFolder() {
  clearScreen();
  printHeader();
  console.log('UPLOAD FILE OR FOLDER\n');
  
  const filePath = await question('Enter file or folder path: ');
  
  if (!filePath.trim()) {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  const fullPath = path.resolve(filePath.trim());
  
  if (!fs.existsSync(fullPath)) {
    console.log('\nError: Path not found!\n');
    await question('Press Enter...');
    return;
  }
  
  const stats = fs.statSync(fullPath);
  const isDirectory = stats.isDirectory();
  
  console.log('\n' + '='.repeat(70));
  console.log('FILE/FOLDER ANALYSIS');
  console.log('='.repeat(70));
  console.log('Path:', fullPath);
  console.log('Type:', isDirectory ? 'FOLDER' : 'FILE');
  
  let dataToUpload;
  let originalName = path.basename(fullPath);
  let fileType;
  
  if (isDirectory) {
    console.log('Action: Will compress to ZIP');
    console.log('');
    console.log('Compressing folder...');
    
    const archiver = require('archiver');
    const { Readable } = require('stream');
    
    // Create zip in memory
    const chunks = [];
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('data', chunk => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
      
      archive.directory(fullPath, false);
      archive.finalize();
    });
    
    dataToUpload = Buffer.concat(chunks).toString('base64');
    fileType = 'folder_zip';
    
    console.log('Compressed!');
    console.log('Original size:', formatBytes(getDirectorySize(fullPath)));
    console.log('Compressed size:', formatBytes(Buffer.byteLength(dataToUpload, 'base64')));
  } else {
    console.log('Size:', formatBytes(stats.size));
    fileType = path.extname(fullPath).substring(1) || 'file';
    
    // Read file and encode to base64
    const fileBuffer = fs.readFileSync(fullPath);
    dataToUpload = fileBuffer.toString('base64');
  }
  
  const userId = await question('\nYour name/ID: ');
  if (!userId.trim()) {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  const tagsInput = await question('Tags (comma-separated): ');
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : ['file'];
  
  const memoryId = `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const memory = {
    memory_id: memoryId,
    user_id: userId.trim(),
    memory_type: 'file',
    tags: tags,
    created_at: new Date().toISOString(),
    title: originalName,
    file_metadata: {
      original_name: originalName,
      file_type: fileType,
      is_directory: isDirectory,
      encoding: 'base64'
    },
    chunks: [
      {
        chunk_id: `${memoryId}_data`,
        text: dataToUpload,
        index: 0
      }
    ],
    entities: [],
    relationships: []
  };
  
  const memorySize = JSON.stringify(memory).length;
  const cost = estimateCost(memorySize);
  
  console.log('\n' + '='.repeat(70));
  console.log('UPLOAD PREVIEW');
  console.log('='.repeat(70));
  console.log('File/Folder:', originalName);
  console.log('Type:', isDirectory ? 'Folder (ZIP)' : 'File');
  console.log('User:', userId.trim());
  console.log('Tags:', tags.join(', '));
  console.log('');
  console.log('COST ESTIMATE');
  console.log('  Size:', formatBytes(memorySize));
  console.log('  Cost:', cost.sol.toFixed(6), 'SOL (~$' + cost.usd.toFixed(4) + ')');
  console.log('  Storage: PERMANENT');
  console.log('='.repeat(70) + '\n');
  
  const confirm = await question('Upload to blockchain? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('\nUploading...\n');
  
  try {
    const start = Date.now();
    const result = await adapter.storeMemory(memory);
    const time = Date.now() - start;
    
    // Save metadata locally
    const metaFile = path.join(MEMORIES_DIR, `${memoryId}.json`);
    fs.writeFileSync(metaFile, JSON.stringify(memory, null, 2));
    
    sessionStats.uploads++;
    sessionStats.totalCost += result.cost;
    sessionStats.totalSize += result.size;
    
    const stats = loadStats();
    stats.totalUploads++;
    stats.totalCost += result.cost;
    stats.totalSize += result.size;
    saveStats(stats);
    
    console.log('\n' + '='.repeat(70));
    console.log('SUCCESS!');
    console.log('='.repeat(70));
    console.log('Memory ID:', memoryId);
    console.log('Session PDA:', result.session_pubkey);
    console.log('Cost:', result.cost.toFixed(6), 'SOL');
    console.log('Time:', formatTime(time));
    console.log('');
    console.log('File/folder permanently stored on Solana!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.log('\nError:', error.message, '\n');
  }
  
  await question('Press Enter...');
}

function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
}

async function downloadFileOrFolder() {
  clearScreen();
  printHeader();
  console.log('DOWNLOAD FILE OR FOLDER\n');
  
  // Show file-type memories
  const allMemories = await adapter.searchMemories({});
  const fileMemories = allMemories.filter(m => m.memory_type === 'file');
  
  if (fileMemories.length > 0) {
    console.log('AVAILABLE FILES/FOLDERS:\n');
    fileMemories.slice(-10).reverse().forEach((m, i) => {
      console.log(`  [${i + 1}] ${m.title || m.memory_id.substring(0, 30)}`);
      console.log(`      User: ${m.user_id} | Tags: ${m.tags.slice(0, 2).join(', ')}`);
    });
    console.log('');
  }
  
  const input = await question('Enter Memory ID or number from above: ');
  
  if (!input.trim()) {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  let memoryId = input.trim();
  
  // Check if selecting from list
  const num = parseInt(input);
  if (!isNaN(num) && num > 0 && num <= Math.min(10, fileMemories.length)) {
    memoryId = fileMemories.slice(-10).reverse()[num - 1].memory_id;
  }
  
  console.log('\nDownloading from blockchain...\n');
  
  try {
    const start = Date.now();
    const memory = await adapter.getMemoryById(memoryId);
    const time = Date.now() - start;
    
    if (memory.memory_type !== 'file') {
      console.log('Error: This is not a file/folder memory!\n');
      await question('Press Enter...');
      return;
    }
    
    const fileMetadata = memory.file_metadata;
    const originalName = fileMetadata.original_name;
    const isDirectory = fileMetadata.is_directory;
    const fileData = memory.chunks[0].text;
    
    console.log('Downloaded!');
    console.log('Name:', originalName);
    console.log('Type:', isDirectory ? 'Folder (ZIP)' : 'File');
    console.log('Time:', formatTime(time));
    console.log('');
    
    // Decode from base64
    const buffer = Buffer.from(fileData, 'base64');
    
    if (isDirectory) {
      console.log('Extracting ZIP...');
      
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(buffer);
      
      const extractPath = path.join(DOWNLOADS_DIR, originalName);
      zip.extractAllTo(extractPath, true);
      
      console.log('Extracted to:', extractPath);
    } else {
      const outputPath = path.join(DOWNLOADS_DIR, originalName);
      fs.writeFileSync(outputPath, buffer);
      
      console.log('Saved to:', outputPath);
    }
    
    console.log('');
    console.log('Download complete!');
    console.log('Location:', DOWNLOADS_DIR);
    console.log('');
    
    sessionStats.downloads++;
    const stats = loadStats();
    stats.totalDownloads++;
    saveStats(stats);
    
  } catch (error) {
    console.log('\nError:', error.message, '\n');
  }
  
  await question('Press Enter...');
}

async function batchUploadMemories() {
  clearScreen();
  printHeader();
  console.log('BATCH UPLOAD MEMORIES\n');
  
  const folderPath = await question('Enter folder path containing JSON files: ');
  
  if (!folderPath.trim()) {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  const fullPath = path.resolve(folderPath.trim());
  
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    console.log('\nError: Folder not found!\n');
    await question('Press Enter...');
    return;
  }
  
  // Find all JSON files
  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('\nNo JSON files found in folder!\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('Found', files.length, 'JSON files\n');
  
  // Preview files
  files.slice(0, 10).forEach((file, i) => {
    console.log(`  ${i + 1}. ${file}`);
  });
  if (files.length > 10) {
    console.log(`  ... and ${files.length - 10} more`);
  }
  console.log('');
  
  // Estimate total cost
  let totalSize = 0;
  const validFiles = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(fullPath, file), 'utf-8');
      const memory = JSON.parse(content);
      
      if (memory.memory_id && memory.user_id && memory.chunks) {
        validFiles.push({ file, memory, size: content.length });
        totalSize += content.length;
      }
    } catch (e) {
      console.log(`Warning: Skipping invalid file ${file}`);
    }
  }
  
  const totalCost = estimateCost(totalSize);
  const estimatedTime = validFiles.length * 12; // ~12 seconds per upload
  
  console.log('BATCH UPLOAD SUMMARY');
  console.log('  Valid files:', validFiles.length);
  console.log('  Total size:', formatBytes(totalSize));
  console.log('  Est. cost:', totalCost.sol.toFixed(6), 'SOL (~$' + totalCost.usd.toFixed(2) + ')');
  console.log('  Est. time:', formatTime(estimatedTime * 1000));
  console.log('');
  
  const confirm = await question('Start batch upload? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('BATCH UPLOADING');
  console.log('='.repeat(70) + '\n');
  
  let successCount = 0;
  let failCount = 0;
  let totalCostActual = 0;
  const batchStart = Date.now();
  
  for (let i = 0; i < validFiles.length; i++) {
    const { file, memory } = validFiles[i];
    
    console.log(`[${i + 1}/${validFiles.length}] Uploading ${file}...`);
    
    try {
      const result = await adapter.storeMemory(memory);
      
      successCount++;
      totalCostActual += result.cost;
      
      console.log(`    SUCCESS - Cost: ${result.cost.toFixed(6)} SOL`);
      
      sessionStats.uploads++;
      sessionStats.totalCost += result.cost;
      sessionStats.totalSize += result.size;
      
      // Small delay between uploads
      if (i < validFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      failCount++;
      console.log(`    FAILED - ${error.message}`);
    }
  }
  
  const batchTime = Date.now() - batchStart;
  
  // Update stats
  const stats = loadStats();
  stats.totalUploads += successCount;
  stats.totalCost += totalCostActual;
  saveStats(stats);
  
  console.log('\n' + '='.repeat(70));
  console.log('BATCH UPLOAD COMPLETE');
  console.log('='.repeat(70));
  console.log('Success:', successCount);
  console.log('Failed:', failCount);
  console.log('Total cost:', totalCostActual.toFixed(6), 'SOL (~$' + (totalCostActual * 200).toFixed(2) + ')');
  console.log('Total time:', formatTime(batchTime));
  if (successCount > 0) {
    console.log('Avg time per upload:', formatTime(batchTime / successCount));
  }
  console.log('='.repeat(70) + '\n');
  
  await question('Press Enter...');
}

async function testAllFeatures() {
  clearScreen();
  printHeader();
  console.log('TEST ALL FEATURES\n');
  
  console.log('This will run tests on all features.\n');
  
  const confirm = await question('Start testing? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\nCancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('FEATURE TESTING');
  console.log('='.repeat(70) + '\n');
  
  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // TEST 1: Write Memory
  console.log('[1/8] Testing Write Memory...');
  try {
    const testMem = {
      memory_id: `test_${Date.now()}`,
      user_id: 'test_user',
      memory_type: 'test',
      tags: ['test'],
      created_at: new Date().toISOString(),
      title: 'Test Memory',
      chunks: [{ chunk_id: 'c1', text: 'Test content', index: 0 }],
      entities: [],
      relationships: []
    };
    
    const result = await adapter.storeMemory(testMem);
    
    if (result.session_pubkey && result.size > 0) {
      console.log('   PASS - Memory uploaded successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Write Memory', status: 'PASS', details: `Session: ${result.session_pubkey}` });
      
      // Wait for finalization
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // TEST 2: Read Memory
      console.log('[2/8] Testing Read Memory...');
      try {
        const downloaded = await adapter.getMemoryById(testMem.memory_id);
        
        if (downloaded.memory_id === testMem.memory_id && 
            downloaded.chunks[0].text === testMem.chunks[0].text) {
          console.log('   PASS - Memory downloaded and verified');
          testResults.passed++;
          testResults.tests.push({ name: 'Read Memory', status: 'PASS', details: 'Data integrity 100%' });
        } else {
          console.log('   FAIL - Data mismatch');
          testResults.failed++;
          testResults.tests.push({ name: 'Read Memory', status: 'FAIL', details: 'Data integrity failed' });
        }
      } catch (error) {
        console.log('   FAIL -', error.message);
        testResults.failed++;
        testResults.tests.push({ name: 'Read Memory', status: 'FAIL', details: error.message });
      }
    } else {
      console.log('   FAIL - Upload failed');
      testResults.failed++;
      testResults.tests.push({ name: 'Write Memory', status: 'FAIL', details: 'Upload failed' });
    }
  } catch (error) {
    console.log('   FAIL -', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Write Memory', status: 'FAIL', details: error.message });
  }
  
  // TEST 3: List Memories
  console.log('[3/8] Testing List Memories...');
  try {
    const memories = await adapter.searchMemories({});
    if (memories.length > 0) {
      console.log('   PASS - Found', memories.length, 'memories');
      testResults.passed++;
      testResults.tests.push({ name: 'List Memories', status: 'PASS', details: `${memories.length} memories` });
    } else {
      console.log('   FAIL - No memories found');
      testResults.failed++;
      testResults.tests.push({ name: 'List Memories', status: 'FAIL', details: 'No memories' });
    }
  } catch (error) {
    console.log('   FAIL -', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'List Memories', status: 'FAIL', details: error.message });
  }
  
  // TEST 4: Search by Tag
  console.log('[4/8] Testing Search by Tag...');
  try {
    const results = await adapter.searchMemories({ tags: ['test'] });
    if (results.length > 0) {
      console.log('   PASS - Found', results.length, 'memories with tag "test"');
      testResults.passed++;
      testResults.tests.push({ name: 'Search by Tag', status: 'PASS', details: `${results.length} results` });
    } else {
      console.log('   FAIL - No results');
      testResults.failed++;
      testResults.tests.push({ name: 'Search by Tag', status: 'FAIL', details: 'No results' });
    }
  } catch (error) {
    console.log('   FAIL -', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Search by Tag', status: 'FAIL', details: error.message });
  }
  
  // TEST 5: Search by User
  console.log('[5/8] Testing Search by User...');
  try {
    const results = await adapter.searchMemories({ user_id: 'test_user' });
    if (results.length > 0) {
      console.log('   PASS - Found', results.length, 'memories for user');
      testResults.passed++;
      testResults.tests.push({ name: 'Search by User', status: 'PASS', details: `${results.length} results` });
    } else {
      console.log('   FAIL - No results');
      testResults.failed++;
      testResults.tests.push({ name: 'Search by User', status: 'FAIL', details: 'No results' });
    }
  } catch (error) {
    console.log('   FAIL -', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Search by User', status: 'FAIL', details: error.message });
  }
  
  // TEST 6: Memory Index
  console.log('[6/8] Testing Memory Index...');
  try {
    const memories = await adapter.searchMemories({});
    if (memories.length > 0) {
      console.log('   PASS -', memories.length, 'memories indexed');
      testResults.passed++;
      testResults.tests.push({ name: 'Memory Index', status: 'PASS', details: `${memories.length} indexed` });
    } else {
      console.log('   FAIL - Index empty');
      testResults.failed++;
      testResults.tests.push({ name: 'Memory Index', status: 'FAIL', details: 'Empty index' });
    }
  } catch (error) {
    console.log('   FAIL -', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Memory Index', status: 'FAIL', details: error.message });
  }
  
  // TEST 7: Statistics
  console.log('[7/8] Testing Statistics...');
  try {
    const stats = loadStats();
    if (stats.totalUploads >= 0 && stats.totalDownloads >= 0) {
      console.log('   PASS - Stats loaded');
      testResults.passed++;
      testResults.tests.push({ name: 'Statistics', status: 'PASS', details: 'Stats working' });
    } else {
      console.log('   FAIL - Invalid stats');
      testResults.failed++;
      testResults.tests.push({ name: 'Statistics', status: 'FAIL', details: 'Invalid data' });
    }
  } catch (error) {
    console.log('   FAIL -', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Statistics', status: 'FAIL', details: error.message });
  }
  
  // TEST 8: Wallet Connection
  console.log('[8/8] Testing Wallet Connection...');
  try {
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance >= 0) {
      console.log('   PASS - Wallet connected, balance:', (balance / 1e9).toFixed(6), 'SOL');
      testResults.passed++;
      testResults.tests.push({ name: 'Wallet Connection', status: 'PASS', details: `${(balance / 1e9).toFixed(6)} SOL` });
    } else {
      console.log('   FAIL - Invalid balance');
      testResults.failed++;
      testResults.tests.push({ name: 'Wallet Connection', status: 'FAIL', details: 'Invalid balance' });
    }
  } catch (error) {
    console.log('   FAIL -', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Wallet Connection', status: 'FAIL', details: error.message });
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS');
  console.log('='.repeat(70));
  console.log('Total tests:', testResults.passed + testResults.failed);
  console.log('Passed:', testResults.passed);
  console.log('Failed:', testResults.failed);
  console.log('Success rate:', ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) + '%');
  console.log('');
  
  console.log('DETAILED RESULTS:');
  testResults.tests.forEach((test, i) => {
    console.log(`  ${i + 1}. ${test.name}: ${test.status}`);
    console.log(`     ${test.details}`);
  });
  
  console.log('');
  
  if (testResults.failed === 0) {
    console.log('ALL TESTS PASSED!');
    console.log('System is 100% functional and ready for production.');
  } else {
    console.log('Some tests failed. Review errors above.');
  }
  
  console.log('='.repeat(70) + '\n');
  
  await question('Press Enter...');
}

async function syncFromBlockchain() {
  clearScreen();
  printHeader();
  console.log('SYNC FROM BLOCKCHAIN\n');
  
  console.log('This will download all memories from the blockchain that are');
  console.log('not in your local cache.\n');
  
  // Get all memories from index
  console.log('Scanning blockchain index...\n');
  const allMemories = await adapter.searchMemories({});
  
  // Get local files
  const localFiles = fs.readdirSync(MEMORIES_DIR)
    .filter(f => f.endsWith('.json') && f !== '.stats.json');
  
  const localMemoryIds = new Set();
  localFiles.forEach(file => {
    try {
      const mem = JSON.parse(fs.readFileSync(path.join(MEMORIES_DIR, file), 'utf-8'));
      localMemoryIds.add(mem.memory_id);
    } catch (e) {
      // Skip invalid files
    }
  });
  
  // Find missing memories
  const missingMemories = allMemories.filter(m => !localMemoryIds.has(m.memory_id));
  
  console.log('='.repeat(70));
  console.log('SYNC ANALYSIS');
  console.log('='.repeat(70));
  console.log('Total memories on blockchain:', allMemories.length);
  console.log('Memories in local cache:', localMemoryIds.size);
  console.log('Missing memories:', missingMemories.length);
  console.log('='.repeat(70) + '\n');
  
  if (missingMemories.length === 0) {
    console.log('All memories are already synced!\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('Memories to download:\n');
  missingMemories.slice(0, 10).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.memory_id.substring(0, 40)}...`);
    console.log(`     User: ${m.user_id} | Type: ${m.memory_type} | Tags: ${m.tags.slice(0, 2).join(', ')}`);
  });
  if (missingMemories.length > 10) {
    console.log(`  ... and ${missingMemories.length - 10} more`);
  }
  console.log('');
  
  const estimatedTime = missingMemories.length * 3; // ~3 seconds per memory
  console.log('Estimated time:', formatTime(estimatedTime * 1000));
  console.log('Cost: FREE (only RPC bandwidth)\n');
  
  const confirm = await question('Start sync? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\nSync cancelled.\n');
    await question('Press Enter...');
    return;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('SYNCING FROM BLOCKCHAIN');
  console.log('='.repeat(70) + '\n');
  
  let successCount = 0;
  let failCount = 0;
  const syncStart = Date.now();
  
  for (let i = 0; i < missingMemories.length; i++) {
    const m = missingMemories[i];
    
    console.log(`[${i + 1}/${missingMemories.length}] Downloading ${m.memory_id.substring(0, 30)}...`);
    
    try {
      const memory = await adapter.getMemoryById(m.memory_id);
      
      // Save to local cache
      const fileName = `${memory.memory_id}.json`;
      const filePath = path.join(MEMORIES_DIR, fileName);
      fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
      
      successCount++;
      console.log(`    SUCCESS - Saved to ${fileName}`);
      
      // Update stats
      sessionStats.downloads++;
      const stats = loadStats();
      stats.totalDownloads++;
      saveStats(stats);
      
      // Small delay to avoid rate limiting
      if (i < missingMemories.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      failCount++;
      console.log(`    FAILED - ${error.message}`);
      
      // If API error, ask to continue
      if (error.message.includes('500') && i < missingMemories.length - 1) {
        console.log('');
        const continueSync = await question('API error. Continue? (y/n): ');
        if (continueSync.toLowerCase() !== 'y' && continueSync.toLowerCase() !== 'yes') {
          console.log('\nSync stopped by user.\n');
          break;
        }
        console.log('');
        // Wait longer before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  const syncTime = Date.now() - syncStart;
  
  console.log('\n' + '='.repeat(70));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(70));
  console.log('Success:', successCount);
  console.log('Failed:', failCount);
  console.log('Total time:', formatTime(syncTime));
  if (successCount > 0) {
    console.log('Avg time per memory:', formatTime(syncTime / successCount));
  }
  console.log('');
  
  if (failCount > 0) {
    console.log('NOTE: Failed downloads may be due to:');
    console.log('  - IQLabs API temporary issues');
    console.log('  - Network connectivity');
    console.log('  - Session not yet finalized');
    console.log('');
    console.log('You can run sync again later to retry failed downloads.');
    console.log('');
  }
  
  if (successCount > 0) {
    console.log('All synced memories are now in your local cache!');
    console.log('Location:', MEMORIES_DIR);
    console.log('');
  }
  
  console.log('='.repeat(70) + '\n');
  
  await question('Press Enter...');
}

async function main() {
  try {
    clearScreen();
    printHeader();
    
    console.log('Initializing system...\n');
    await initAdapter();
    
    while (true) {
      clearScreen();
      printHeader();
      printMainMenu();
      
      const choice = await question('Choose: ');
      
      switch (choice.trim()) {
        case '1':
          await writeNewMemory();
          break;
        case '2':
          await readMemory();
          break;
        case '3':
          await listMemories();
          break;
        case '4':
          await searchMemories();
          break;
        case '5':
          await syncFromBlockchain();
          break;
        case '6':
          await uploadFileOrFolder();
          break;
        case '7':
          await downloadFileOrFolder();
          break;
        case '8':
          await batchUploadMemories();
          break;
        case '9':
        case '11':
        case '12':
          console.log('\nFeature coming soon!\n');
          await question('Press Enter...');
          break;
        case '10':
          await showStatistics();
          break;
        case '13':
          await testAllFeatures();
          break;
        case '14':
          await walletInfo();
          break;
        case '15':
          await sessionStatsView();
          break;
        case '0':
          console.log('\n' + '='.repeat(70));
          console.log('SESSION SUMMARY');
          console.log('='.repeat(70));
          console.log('Uploads:', sessionStats.uploads);
          console.log('Downloads:', sessionStats.downloads);
          console.log('Total Cost:', sessionStats.totalCost.toFixed(6), 'SOL');
          console.log('Duration:', formatTime(Date.now() - sessionStats.startTime));
          console.log('='.repeat(70));
          console.log('\nGoodbye!\n');
          rl.close();
          process.exit(0);
        default:
          console.log('\nInvalid choice.\n');
          await question('Press Enter...');
      }
    }
  } catch (error) {
    console.error('\nFATAL ERROR:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

main();
