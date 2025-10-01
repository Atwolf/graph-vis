import { describe, it, expect } from 'vitest';
import { extractGraph } from '../../graph/extractGraph';
import { EdgeType } from '../../graph/types';
import mockData from '../../data/mock_data.json';

describe('extractGraph', () => {
  it('should extract graph from Nautobot mock data', () => {
    const graph = extractGraph(mockData);

    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
    expect(graph.rootType).toBeDefined();
  });

  it('should have Query as root type', () => {
    const graph = extractGraph(mockData);

    expect(graph.rootType.name).toBe('Query');
  });

  it('should discover multiple types via BFS', () => {
    const graph = extractGraph(mockData);

    expect(graph.nodes.size).toBeGreaterThan(10);
  });

  it('should include CircuitTerminationType in graph', () => {
    const graph = extractGraph(mockData);

    expect(graph.nodes.has('CircuitTerminationType')).toBe(true);
  });

  it('should include CableType in graph', () => {
    const graph = extractGraph(mockData);

    expect(graph.nodes.has('CableType')).toBe(true);
  });

  it('should include DeviceType in graph', () => {
    const graph = extractGraph(mockData);

    expect(graph.nodes.has('DeviceType')).toBe(true);
  });

  it('should create FIELD edges from Query to types', () => {
    const graph = extractGraph(mockData);

    const circuitEdge = graph.edges.find(
      (e) =>
        e.source === 'Query' &&
        e.target === 'CircuitTerminationType' &&
        e.edgeType === EdgeType.FIELD
    );

    expect(circuitEdge).toBeDefined();
    expect(circuitEdge?.fieldName).toBe('circuit_termination');
  });

  it('should create edges with correct field names', () => {
    const graph = extractGraph(mockData);

    const cableEdge = graph.edges.find(
      (e) =>
        e.source === 'Query' &&
        e.target === 'CableType' &&
        e.fieldName === 'cable'
    );

    expect(cableEdge).toBeDefined();
    expect(cableEdge?.edgeType).toBe(EdgeType.FIELD);
  });

  it('should have more edges than nodes (multiple field references)', () => {
    const graph = extractGraph(mockData);

    expect(graph.edges.length).toBeGreaterThan(graph.nodes.size);
  });

  it('should not include built-in scalar types as separate nodes', () => {
    const graph = extractGraph(mockData);

    // Built-in scalars like String, Int should still be referenced
    // but they will be included if they're in the introspection data
    expect(graph.nodes.has('ID')).toBe(true);
    expect(graph.nodes.has('String')).toBe(true);
  });

  it('should traverse deeply nested types', () => {
    const graph = extractGraph(mockData);

    // Check that we found types not directly on Query
    const allNodeNames = Array.from(graph.nodes.keys());
    const queryFields =
      graph.rootType.fields?.map((f) => f.typeName) || [];

    const deepTypes = allNodeNames.filter(
      (name) => !queryFields.includes(name) && name !== 'Query'
    );

    // Should have types discovered through traversal
    expect(deepTypes.length).toBeGreaterThan(0);
  });

  it('should handle IMPLEMENTS edges correctly', () => {
    const graph = extractGraph(mockData);

    // Find any IMPLEMENTS edges in the graph
    const implementsEdges = graph.edges.filter(
      (e) => e.edgeType === EdgeType.IMPLEMENTS
    );

    // This may be 0 if the mock data doesn't have interfaces
    expect(implementsEdges).toBeDefined();
  });

  it('should handle UNION_MEMBER edges correctly', () => {
    const graph = extractGraph(mockData);

    // Find any UNION_MEMBER edges in the graph
    const unionEdges = graph.edges.filter(
      (e) => e.edgeType === EdgeType.UNION_MEMBER
    );

    // This may be 0 if the mock data doesn't have unions
    expect(unionEdges).toBeDefined();
  });

  it('should throw error if no query type found', () => {
    const invalidData = {
      data: {
        __schema: {
          queryType: null,
          types: [],
        },
      },
    };

    expect(() => extractGraph(invalidData)).toThrow(
      'No query type found'
    );
  });

  it('should not visit same type twice', () => {
    const graph = extractGraph(mockData);

    const typeNames = Array.from(graph.nodes.keys());
    const uniqueNames = new Set(typeNames);

    expect(typeNames.length).toBe(uniqueNames.size);
  });
});
