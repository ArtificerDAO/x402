================================================================================
                    ON-CHAIN MEMORY CLI - STANDALONE
================================================================================

Version: 1.0.0
Release: November 12, 2025

WHAT IS THIS?

A single-file CLI tool for storing and retrieving Cognee-compatible memories
on Solana blockchain using IQLabs Pinocchio protocol.

================================================================================
                         QUICK START
================================================================================

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

================================================================================
                         LICENSE
================================================================================

MIT License

Copyright (c) 2025 On-Chain Memory CLI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

================================================================================

Ready to store memories on-chain!

================================================================================

