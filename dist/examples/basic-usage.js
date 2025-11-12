"use strict";
/**
 * Basic Usage Example
 * Demonstrates core functionality of the on-chain memory SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.example1_Setup = example1_Setup;
exports.example2_StoreMemory = example2_StoreMemory;
exports.example3_StoreKnowledgeGraph = example3_StoreKnowledgeGraph;
exports.example4_SemanticSearch = example4_SemanticSearch;
exports.example5_GraphQueries = example5_GraphQueries;
exports.example6_BatchOperations = example6_BatchOperations;
exports.example7_Monitoring = example7_Monitoring;
exports.mockEmbeddingFunction = mockEmbeddingFunction;
const index_1 = require("../index");
const web3_js_1 = require("@solana/web3.js");
/**
 * Mock embedding function for testing
 * In production, use OpenAI, Cohere, or local models
 */
async function mockEmbeddingFunction(text) {
    // Simple hash-based mock embedding (3072 dimensions like OpenAI)
    const vector = new Array(3072).fill(0);
    // Use text characters to generate pseudo-random but deterministic values
    for (let i = 0; i < text.length && i < 3072; i++) {
        vector[i] = (text.charCodeAt(i) % 256) / 128 - 1; // Normalize to [-1, 1]
    }
    // Fill remaining with pseudo-random based on text hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash = hash & hash;
    }
    for (let i = text.length; i < 3072; i++) {
        hash = (hash * 1664525 + 1013904223) & 0xffffffff;
        vector[i] = (hash / 0xffffffff) * 2 - 1;
    }
    return vector;
}
/**
 * Example 1: Basic Setup and Initialization
 */
async function example1_Setup() {
    console.log('\n=== Example 1: Setup and Initialization ===\n');
    try {
        // Load IQDB IDL (you need to provide the actual IDL file)
        const idl = require('../../public/idl/iq_database.json');
        // Create or load wallet
        const keypair = web3_js_1.Keypair.generate();
        console.log('Generated wallet:', keypair.publicKey.toBase58());
        // Configure SDK
        const config = {
            rpcUrl: 'https://api.devnet.solana.com',
            programId: '7Vk5JJDxUBAaaAkpYQpWYCZNz4SVPm3mJFSxrBzTQuAX',
            idl,
            wallet: {
                publicKey: keypair.publicKey,
                signTransaction: async (tx) => {
                    tx.partialSign(keypair);
                    return tx;
                },
                signAllTransactions: async (txs) => {
                    txs.forEach(tx => tx.partialSign(keypair));
                    return txs;
                }
            }
        };
        // Create memory system
        const memorySystem = await (0, index_1.createMemorySystem)(config);
        console.log('✓ Memory system initialized');
        // Create tables (only needed once per wallet)
        // Uncomment to create tables:
        // await memorySystem.setupTables();
        // console.log('✓ Tables created');
        return memorySystem;
    }
    catch (error) {
        console.error('Setup failed:', error);
        throw error;
    }
}
/**
 * Example 2: Store Simple Memory
 */
async function example2_StoreMemory(memorySystem) {
    console.log('\n=== Example 2: Store Simple Memory ===\n');
    try {
        const agentId = 'agent-demo-001';
        // Store episodic memory
        const episodicMemory = {
            event: 'User asked about weather',
            context: 'Conversation about weekend plans',
            location: 'San Francisco',
            timestamp: Date.now(),
            confidence: 0.95
        };
        console.log('Storing episodic memory...');
        const signature1 = await memorySystem.storeMemory(agentId, 'episodic', episodicMemory);
        console.log('✓ Stored episodic memory:', signature1);
        // Store semantic memory
        const semanticMemory = {
            concept: 'Weather patterns',
            facts: [
                'San Francisco has mild weather year-round',
                'Average temperature is 60-70°F',
                'Fog is common in summer months'
            ],
            confidence: 0.88
        };
        console.log('Storing semantic memory...');
        const signature2 = await memorySystem.storeMemory(agentId, 'semantic', semanticMemory);
        console.log('✓ Stored semantic memory:', signature2);
        return { signature1, signature2 };
    }
    catch (error) {
        console.error('Store memory failed:', error);
        throw error;
    }
}
/**
 * Example 3: Store Knowledge Graph
 */
async function example3_StoreKnowledgeGraph(memorySystem) {
    console.log('\n=== Example 3: Store Knowledge Graph ===\n');
    try {
        // Get embeddings for nodes
        const aliceEmbedding = await mockEmbeddingFunction('Alice is a software engineer at TechCorp specializing in AI and machine learning');
        const bobEmbedding = await mockEmbeddingFunction('Bob is a product manager at TechCorp focused on AI products');
        const techCorpEmbedding = await mockEmbeddingFunction('TechCorp is a technology company specializing in artificial intelligence solutions');
        // Define nodes
        const nodes = [
            {
                nodeId: 'person-alice',
                name: 'Alice',
                type: 'Person',
                description: 'Software engineer at TechCorp specializing in AI and machine learning',
                properties: {
                    age: 30,
                    location: 'San Francisco',
                    skills: ['Python', 'Machine Learning', 'AI'],
                    experience_years: 8
                },
                vector: aliceEmbedding
            },
            {
                nodeId: 'person-bob',
                name: 'Bob',
                type: 'Person',
                description: 'Product manager at TechCorp focused on AI products',
                properties: {
                    age: 35,
                    location: 'San Francisco',
                    skills: ['Product Management', 'AI Strategy'],
                    experience_years: 10
                },
                vector: bobEmbedding
            },
            {
                nodeId: 'company-techcorp',
                name: 'TechCorp',
                type: 'Company',
                description: 'Technology company specializing in artificial intelligence solutions',
                properties: {
                    founded: 2010,
                    size: 500,
                    industry: 'AI/ML',
                    location: 'San Francisco'
                },
                vector: techCorpEmbedding
            }
        ];
        // Define edges
        const edges = [
            {
                sourceNodeId: 'person-alice',
                targetNodeId: 'company-techcorp',
                relationshipName: 'works_at',
                properties: {
                    since: 2020,
                    role: 'Senior Engineer',
                    department: 'AI Research'
                },
                weight: 1.0
            },
            {
                sourceNodeId: 'person-bob',
                targetNodeId: 'company-techcorp',
                relationshipName: 'works_at',
                properties: {
                    since: 2018,
                    role: 'Product Manager',
                    department: 'AI Products'
                },
                weight: 1.0
            },
            {
                sourceNodeId: 'person-alice',
                targetNodeId: 'person-bob',
                relationshipName: 'colleague_of',
                properties: {
                    interaction_frequency: 'daily',
                    collaboration_projects: 3
                },
                weight: 0.8
            }
        ];
        console.log('Storing knowledge graph...');
        console.log(`- ${nodes.length} nodes`);
        console.log(`- ${edges.length} edges`);
        const result = await memorySystem.storeKnowledgeGraph(nodes, edges);
        console.log('✓ Knowledge graph stored');
        console.log(`  - Node IDs: ${result.nodeIds.length} stored`);
        console.log(`  - Edge IDs: ${result.edgeIds.length} stored`);
        return result;
    }
    catch (error) {
        console.error('Store knowledge graph failed:', error);
        throw error;
    }
}
/**
 * Example 4: Semantic Search
 */
async function example4_SemanticSearch(memorySystem) {
    console.log('\n=== Example 4: Semantic Search ===\n');
    try {
        // First, load knowledge base (in production, this would load from blockchain)
        console.log('Note: In production, you would load the knowledge base first');
        console.log('await memorySystem.loadKnowledgeBase();');
        // Search query
        const query = 'Tell me about software engineers working on AI';
        console.log(`Query: "${query}"`);
        // Perform search
        console.log('Performing semantic search...');
        const results = await memorySystem.searchByText(query, mockEmbeddingFunction, 5, // top 5 results
        0.7 // similarity threshold
        );
        console.log(`✓ Found ${results.length} results`);
        results.forEach((result, index) => {
            console.log(`\n  Result ${index + 1}:`);
            console.log(`  - Node: ${result.node.name}`);
            console.log(`  - Type: ${result.node.type}`);
            console.log(`  - Score: ${result.score.toFixed(4)}`);
            console.log(`  - Context nodes: ${result.context.nodes.length}`);
            console.log(`  - Context edges: ${result.context.edges.length}`);
        });
        return results;
    }
    catch (error) {
        console.error('Semantic search failed:', error);
        // Expected to fail without loaded knowledge base
        console.log('(Expected error - knowledge base not loaded in this demo)');
    }
}
/**
 * Example 5: Graph Queries
 */
async function example5_GraphQueries(memorySystem) {
    console.log('\n=== Example 5: Graph Queries ===\n');
    try {
        // Query relationships
        console.log('Querying relationships...');
        const related = await memorySystem.queryByRelationship('person-alice', 'works_at', 2 // max depth
        );
        console.log(`✓ Found ${related.length} related nodes`);
        related.forEach((node) => {
            console.log(`  - ${node.name} (${node.type})`);
        });
        // Get subgraph
        console.log('\nGetting subgraph around Alice...');
        const subgraph = memorySystem.getSubgraph('person-alice', 1);
        console.log(`✓ Subgraph: ${subgraph.nodes.length} nodes, ${subgraph.edges.length} edges`);
        // Find path
        console.log('\nFinding path between Alice and TechCorp...');
        const path = memorySystem.findPath('person-alice', 'company-techcorp');
        if (path) {
            console.log(`✓ Path found: ${path.join(' → ')}`);
        }
        else {
            console.log('✗ No path found');
        }
        // Graph statistics
        console.log('\nGraph statistics:');
        const stats = memorySystem.getGraphStats();
        console.log(`  - Nodes: ${stats.nodeCount}`);
        console.log(`  - Edges: ${stats.edgeCount}`);
        console.log(`  - Avg degree: ${stats.avgDegree}`);
        console.log(`  - Max degree: ${stats.maxDegree}`);
        console.log(`  - Components: ${stats.componentCount}`);
    }
    catch (error) {
        console.error('Graph queries failed:', error);
        // Expected to fail without loaded knowledge base
        console.log('(Expected error - knowledge base not loaded in this demo)');
    }
}
/**
 * Example 6: Batch Operations
 */
async function example6_BatchOperations(memorySystem) {
    console.log('\n=== Example 6: Batch Operations ===\n');
    try {
        const adapters = memorySystem.getAdapters();
        const graphStorage = adapters.graphStorage;
        // Create multiple nodes
        const batchNodes = [
            {
                nodeId: 'tech-ai',
                name: 'Artificial Intelligence',
                type: 'Technology',
                description: 'AI and machine learning technologies'
            },
            {
                nodeId: 'tech-ml',
                name: 'Machine Learning',
                type: 'Technology',
                description: 'Machine learning algorithms and models'
            },
            {
                nodeId: 'tech-nlp',
                name: 'Natural Language Processing',
                type: 'Technology',
                description: 'NLP and language understanding'
            }
        ];
        console.log(`Storing ${batchNodes.length} nodes in batch...`);
        const nodeIds = await graphStorage.batchStoreNodes(batchNodes);
        console.log(`✓ Stored ${nodeIds.length} nodes`);
        // Create multiple edges
        const batchEdges = [
            {
                sourceNodeId: 'tech-ml',
                targetNodeId: 'tech-ai',
                relationshipName: 'subset_of'
            },
            {
                sourceNodeId: 'tech-nlp',
                targetNodeId: 'tech-ai',
                relationshipName: 'subset_of'
            }
        ];
        console.log(`Storing ${batchEdges.length} edges in batch...`);
        const edgeIds = await graphStorage.batchStoreEdges(batchEdges);
        console.log(`✓ Stored ${edgeIds.length} edges`);
    }
    catch (error) {
        console.error('Batch operations failed:', error);
        throw error;
    }
}
/**
 * Example 7: System Monitoring
 */
async function example7_Monitoring(memorySystem) {
    console.log('\n=== Example 7: System Monitoring ===\n');
    try {
        // Vector cache statistics
        const vectorStats = memorySystem.getVectorStats();
        console.log('Vector cache:');
        console.log(`  - Vectors loaded: ${vectorStats.vectorCount}`);
        console.log(`  - Memory usage: ${vectorStats.totalMemoryMB.toFixed(2)} MB`);
        // Graph statistics
        const graphStats = memorySystem.getGraphStats();
        console.log('\nGraph:');
        console.log(`  - Nodes: ${graphStats.nodeCount}`);
        console.log(`  - Edges: ${graphStats.edgeCount}`);
        console.log(`  - Avg degree: ${graphStats.avgDegree}`);
        // Clear caches
        console.log('\nClearing caches...');
        memorySystem.clearCaches();
        console.log('✓ Caches cleared');
    }
    catch (error) {
        console.error('Monitoring failed:', error);
    }
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  On-Chain Memory SDK - Usage Examples                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    try {
        // Example 1: Setup
        const memorySystem = await example1_Setup();
        // Example 2: Store memories
        await example2_StoreMemory(memorySystem);
        // Example 3: Store knowledge graph
        await example3_StoreKnowledgeGraph(memorySystem);
        // Example 4: Semantic search (will show expected error)
        await example4_SemanticSearch(memorySystem);
        // Example 5: Graph queries (will show expected error)
        await example5_GraphQueries(memorySystem);
        // Example 6: Batch operations
        await example6_BatchOperations(memorySystem);
        // Example 7: Monitoring
        await example7_Monitoring(memorySystem);
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║  Examples completed successfully!                      ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
    }
    catch (error) {
        console.error('\n❌ Example execution failed:', error);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=basic-usage.js.map