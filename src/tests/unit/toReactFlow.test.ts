import { describe, it, expect } from 'vitest';
import { toReactFlow } from '../../visualization/toReactFlow';
import { extractGraph } from '../../graph/extractGraph';
import { EdgeType } from '../../graph/types';
import mockData from '../../data/mock_data.json';

describe('toReactFlow', () => {
  const graph = extractGraph(mockData);

  it('should convert TypeGraph to React Flow format', () => {
    const reactFlow = toReactFlow(graph);

    expect(reactFlow.nodes).toBeDefined();
    expect(reactFlow.edges).toBeDefined();
  });

  it('should have same number of nodes as graph', () => {
    const reactFlow = toReactFlow(graph);

    expect(reactFlow.nodes.length).toBe(graph.nodes.size);
  });

  it('should have same number of edges as graph', () => {
    const reactFlow = toReactFlow(graph);

    expect(reactFlow.edges.length).toBe(graph.edges.length);
  });

  it('should create nodes with correct structure', () => {
    const reactFlow = toReactFlow(graph);
    const node = reactFlow.nodes[0];

    expect(node).toHaveProperty('id');
    expect(node).toHaveProperty('type');
    expect(node).toHaveProperty('data');
    expect(node).toHaveProperty('position');
    expect(node.position).toHaveProperty('x');
    expect(node.position).toHaveProperty('y');
  });

  it('should create edges with correct structure', () => {
    const reactFlow = toReactFlow(graph);
    const edge = reactFlow.edges[0];

    expect(edge).toHaveProperty('id');
    expect(edge).toHaveProperty('source');
    expect(edge).toHaveProperty('target');
    expect(edge).toHaveProperty('type');
  });

  it('should clean type names by removing "Type" suffix', () => {
    const reactFlow = toReactFlow(graph);

    const circuitNode = reactFlow.nodes.find(
      (n) => n.id === 'CircuitTerminationType'
    );

    expect(circuitNode).toBeDefined();
    expect(circuitNode!.data.label).toBe('CircuitTermination');
  });

  it('should not remove "Type" from type names that are just "Type"', () => {
    const reactFlow = toReactFlow(graph);

    // If there's a type just called "Type", it should stay as "Type"
    const typeNode = reactFlow.nodes.find((n) => n.id === 'Type');
    if (typeNode) {
      expect(typeNode.data.label).toBe('Type');
    }
  });

  it('should preserve node metadata in data field', () => {
    const reactFlow = toReactFlow(graph);

    const queryNode = reactFlow.nodes.find((n) => n.id === 'Query');
    expect(queryNode).toBeDefined();
    expect(queryNode!.data.kind).toBe('OBJECT');
    expect(queryNode!.data.fields).toBeDefined();
  });

  it('should add labels to FIELD edges', () => {
    const reactFlow = toReactFlow(graph);

    const fieldEdges = reactFlow.edges.filter((e) => e.animated);
    expect(fieldEdges.length).toBeGreaterThan(0);

    const labeledEdges = fieldEdges.filter((e) => e.label);
    expect(labeledEdges.length).toBeGreaterThan(0);
  });

  it('should animate FIELD edges', () => {
    const reactFlow = toReactFlow(graph);

    const fieldEdge = reactFlow.edges.find(
      (e) => e.source === 'Query' && e.target === 'CableType'
    );

    expect(fieldEdge).toBeDefined();
    expect(fieldEdge!.animated).toBe(true);
  });

  it('should style edges based on edge type', () => {
    const reactFlow = toReactFlow(graph);

    const edge = reactFlow.edges[0];
    expect(edge.style).toBeDefined();
    expect(edge.style).toHaveProperty('stroke');
    expect(edge.style).toHaveProperty('strokeWidth');
  });

  it('should assign positions to all nodes', () => {
    const reactFlow = toReactFlow(graph);

    const nodesWithoutPosition = reactFlow.nodes.filter(
      (n) => n.position.x === undefined || n.position.y === undefined
    );

    expect(nodesWithoutPosition.length).toBe(0);
  });

  it('should create unique edge IDs', () => {
    const reactFlow = toReactFlow(graph);

    const edgeIds = reactFlow.edges.map((e) => e.id);
    const uniqueIds = new Set(edgeIds);

    expect(edgeIds.length).toBe(uniqueIds.size);
  });

  it('should preserve source and target in edges', () => {
    const reactFlow = toReactFlow(graph);

    graph.edges.forEach((graphEdge, index) => {
      const reactEdge = reactFlow.edges[index];
      expect(reactEdge.source).toBe(graphEdge.source);
      expect(reactEdge.target).toBe(graphEdge.target);
    });
  });

  it('should set smoothstep type for edges', () => {
    const reactFlow = toReactFlow(graph);

    const allSmoothstep = reactFlow.edges.every(
      (e) => e.type === 'smoothstep'
    );

    expect(allSmoothstep).toBe(true);
  });
});
