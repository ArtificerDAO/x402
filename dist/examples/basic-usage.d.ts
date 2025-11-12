/**
 * Basic Usage Example
 * Demonstrates core functionality of the on-chain memory SDK
 */
/**
 * Mock embedding function for testing
 * In production, use OpenAI, Cohere, or local models
 */
declare function mockEmbeddingFunction(text: string): Promise<number[]>;
/**
 * Example 1: Basic Setup and Initialization
 */
declare function example1_Setup(): Promise<any>;
/**
 * Example 2: Store Simple Memory
 */
declare function example2_StoreMemory(memorySystem: any): Promise<{
    signature1: any;
    signature2: any;
}>;
/**
 * Example 3: Store Knowledge Graph
 */
declare function example3_StoreKnowledgeGraph(memorySystem: any): Promise<any>;
/**
 * Example 4: Semantic Search
 */
declare function example4_SemanticSearch(memorySystem: any): Promise<any>;
/**
 * Example 5: Graph Queries
 */
declare function example5_GraphQueries(memorySystem: any): Promise<void>;
/**
 * Example 6: Batch Operations
 */
declare function example6_BatchOperations(memorySystem: any): Promise<void>;
/**
 * Example 7: System Monitoring
 */
declare function example7_Monitoring(memorySystem: any): Promise<void>;
export { example1_Setup, example2_StoreMemory, example3_StoreKnowledgeGraph, example4_SemanticSearch, example5_GraphQueries, example6_BatchOperations, example7_Monitoring, mockEmbeddingFunction };
//# sourceMappingURL=basic-usage.d.ts.map