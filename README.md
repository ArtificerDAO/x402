# On-Chain Memory CLI

Store and retrieve Cognee-compatible memories on Solana blockchain using IQLabs Pinocchio protocol.

## Features

- Store memories permanently on Solana blockchain
- Fast retrieval with local indexing
- Search by memory ID, user, tags, type, date range
- Batch upload multiple memories
- File and folder upload/download (auto-zip/unzip)
- Sync memories from blockchain
- Cost estimation and progress tracking
- Interactive CLI with comprehensive testing

1. INSTALL DEPENDENCIES

   npm install

2. SETUP WALLET

   Create a "wallet" folder and add your Solana wallet JSON file:
   
   mkdir wallet
   
   Add your wallet file to wallet/ directory

3. RUN THE CLI

   node onchain-memory.js

================================================================================
                         FEATURES
================================================================================

- Store memories on Solana blockchain
- Download and verify memories
- Search by ID, user, tags, type, date
- Batch upload multiple memories
- Upload/download files and folders
- Sync from blockchain
- Automated testing
- Cost estimation

================================================================================
                         REQUIREMENTS
================================================================================

- Node.js 16+
- Solana wallet with SOL
- RPC endpoint (Alchemy/Helius)

================================================================================
                         CONFIGURATION
================================================================================

The CLI looks for wallet.config.json in the parent directory:

{
  "rpcUrl": "https://your-rpc-endpoint",
  "privateKey": [/* wallet private key array */]
}

Or use environment variable:
export SOLANA_RPC_URL="https://your-rpc-endpoint"

================================================================================
                         FILE STRUCTURE
================================================================================

onchain-memory.js       - Main CLI (all-in-one)
package.json            - Dependencies
wallet.example.json     - Wallet template
memory.example.json     - Memory template
.gitignore              - Security rules
README.txt              - This file

Auto-created folders:
  wallet/               - Your wallet files
  memories/             - Local memory cache
  downloaded/           - Downloaded files

================================================================================
                         USAGE
================================================================================

Run the CLI:

  node onchain-memory.js

Select from menu:
  [1] Write New Memory
  [2] Read Memory
  [3] List All Memories
  [4] Search Memories
  [5] View Memory Details
  [6] View Statistics
  [7] Batch Upload Memories
  [8] Upload File/Folder
  [9] Download File/Folder
  [10] Test All Features
  [11] Sync from Blockchain
  [0] Exit

================================================================================
                         MEMORY FORMAT
================================================================================

See memory.example.json for the complete structure.

Basic format:
{
  "memory_id": "unique-id",
  "user_id": "user-name",
  "memory_type": "document_chunk",
  "tags": ["tag1", "tag2"],
  "created_at": "2025-11-12T00:00:00.000Z",
  "title": "Memory Title",
  "chunks": [
    {
      "chunk_id": "c1",
      "text": "Content here",
      "index": 0
    }
  ],
  "entities": [],
  "relationships": []
}

================================================================================
                         COST & PERFORMANCE
================================================================================

Typical costs:
  Small (1 KB):   ~0.0001 SOL (~$0.02)
  Medium (10 KB): ~0.001 SOL  (~$0.20)
  Large (100 KB): ~0.01 SOL   (~$2.00)

Performance:
  Upload:   2-5 seconds
  Download: 2-3 seconds
  Search:   Instant (local index)

================================================================================
                         SECURITY
================================================================================

- Never commit wallet files to git
- Private keys stored locally only
- Use .gitignore to protect sensitive data
- On-chain data is public and immutable

================================================================================
                         TROUBLESHOOTING
================================================================================

"Insufficient funds"
  - Add more SOL to your wallet

"Transaction failed"
  - Check RPC endpoint
  - Verify wallet has SOL
  - Wait and retry

"Memory not found"
  - Run sync to update local index
  - Check memory ID is correct

================================================================================
                         SUPPORT
================================================================================

For issues:
  - Test with small data first
  - Run option [10] Test All Features
  - Verify wallet has enough SOL
  - Check RPC connection


### Interactive CLI

The CLI provides an interactive menu with the following options:

#### Basic Operations
- **Write New Memory** - Upload a memory to blockchain
- **Read Memory** - Download and view a memory
- **List All Memories** - Show all indexed memories
- **Search Memories** - Filter by tags, user, type, date

#### Advanced Features
- **Batch Upload** - Upload multiple memories from a folder
- **Upload File/Folder** - Store any file or folder on-chain
- **Download File/Folder** - Retrieve and extract files/folders
- **Sync from Blockchain** - Download all on-chain memories to local cache

#### System
- **View Statistics** - See upload/download stats and costs
- **Test All Features** - Run automated tests
- **Exit** - Close the CLI

### Standalone Scripts

#### Upload a Memory

```bash
node upload.js
```

#### Download a Memory

```bash
node download.js
```

## Memory Format

Memories follow the Cognee-compatible structure:

```json
{
  "memory_id": "unique-id",
  "user_id": "user-identifier",
  "memory_type": "document_chunk",
  "tags": ["tag1", "tag2"],
  "created_at": "2025-11-12T00:00:00.000Z",
  "title": "Memory Title",
  "chunks": [
    {
      "chunk_id": "chunk-1",
      "text": "Content here",
      "index": 0
    }
  ],
  "entities": [],
  "relationships": []
}
```

See `memory.example.json` for a complete example.

## File/Folder Upload

The CLI supports uploading any file or folder:

- **Files**: Uploaded as-is with metadata
- **Folders**: Automatically zipped before upload
- **Download**: Files saved directly, folders auto-extracted

Supported formats: Any file type, any size (chunked automatically)

## Architecture

### Storage
- **Blockchain**: Solana mainnet
- **Protocol**: IQLabs Pinocchio (permanent storage)
- **Index**: Local JSON file (fast search)

### Data Flow
1. Memory uploaded to Pinocchio (returns session address)
2. Session address indexed locally with metadata
3. Search queries use local index
4. Retrieval fetches from blockchain using session address

### Sync Mechanism
- Discovers all user's sessions on blockchain
- Downloads missing memories to local cache
- Enables multi-device synchronization

## Cost & Performance

### Typical Costs
- Small memory (1 KB): ~0.0001 SOL (~$0.02)
- Medium memory (10 KB): ~0.001 SOL (~$0.20)
- Large memory (100 KB): ~0.01 SOL (~$2.00)

### Performance
- Upload: 2-5 seconds per memory
- Download: 2-3 seconds per memory
- Search: Instant (local index)

## Requirements

- Node.js 16+
- Solana wallet with SOL
- RPC endpoint (Alchemy, Helius, or public)

## Configuration

The CLI uses `wallet.config.json` in the parent directory:

```json
{
  "rpcUrl": "https://your-rpc-endpoint",
  "privateKey": [/* wallet private key array */]
}
```

Or set via environment:
```bash
export SOLANA_RPC_URL="https://your-rpc-endpoint"
```

## Security

- Private keys stored locally only
- Never commit wallet files to git
- Use `.gitignore` to protect sensitive data
- On-chain data is public and immutable

## Testing

Run the built-in test suite:

```bash
node cli.js
# Select option 10: Test All Features
```

Tests include:
- Write/Read memory
- Search functionality
- Memory index integrity
- Wallet connection
- Data integrity verification

## Troubleshooting

### "Insufficient funds"
- Add more SOL to your wallet
- Each memory costs ~0.0001-0.01 SOL

### "Transaction failed"
- Check RPC endpoint is working
- Verify wallet has enough SOL
- Wait a few seconds and retry

### "Memory not found"
- Run sync to update local index
- Check memory ID is correct
- Verify session is finalized on-chain

### "0 memories" after sync
- Ensure wallet.config.json is in parent directory
- Check wallet has uploaded memories
- Verify RPC connection

## Examples

### Upload a Simple Memory

```javascript
{
  "memory_id": "my-first-memory",
  "user_id": "alice",
  "memory_type": "note",
  "tags": ["important"],
  "created_at": "2025-11-12T10:00:00.000Z",
  "title": "My First Memory",
  "chunks": [
    {
      "chunk_id": "c1",
      "text": "This is my first on-chain memory!",
      "index": 0
    }
  ],
  "entities": [],
  "relationships": []
}
```

### Search by Tag

```bash
# In CLI, select option 4: Search Memories
# Enter tag: important
```

### Batch Upload

```bash
# 1. Create a folder with multiple .json memory files
mkdir batch-memories
cp memory1.json memory2.json memory3.json batch-memories/

# 2. In CLI, select option 7: Batch Upload Memories
# 3. Enter folder path: batch-memories
```

## File Structure

```
github-ready/
├── cli.js                  # Interactive CLI
├── upload.js               # Standalone upload script
├── download.js             # Standalone download script
├── package.json            # Dependencies
├── wallet.example.json     # Example wallet format
├── memory.example.json     # Example memory format
├── README.md               # This file
├── QUICKSTART.md          # Quick start guide
├── INDEX.md               # File index
└── .gitignore             # Git ignore rules
```

## Contributing

This is a production-ready tool for storing Cognee memories on Solana blockchain. Feel free to:
- Report issues
- Suggest features
- Submit pull requests

## License

MIT

## Support

For issues or questions:
- Check QUICKSTART.md for common tasks
- Review INDEX.md for file reference
- Test with small data first

## Acknowledgments

Built with:
- Solana Web3.js
- IQLabs Pinocchio Protocol
- Cognee Memory Format

---

**Version**: 1.0.0
**Last Updated**: November 12, 2025

----

