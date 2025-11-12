#!/bin/bash

echo "========================================================================"
echo "           ON-CHAIN MEMORY CLI - INSTALLATION"
echo "========================================================================"
echo ""

if [ ! -d "dist" ]; then
    echo "ERROR: dist/ folder not found!"
    exit 1
fi

echo "Installing dependencies..."
npm install

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
