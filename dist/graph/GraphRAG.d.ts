/**
 * GraphRAG - Graph Retrieval Augmented Generation
 *
 * Leverages knowledge graph structures for contextually-aware information retrieval
 * Superior to traditional vector-based RAG by understanding relationships and ontologies
 */
import { CogneeMemory, DocumentChunk, Entity, Relationship } from '../adapters/CogneeMemoryAdapter';
export type KnowledgeGraphEntity = Entity;
export type KnowledgeGraphRelationship = Relationship;
export interface OntologyDefinition {
    classes: OntologyClass[];
    properties: OntologyProperty[];
    relationships: OntologyRelationshipType[];
}
export interface OntologyClass {
    name: string;
    description: string;
    parentClass?: string;
    properties: string[];
}
export interface OntologyProperty {
    name: string;
    type: 'string' | 'number' | 'date' | 'entity' | 'concept';
    required: boolean;
    description: string;
}
export interface OntologyRelationshipType {
    name: string;
    sourceClass: string;
    targetClass: string;
    semantics: string;
    bidirectional: boolean;
}
export interface GraphRAGQuery {
    query: string;
    contextDepth?: number;
    includeRelationships?: boolean;
    filterByTypes?: string[];
    userId?: string;
}
export interface GraphRAGResult {
    entities: KnowledgeGraphEntity[];
    relationships: KnowledgeGraphRelationship[];
    chunks: DocumentChunk[];
    context: string;
    relevanceScore: number;
    path: string[];
}
/**
 * GraphRAG Engine
 * Provides contextually-aware retrieval using graph structure and ontology
 */
export declare class GraphRAGEngine {
    private ontology;
    private memories;
    private entityIndex;
    private relationshipIndex;
    constructor(ontology?: OntologyDefinition);
    /**
     * Define the default ontology for Cognee knowledge graphs
     */
    private getDefaultOntology;
    /**
     * Add a memory to the graph
     */
    addMemory(memory: CogneeMemory): void;
    /**
     * Query the graph using GraphRAG
     */
    query(params: GraphRAGQuery): GraphRAGResult[];
    /**
     * Find entities relevant to the query
     */
    private findRelevantEntities;
    /**
     * Build context by traversing the graph from an entity
     */
    private buildContext;
    /**
     * Calculate relevance score
     */
    private calculateRelevance;
    /**
     * Generate human-readable context string
     */
    private generateContextString;
    /**
     * Get ontology information
     */
    getOntology(): OntologyDefinition;
    /**
     * Validate entity against ontology
     */
    validateEntity(entity: KnowledgeGraphEntity): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get statistics about the graph
     */
    getStatistics(): {
        totalMemories: number;
        totalEntities: number;
        totalRelationships: number;
        ontologyClasses: number;
        ontologyRelationshipTypes: number;
    };
}
//# sourceMappingURL=GraphRAG.d.ts.map