"use strict";
/**
 * IQLabs API Client
 *
 * Client for interacting with IQLabs' Pinocchio and Hybrid V2 APIs
 * for storing large data on Solana blockchain.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IQLabsAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const web3_js_1 = require("@solana/web3.js");
class IQLabsAPI {
    constructor(connection, baseUrl = 'https://api.iqlabs.dev') {
        this.connection = connection;
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 second timeout
        });
    }
    /**
     * Create a BUNDLE session (event-based, NO accounts created!)
     * This should cost ONLY 5k lamports per tx - NO RENT!
     * RECOMMENDED for Cognee memories!
     */
    async createBundleSession(params) {
        try {
            console.log(' Creating BUNDLE session (event-based, NO accounts)...');
            console.log(`   Data size: ${params.text?.length || 0} bytes`);
            console.log(`   Chunk size: ${params.chunkSize || 800}`);
            // Use /api/v2/inscribe/bundle endpoint
            const response = await this.client.post('/api/v2/inscribe/bundle', {
                pubkey: params.pubkey,
                text: params.text,
                chunks: params.chunks,
                chunkSize: params.chunkSize || 800,
                method: params.method || 0,
                decodeBreak: 0
            });
            const data = response.data;
            console.log(` Bundle session created: ${data.sessionId}`);
            console.log(`   Total chunks: ${data.totalChunks}`);
            console.log(`   Upload type: ${data.uploadType} (should be "event_bundle")`);
            return data;
        }
        catch (error) {
            console.error(' Failed to create Bundle session:', error.message);
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Failed to create Bundle session: ${error.message}`);
        }
    }
    /**
     * Create a Hybrid V2 upload session (WORKING but creates accounts!)
     * WARNING: Creates session PDA (1.5M lamports rent per upload)
     * Use createBundleSession() instead for Cognee!
     */
    async createHybridV2Session(params) {
        try {
            console.log(' Creating Hybrid V2 session...');
            console.log(`     WARNING: This creates accounts (1.5M lamports rent!)`);
            console.log(`   Data size: ${params.text?.length || 0} bytes`);
            console.log(`   Chunk size: ${params.chunkSize || 800}`);
            // Use the WORKING /api/v2/inscribe/text endpoint
            const response = await this.client.post('/api/v2/inscribe/text', {
                pubkey: params.pubkey,
                text: params.text,
                chunks: params.chunks,
                chunkSize: params.chunkSize || 800
            });
            const data = response.data;
            console.log(` Session created: ${data.sessionId}`);
            console.log(`   Total chunks: ${data.totalChunks}`);
            console.log(`   Upload type: ${data.uploadType}`);
            return data;
        }
        catch (error) {
            console.error(' Failed to create Hybrid V2 session:', error.message);
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Failed to create Hybrid V2 session: ${error.message}`);
        }
    }
    /**
     * Create a Pinocchio upload session (RECOMMENDED - MOST UP-TO-DATE!)
     * IQ Team: "Use the pinocchio routes. They are the most up to date"
     *
     * This endpoint:
     * - Chunks data into 675-byte pieces (optimal per IQ team)
     * - Converts each chunk to base64 for transmission
     * - Costs exactly 5k lamports per transaction
     * - Works on mainnet with proper download support
     */
    async createPinocchioSession(params) {
        try {
            console.log(' Creating Pinocchio session (most up-to-date endpoint)...');
            console.log(`   Data size: ${params.text?.length || 0} bytes`);
            console.log(`   Chunk size: ${params.chunkSize || 675}`);
            const response = await this.client.post('/api/v2/inscribe/pinocchio', {
                pubkey: params.pubkey,
                text: params.text,
                chunks: params.chunks,
                chunkSize: params.chunkSize || 675,
                method: params.method || 0
            });
            const data = response.data;
            console.log(` Session created: ${data.sessionId}`);
            console.log(`   Total chunks: ${data.totalChunks}`);
            return data;
        }
        catch (error) {
            console.error(' Failed to create Pinocchio session:', error.message);
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Failed to create Pinocchio session: ${error.message}`);
        }
    }
    /**
     * Create a hybrid V2 upload session (alternative to Pinocchio)
     */
    async createHybridSession(params) {
        try {
            console.log(' Creating Hybrid V2 session...');
            console.log(`   Data size: ${params.text?.length || 0} bytes`);
            const response = await this.client.post('/api/v2/inscribe/hybrid', {
                ...params,
                chunkSize: params.chunkSize || 800,
                method: params.method || 0
            });
            const data = response.data;
            console.log(` Session created: ${data.sessionId}`);
            console.log(`   Total chunks: ${data.totalChunks}`);
            return data;
        }
        catch (error) {
            console.error(' Failed to create hybrid session:', error.message);
            throw new Error(`Failed to create hybrid session: ${error.message}`);
        }
    }
    /**
     * Download and reconstruct data from a Pinocchio session
     */
    async downloadSession(sessionPubkey) {
        try {
            console.log(` Downloading session data: ${sessionPubkey}`);
            const response = await this.client.get(`/api/v2/inscribe/download/${sessionPubkey}`, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            console.log(` Downloaded ${buffer.length} bytes`);
            return buffer;
        }
        catch (error) {
            console.error(' Failed to download session:', error.message);
            throw new Error(`Failed to download session: ${error.message}`);
        }
    }
    /**
     * Check if user's storage account exists
     * This helps avoid unnecessary initStorageTransaction calls
     */
    async checkStorageAccountStatus(pubkey) {
        try {
            console.log(` Checking storage account status for ${pubkey.substring(0, 8)}...`);
            const response = await this.client.get(`/api/v1/users/${pubkey}/data-account/status`);
            const exists = response.data?.exists || false;
            console.log(`   ${exists ? '' : ''} Storage account ${exists ? 'exists' : 'does not exist'}`);
            return exists;
        }
        catch (error) {
            console.log('   ℹ  Could not check status, assuming does not exist');
            return false;
        }
    }
    /**
     * Get session metadata
     */
    async getSessionMetadata(sessionPubkey) {
        try {
            console.log(` Getting session metadata: ${sessionPubkey}...`);
            const response = await this.client.get(`/api/v2/inscribe/session/${sessionPubkey}`);
            console.log(` Status: ${response.data.status}`);
            console.log(`   Total chunks: ${response.data.totalChunks}`);
            return response.data;
        }
        catch (error) {
            console.error(' Failed to get session metadata:', error.message);
            throw new Error(`Failed to get session metadata: ${error.message}`);
        }
    }
    /**
     * Peek at file type without downloading full data
     */
    async peekSession(sessionPubkey) {
        try {
            const response = await this.client.get(`/api/v2/inscribe/peek/${sessionPubkey}`);
            return response.data;
        }
        catch (error) {
            console.error(' Failed to peek session:', error.message);
            throw new Error(`Failed to peek session: ${error.message}`);
        }
    }
    /**
     * Sign and send a transaction via IQLabs broadcast API
     * This handles compute units and TPU optimization automatically
     */
    async signAndSendTransaction(transactionData, wallet, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                let tx;
                // Check if input is a transaction object or base64 string
                if (typeof transactionData === 'string') {
                    // Base64 encoded transaction
                    const txBuffer = Buffer.from(transactionData, 'base64');
                    tx = web3_js_1.Transaction.from(txBuffer);
                }
                else if (transactionData.transaction && transactionData.transaction.instructions) {
                    // Bundle endpoint format: {transaction: {instructions: [...], feePayer: "..."}}
                    const txData = transactionData.transaction;
                    tx = new web3_js_1.Transaction();
                    // Add instructions from bundle API response
                    for (const instr of txData.instructions) {
                        const { Connection: SolanaConnection, PublicKey: SolanaPublicKey, TransactionInstruction } = require('@solana/web3.js');
                        tx.add(new TransactionInstruction({
                            keys: (instr.keys || []).map((k) => ({
                                pubkey: new SolanaPublicKey(k.pubkey),
                                isSigner: k.isSigner,
                                isWritable: k.isWritable
                            })),
                            programId: new SolanaPublicKey(instr.programId),
                            data: Buffer.from(instr.data)
                        }));
                    }
                }
                else if (transactionData.instructions) {
                    // Transaction object from API (Hybrid V2 format)
                    // NOTE: API already includes optimal compute budget in the transaction
                    // DO NOT add extra compute budget - it wastes fees!
                    tx = new web3_js_1.Transaction();
                    // Add instructions from API response
                    for (const instr of transactionData.instructions) {
                        const { Connection: SolanaConnection, PublicKey: SolanaPublicKey, TransactionInstruction } = require('@solana/web3.js');
                        tx.add(new TransactionInstruction({
                            keys: instr.keys.map((k) => ({
                                pubkey: new SolanaPublicKey(k.pubkey),
                                isSigner: k.isSigner,
                                isWritable: k.isWritable
                            })),
                            programId: new SolanaPublicKey(instr.programId),
                            data: Buffer.from(instr.data)
                        }));
                    }
                }
                else {
                    throw new Error('Invalid transaction format');
                }
                // Get recent blockhash
                // Use 'confirmed' commitment per Helius best practices
                const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
                // Set transaction details
                tx.recentBlockhash = blockhash;
                tx.feePayer = wallet.publicKey;
                // Sign
                tx.sign(wallet);
                let signature;
                try {
                    // Per Helius best practices: Simulate first, then send with skipPreflight: true
                    // This catches errors early while avoiding redundant simulation on send
                    const simulation = await this.connection.simulateTransaction(tx);
                    if (simulation.value.err) {
                        throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
                    }
                    // Send with skipPreflight: true (already simulated) + maxRetries for reliability
                    signature = await this.connection.sendRawTransaction(tx.serialize(), {
                        skipPreflight: true, // Skip redundant check (already simulated)
                        maxRetries: 3 // Let web3.js retry automatically for reliability
                    });
                }
                catch (sendError) {
                    // Log the actual error for debugging
                    console.error(`    Transaction failed: ${sendError.message}`);
                    if (sendError.logs) {
                        console.error(`   Logs: ${sendError.logs.join('\n')}`);
                    }
                    throw sendError;
                }
                if (!signature) {
                    throw new Error('No signature returned from broadcast');
                }
                console.log(`    Sent: ${signature.substring(0, 8)}... (waiting for confirmation...)`);
                // Use getSignatureStatuses (plural) - more reliable than singular version
                // This is the CORRECT method per Solana docs  
                // Check status up to 30 times with 500ms intervals = max 15 seconds
                // (With skipPreflight: true, txs confirm in 1-2 seconds normally)
                let confirmed = false;
                for (let i = 0; i < 30; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // getSignatureStatuses accepts an array and returns batch results
                    const statuses = await this.connection.getSignatureStatuses([signature]);
                    const status = statuses.value[0];
                    // status can be null if transaction hasn't been processed yet
                    if (status === null) {
                        if ((i + 1) % 10 === 0) {
                            console.log(`    Transaction not processed yet... ${(i + 1) * 0.5}s`);
                        }
                        continue;
                    }
                    // Check for errors
                    if (status.err) {
                        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
                    }
                    // Check confirmation status
                    if (status.confirmationStatus === 'confirmed' ||
                        status.confirmationStatus === 'finalized') {
                        confirmed = true;
                        break;
                    }
                    // Log progress every 5 seconds
                    if ((i + 1) % 10 === 0) {
                        console.log(`    Status: ${status.confirmationStatus || 'pending'}... ${(i + 1) * 0.5}s`);
                    }
                }
                if (!confirmed) {
                    throw new Error(`Transaction not confirmed after 15 seconds: ${signature}`);
                }
                return signature;
            }
            catch (error) {
                const errorMsg = error.response?.data?.detail || error.message;
                console.warn(` Attempt ${attempt}/${retries} failed:`, errorMsg);
                if (attempt === retries) {
                    throw new Error(`Failed to send transaction after ${retries} attempts: ${errorMsg}`);
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        throw new Error('Transaction sending failed');
    }
    /**
     * Sign and send a transaction WITHOUT waiting for confirmation (fast!)
     * Uses provided blockhash to avoid rate limits
     */
    async signAndSendTransactionNoConfirm(transactionData, wallet, blockhash) {
        let tx;
        // Parse transaction (same as signAndSendTransaction)
        if (typeof transactionData === 'string') {
            const txBuffer = Buffer.from(transactionData, 'base64');
            tx = web3_js_1.Transaction.from(txBuffer);
        }
        else if (transactionData.transaction && transactionData.transaction.instructions) {
            const txData = transactionData.transaction;
            tx = new web3_js_1.Transaction();
            for (const instr of txData.instructions) {
                const { PublicKey: SolanaPublicKey, TransactionInstruction } = require('@solana/web3.js');
                tx.add(new TransactionInstruction({
                    keys: (instr.keys || []).map((k) => ({
                        pubkey: new SolanaPublicKey(k.pubkey),
                        isSigner: k.isSigner,
                        isWritable: k.isWritable
                    })),
                    programId: new SolanaPublicKey(instr.programId),
                    data: Buffer.from(instr.data)
                }));
            }
        }
        else if (transactionData.instructions) {
            tx = new web3_js_1.Transaction();
            for (const instr of transactionData.instructions) {
                const { PublicKey: SolanaPublicKey, TransactionInstruction } = require('@solana/web3.js');
                tx.add(new TransactionInstruction({
                    keys: instr.keys.map((k) => ({
                        pubkey: new SolanaPublicKey(k.pubkey),
                        isSigner: k.isSigner,
                        isWritable: k.isWritable
                    })),
                    programId: new SolanaPublicKey(instr.programId),
                    data: Buffer.from(instr.data)
                }));
            }
        }
        else {
            throw new Error('Invalid transaction format');
        }
        // Use provided blockhash (reused for entire batch - avoids rate limits!)
        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet.publicKey;
        tx.sign(wallet);
        const signature = await this.connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: true, // Skip redundant check
            maxRetries: 3 // Let web3.js retry for reliability
        });
        return signature;
    }
    /**
     * Confirm multiple signatures in batch (MUCH faster than individual)
     */
    async confirmSignaturesBatch(signatures, maxWaitSeconds = 30) {
        const maxAttempts = (maxWaitSeconds * 1000) / 500; // 500ms per check
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            // Check ALL signatures at once! (much more efficient)
            const statuses = await this.connection.getSignatureStatuses(signatures);
            let allConfirmed = true;
            let failedSig = null;
            for (let j = 0; j < signatures.length; j++) {
                const status = statuses.value[j];
                if (status === null) {
                    allConfirmed = false;
                    continue;
                }
                if (status.err) {
                    failedSig = signatures[j];
                    throw new Error(`Transaction ${j + 1} failed: ${JSON.stringify(status.err)}`);
                }
                if (status.confirmationStatus !== 'confirmed' &&
                    status.confirmationStatus !== 'finalized') {
                    allConfirmed = false;
                }
            }
            if (allConfirmed) {
                return; // All confirmed!
            }
            // Log progress every 5 seconds
            if ((i + 1) % 10 === 0) {
                const confirmed = statuses.value.filter(s => s?.confirmationStatus === 'confirmed' || s?.confirmationStatus === 'finalized').length;
                console.log(`    Confirming... ${confirmed}/${signatures.length} done (${(i + 1) * 0.5}s)`);
            }
        }
        throw new Error(`Batch not fully confirmed after ${maxWaitSeconds} seconds`);
    }
    /**
     * Sign and send multiple transactions with smart retry logic:
     * 1. Send all transactions
     * 2. Check which ones confirmed
     * 3. Retry only the failed ones
     */
    async signAndSendTransactionsParallel(transactions, wallet, batchSize = 5 // Send in small batches to avoid rate limits
    ) {
        const total = transactions.length;
        console.log(` Sending ${total} transactions with smart retry...`);
        // STEP 1: Send all transactions (in small batches to avoid rate limits)
        console.log(`\n Step 1: Sending all ${total} transactions...`);
        const allSignatures = [];
        // Get ONE blockhash for all transactions
        // Use 'confirmed' commitment per Helius best practices
        const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
        console.log(`   Using blockhash: ${blockhash.substring(0, 8)}...`);
        for (let i = 0; i < total; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(total / batchSize);
            console.log(`   Batch ${batchNum}/${totalBatches}: Sending ${batch.length} txs...`);
            try {
                // Send transactions with small delays to prevent race conditions
                const batchSigs = [];
                for (const tx of batch) {
                    const sig = await this.signAndSendTransactionNoConfirm(tx, wallet, blockhash);
                    batchSigs.push(sig);
                    // Small delay (100ms) between each send to maintain order
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                allSignatures.push(...batchSigs);
                console.log(`    Sent ${batchSigs.length} transactions`);
                // Small delay between send batches to avoid rate limits
                if (i + batchSize < total) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                console.error(`     Some transactions in batch ${batchNum} failed to send: ${error.message}`);
                // Continue anyway - we'll check status later
            }
        }
        console.log(`\n All ${allSignatures.length} transactions sent!`);
        // STEP 2: Check which ones confirmed
        console.log(`\n Step 2: Checking confirmation status...`);
        const checkResult = await this.checkConfirmationStatus(allSignatures, 30);
        console.log(`    Confirmed: ${checkResult.confirmed.length}/${allSignatures.length}`);
        console.log(`    Failed/Pending: ${checkResult.failed.length}`);
        // STEP 3: Retry failed ones (max 2 retries)
        let finalSignatures = [...checkResult.confirmed];
        let toRetry = checkResult.failed;
        for (let attempt = 1; attempt <= 2 && toRetry.length > 0; attempt++) {
            console.log(`\n🔄 Step 3.${attempt}: Retrying ${toRetry.length} failed transactions...`);
            const retrySignatures = [];
            const retryTxs = toRetry.map(idx => transactions[idx]);
            // Get fresh blockhash for retry
            const { blockhash: retryBlockhash } = await this.connection.getLatestBlockhash('confirmed');
            for (const tx of retryTxs) {
                try {
                    const sig = await this.signAndSendTransactionNoConfirm(tx, wallet, retryBlockhash);
                    retrySignatures.push(sig);
                }
                catch (error) {
                    console.error(`     Retry failed: ${error.message}`);
                }
            }
            console.log(`   Checking ${retrySignatures.length} retried transactions...`);
            const retryResult = await this.checkConfirmationStatus(retrySignatures, 20);
            console.log(`    Retry confirmed: ${retryResult.confirmed.length}/${retrySignatures.length}`);
            finalSignatures.push(...retryResult.confirmed);
            toRetry = retryResult.failed;
        }
        if (toRetry.length > 0) {
            throw new Error(`${toRetry.length} transactions failed after retries`);
        }
        console.log(`\n All ${total} transactions confirmed!`);
        return finalSignatures;
    }
    /**
     * Check confirmation status and return confirmed vs failed indices
     */
    async checkConfirmationStatus(signatures, maxWaitSeconds) {
        const maxAttempts = (maxWaitSeconds * 1000) / 1000; // Check every 1 second
        const confirmed = new Set();
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const statuses = await this.connection.getSignatureStatuses(signatures);
            for (let j = 0; j < signatures.length; j++) {
                if (confirmed.has(j))
                    continue; // Already confirmed
                const status = statuses.value[j];
                if (status === null)
                    continue; // Not processed yet
                if (status.err) {
                    console.error(`    Transaction ${j + 1} failed: ${JSON.stringify(status.err)}`);
                    continue;
                }
                if (status.confirmationStatus === 'confirmed' ||
                    status.confirmationStatus === 'finalized') {
                    confirmed.add(j);
                }
            }
            // Log progress every 5 seconds
            if ((i + 1) % 5 === 0 || confirmed.size === signatures.length) {
                console.log(`    Status: ${confirmed.size}/${signatures.length} confirmed (${i + 1}s)`);
            }
            if (confirmed.size === signatures.length) {
                break; // All confirmed!
            }
        }
        const failed = [];
        const confirmedSigs = [];
        for (let i = 0; i < signatures.length; i++) {
            if (confirmed.has(i)) {
                confirmedSigs.push(signatures[i]);
            }
            else {
                failed.push(i);
            }
        }
        return { confirmed: confirmedSigs, failed };
    }
    /**
     * Sign and send transactions sequentially with optimized confirmation
     * - Send all transactions one-by-one with 100ms delays
     * - Wait 5 seconds, then confirm all at once
     * - Much faster than old sequential mode!
     */
    async signAndSendTransactionsSequential(transactions, wallet) {
        const signatures = [];
        const total = transactions.length;
        console.log(` Fast Sequential: Sending ${total} transactions with 100ms delays...`);
        // Get ONE blockhash for all transactions
        const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
        console.log(`   Using blockhash: ${blockhash.substring(0, 8)}...`);
        // STEP 1: Send all transactions one-by-one with small delays
        for (let i = 0; i < total; i++) {
            console.log(`   Sending ${i + 1}/${total}...`);
            try {
                const signature = await this.signAndSendTransactionNoConfirm(transactions[i], wallet, blockhash);
                signatures.push(signature);
                console.log(`    Sent: ${signature.substring(0, 8)}...`);
                // 100ms delay between sends (maintains order)
                if (i < total - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                console.error(`    Send ${i + 1} failed:`, error.message);
                throw error;
            }
        }
        console.log(`\n All ${total} transactions sent!`);
        // STEP 2: Wait 5 seconds for them to process
        console.log(` Waiting 5 seconds for confirmations...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        // STEP 3: Check confirmations
        console.log(` Checking confirmation status...`);
        const checkResult = await this.checkConfirmationStatus(signatures, 15);
        console.log(`    Confirmed: ${checkResult.confirmed.length}/${total}`);
        if (checkResult.failed.length > 0) {
            console.log(`     Failed: ${checkResult.failed.length} transactions`);
            // Retry failed ones
            console.log(`\n🔄 Retrying ${checkResult.failed.length} failed transactions...`);
            const { blockhash: retryBlockhash } = await this.connection.getLatestBlockhash('confirmed');
            for (const idx of checkResult.failed) {
                try {
                    const sig = await this.signAndSendTransactionNoConfirm(transactions[idx], wallet, retryBlockhash);
                    signatures[idx] = sig;
                    console.log(`    Retry ${idx + 1} sent: ${sig.substring(0, 8)}...`);
                }
                catch (error) {
                    console.error(`    Retry ${idx + 1} failed:`, error.message);
                    throw error;
                }
            }
            // Wait and check again
            await new Promise(resolve => setTimeout(resolve, 5000));
            const retryCheck = await this.checkConfirmationStatus(signatures, 15);
            if (retryCheck.failed.length > 0) {
                throw new Error(`${retryCheck.failed.length} transactions failed after retry`);
            }
        }
        console.log(` All ${total} transactions confirmed!`);
        return signatures;
    }
    /**
     * IQDB Methods - Key-Value Store for Indexing
     *
     * IQDB is IQLabs' on-chain key-value database
     * Perfect for storing memory indexes/metadata
     */
    /**
     * Set a value in IQDB
     */
    async setIQDBValue(key, value, wallet) {
        console.log(` Setting IQDB key: ${key}`);
        try {
            const response = await this.client.post('/iqdb/set', {
                pubkey: wallet.publicKey.toBase58(),
                key,
                value
            });
            const transaction = response.data.transaction;
            const signature = await this.signAndSendTransaction(transaction, wallet);
            console.log(` IQDB value set: ${signature.substring(0, 8)}...`);
            return signature;
        }
        catch (error) {
            console.error(` Failed to set IQDB value:`, error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Get a value from IQDB
     */
    async getIQDBValue(key, wallet) {
        console.log(`📖 Getting IQDB key: ${key}`);
        try {
            const response = await this.client.get('/iqdb/get', {
                params: {
                    pubkey: wallet.publicKey.toBase58(),
                    key
                }
            });
            const value = response.data.value;
            console.log(` IQDB value retrieved`);
            return value;
        }
        catch (error) {
            if (error.response?.status === 404) {
                console.log(` Key not found`);
                return null;
            }
            console.error(` Failed to get IQDB value:`, error.response?.data || error.message);
            throw error;
        }
    }
    /**
     * Delete a value from IQDB
     */
    async deleteIQDBValue(key, wallet) {
        console.log(`🗑  Deleting IQDB key: ${key}`);
        try {
            const response = await this.client.post('/iqdb/delete', {
                pubkey: wallet.publicKey.toBase58(),
                key
            });
            const transaction = response.data.transaction;
            const signature = await this.signAndSendTransaction(transaction, wallet);
            console.log(` IQDB value deleted: ${signature.substring(0, 8)}...`);
            return signature;
        }
        catch (error) {
            console.error(` Failed to delete IQDB value:`, error.response?.data || error.message);
            throw error;
        }
    }
}
exports.IQLabsAPI = IQLabsAPI;
//# sourceMappingURL=IQLabsAPI.js.map