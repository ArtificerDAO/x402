#!/bin/bash

echo "========================================================================"
echo "           ON-CHAIN MEMORY CLI - INSTALLATION"
echo "========================================================================"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "ERROR: dist/ folder not found!"
    echo "This package requires the compiled SDK modules."
    echo "Please ensure the dist/ folder is present."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create folders
echo "Creating folders..."
mkdir -p wallet memories downloaded

echo ""
echo "========================================================================"
echo "                    INSTALLATION COMPLETE"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "  1. Add your wallet to wallet/ folder"
echo "  2. Run: node onchain-memory.js"
echo ""
echo "See README.txt for full documentation"
echo ""
