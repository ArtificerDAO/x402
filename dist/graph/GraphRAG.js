"use strict";
/**
 * GraphRAG - Graph Retrieval Augmented Generation
 *
 * Leverages knowledge graph structures for contextually-aware information retrieval
 * Superior to traditional vector-based RAG by understanding relationships and ontologies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphRAGEngine = void 0;
/**
 * GraphRAG Engine
 * Provides contextually-aware retrieval using graph structure and ontology
 */
class GraphRAGEngine {
    constructor(ontology) {
        this.ontology = ontology || this.getDefaultOntology();
        this.memories = new Map();
        this.entityIndex = new Map();
        this.relationshipIndex = new Map();
    }
    /**
     * Define the default ontology for Cognee knowledge graphs
     */
    getDefaultOntology() {
        return {
            classes: [
                {
                    name: 'Entity',
                    description: 'Base class for all entities',
                    properties: ['name', 'type', 'description']
                },
                {
                    name: 'Concept',
                    description: 'Abstract concept or idea',
                    parentClass: 'Entity',
                    properties: ['domain', 'definition']
                },
                {
                    name: 'Person',
                    description: 'Human individual',
                    parentClass: 'Entity',
                    properties: ['role', 'organization']
                },
                {
                    name: 'Organization',
                    description: 'Company, institution, or group',
                    parentClass: 'Entity',
                    properties: ['industry', 'founded']
                },
                {
                    name: 'Technology',
                    description: 'Technical system or tool',
                    parentClass: 'Entity',
                    properties: ['category', 'purpose']
                },
                {
                    name: 'Document',
                    description: 'Text document or content',
                    properties: ['source', 'timestamp', 'author']
                }
            ],
            properties: [
                { name: 'name', type: 'string', required: true, description: 'Entity name' },
                { name: 'type', type: 'string', required: true, description: 'Entity type' },
                { name: 'description', type: 'string', required: false, description: 'Entity description' },
                { name: 'domain', type: 'string', required: false, description: 'Knowledge domain' },
                { name: 'timestamp', type: 'date', required: false, description: 'Creation timestamp' }
            ],
            relationships: [
                {
                    name: 'RELATES_TO',
                    sourceClass: 'Entity',
                    targetClass: 'Entity',
                    semantics: 'Generic relationship between entities',
                    bidirectional: true
                },
                {
                    name: 'PART_OF',
                    sourceClass: 'Entity',
                    targetClass: 'Entity',
                    semantics: 'Source is a component of target',
                    bidirectional: false
                },
                {
                    name: 'INSTANCE_OF',
                    sourceClass: 'Entity',
                    targetClass: 'Concept',
                    semantics: 'Source is an instance of target concept',
                    bidirectional: false
                },
                {
                    name: 'WORKS_FOR',
                    sourceClass: 'Person',
                    targetClass: 'Organization',
                    semantics: 'Person is employed by organization',
                    bidirectional: false
                },
                {
                    name: 'USES',
                    sourceClass: 'Entity',
                    targetClass: 'Technology',
                    semantics: 'Source entity uses target technology',
                    bidirectional: false
                }
            ]
        };
    }
    /**
     * Add a memory to the graph
     */
    addMemory(memory) {
        this.memories.set(memory.memory_id, memory);
        // Index entities
        if (memory.entities) {
            memory.entities.forEach((entity) => {
                this.entityIndex.set(entity.entity_id, entity);
            });
        }
        // Index relationships
        if (memory.relationships) {
            memory.relationships.forEach((rel) => {
                if (!this.relationshipIndex.has(rel.source_id)) {
                    this.relationshipIndex.set(rel.source_id, []);
                }
                this.relationshipIndex.get(rel.source_id).push(rel);
            });
        }
    }
    /**
     * Query the graph using GraphRAG
     */
    query(params) {
        const results = [];
        const contextDepth = params.contextDepth || 2;
        // Find relevant entities
        const relevantEntities = this.findRelevantEntities(params.query, params.filterByTypes);
        // For each relevant entity, build context by traversing the graph
        relevantEntities.forEach(entity => {
            const context = this.buildContext(entity, contextDepth);
            const relevanceScore = this.calculateRelevance(entity, params.query);
            results.push({
                entities: context.entities,
                relationships: context.relationships,
                chunks: context.chunks,
                context: this.generateContextString(context),
                relevanceScore,
                path: context.path
            });
        });
        // Sort by relevance
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    /**
     * Find entities relevant to the query
     */
    findRelevantEntities(query, filterByTypes) {
        const queryLower = query.toLowerCase();
        const relevant = [];
        this.entityIndex.forEach(entity => {
            // Check type filter
            if (filterByTypes && !filterByTypes.includes(entity.type)) {
                return;
            }
            // Check name match
            if (entity.name.toLowerCase().includes(queryLower)) {
                relevant.push(entity);
                return;
            }
            // Check description match
            if (entity.description && entity.description.toLowerCase().includes(queryLower)) {
                relevant.push(entity);
                return;
            }
            // Check metadata match
            if (entity.metadata) {
                const metadataStr = JSON.stringify(entity.metadata).toLowerCase();
                if (metadataStr.includes(queryLower)) {
                    relevant.push(entity);
                }
            }
        });
        return relevant;
    }
    /**
     * Build context by traversing the graph from an entity
     */
    buildContext(startEntity, depth) {
        const entities = [startEntity];
        const relationships = [];
        const chunks = [];
        const path = [startEntity.name];
        const visited = new Set([startEntity.entity_id]);
        // BFS traversal
        const queue = [
            { entityId: startEntity.entity_id, currentDepth: 0 }
        ];
        while (queue.length > 0) {
            const { entityId, currentDepth } = queue.shift();
            if (currentDepth >= depth) {
                continue;
            }
            // Get relationships from this entity
            const rels = this.relationshipIndex.get(entityId) || [];
            rels.forEach(rel => {
                if (!visited.has(rel.target_id)) {
                    visited.add(rel.target_id);
                    const targetEntity = this.entityIndex.get(rel.target_id);
                    if (targetEntity) {
                        entities.push(targetEntity);
                        relationships.push(rel);
                        path.push(rel.relationship_name);
                        path.push(targetEntity.name);
                        queue.push({
                            entityId: rel.target_id,
                            currentDepth: currentDepth + 1
                        });
                    }
                }
            });
        }
        // Get chunks from related memories
        const memoryIds = new Set(entities.map((e) => e.entity_id.split('-')[0])); // Approximate memory ID
        memoryIds.forEach(memId => {
            const memory = this.memories.get(memId);
            if (memory && memory.chunks) {
                chunks.push(...memory.chunks);
            }
        });
        return { entities, relationships, chunks, path };
    }
    /**
     * Calculate relevance score
     */
    calculateRelevance(entity, query) {
        const queryLower = query.toLowerCase();
        let score = 0;
        // Exact name match
        if (entity.name.toLowerCase() === queryLower) {
            score += 1.0;
        }
        else if (entity.name.toLowerCase().includes(queryLower)) {
            score += 0.7;
        }
        // Description match
        if (entity.description && entity.description.toLowerCase().includes(queryLower)) {
            score += 0.5;
        }
        // Type match
        if (entity.type.toLowerCase() === queryLower) {
            score += 0.3;
        }
        // Metadata match
        if (entity.metadata) {
            const metadataStr = JSON.stringify(entity.metadata).toLowerCase();
            if (metadataStr.includes(queryLower)) {
                score += 0.2;
            }
        }
        return score;
    }
    /**
     * Generate human-readable context string
     */
    generateContextString(context) {
        const parts = [];
        // Add entity context
        parts.push(`Entities: ${context.entities.map(e => e.name).join(', ')}`);
        // Add relationship context
        if (context.relationships.length > 0) {
            parts.push(`Relationships: ${context.relationships.map(r => r.relationship_name).join(', ')}`);
        }
        // Add chunk context (first few chunks)
        if (context.chunks.length > 0) {
            const chunkTexts = context.chunks.slice(0, 3).map(c => c.text.substring(0, 100) + '...');
            parts.push(`Context: ${chunkTexts.join(' ')}`);
        }
        // Add path
        parts.push(`Path: ${context.path.join(' → ')}`);
        return parts.join('\n');
    }
    /**
     * Get ontology information
     */
    getOntology() {
        return this.ontology;
    }
    /**
     * Validate entity against ontology
     */
    validateEntity(entity) {
        const errors = [];
        // Check if type exists in ontology
        const ontologyClass = this.ontology.classes.find(c => c.name === entity.type);
        if (!ontologyClass) {
            errors.push(`Entity type '${entity.type}' not defined in ontology`);
        }
        // Validate required properties
        const requiredProps = this.ontology.properties.filter(p => p.required);
        requiredProps.forEach(prop => {
            if (!entity.metadata || !(prop.name in entity.metadata)) {
                errors.push(`Required property '${prop.name}' missing`);
            }
        });
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get statistics about the graph
     */
    getStatistics() {
        return {
            totalMemories: this.memories.size,
            totalEntities: this.entityIndex.size,
            totalRelationships: Array.from(this.relationshipIndex.values()).reduce((sum, rels) => sum + rels.length, 0),
            ontologyClasses: this.ontology.classes.length,
            ontologyRelationshipTypes: this.ontology.relationships.length
        };
    }
}
exports.GraphRAGEngine = GraphRAGEngine;
//# sourceMappingURL=GraphRAG.js.map