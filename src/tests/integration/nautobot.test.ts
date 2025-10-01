import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import { fetchNautobotSchema, loadNautobotConfig } from '../../api/nautobotClient';
import { parseIntrospection } from '../../parser/parseIntrospection';
import { extractGraph } from '../../graph/extractGraph';
import { toReactFlow } from '../../visualization/toReactFlow';
import { EdgeType } from '../../graph/types';

// Load environment variables
dotenv.config();

describe('Nautobot Integration Tests', () => {
  let introspectionData: any;
  let skipTests = false;

  beforeAll(async () => {
    try {
      const config = loadNautobotConfig();
      introspectionData = await fetchNautobotSchema(config);
    } catch (error) {
      console.warn('Skipping Nautobot integration tests:', (error as Error).message);
      skipTests = true;
    }
  }, 30000); // 30 second timeout for API call

  it('should successfully fetch schema from Nautobot instance', () => {
    if (skipTests) return;

    expect(introspectionData).toBeDefined();
    expect(introspectionData.data).toBeDefined();
    expect(introspectionData.data.__schema).toBeDefined();
  });

  it('should parse Nautobot introspection data', () => {
    if (skipTests) return;

    const parsed = parseIntrospection(introspectionData);

    expect(parsed.types).toBeDefined();
    expect(parsed.types.length).toBeGreaterThan(0);
    expect(parsed.queryTypeName).toBe('Query');
  });

  it('should extract graph from live Nautobot data', () => {
    if (skipTests) return;

    const graph = extractGraph(introspectionData);

    expect(graph.nodes.size).toBeGreaterThan(10);
    expect(graph.edges.length).toBeGreaterThan(10);
    expect(graph.rootType.name).toBe('Query');
  });

  it('should find Nautobot-specific types', () => {
    if (skipTests) return;

    const graph = extractGraph(introspectionData);

    // Check for some common Nautobot types
    // Note: Exact types may vary by Nautobot version
    const parsed = parseIntrospection(introspectionData);
    const typeNames = parsed.types.map(t => t.name);

    // At least some of these should exist
    const nautobotTypes = [
      'CircuitTerminationType',
      'CableType',
      'DeviceType',
      'SiteType',
      'InterfaceType',
    ];

    const foundTypes = nautobotTypes.filter(name => typeNames.includes(name));
    expect(foundTypes.length).toBeGreaterThan(0);
  });

  it('should convert live data to React Flow format', () => {
    if (skipTests) return;

    const graph = extractGraph(introspectionData);
    const reactFlow = toReactFlow(graph);

    expect(reactFlow.nodes.length).toBe(graph.nodes.size);
    expect(reactFlow.edges.length).toBe(graph.edges.length);

    // Verify all nodes have positions
    const nodesWithoutPosition = reactFlow.nodes.filter(
      n => n.position.x === undefined || n.position.y === undefined
    );
    expect(nodesWithoutPosition.length).toBe(0);
  });

  it('should find Query type with field edges', () => {
    if (skipTests) return;

    const graph = extractGraph(introspectionData);

    // Query should have FIELD edges to other types
    const queryFieldEdges = graph.edges.filter(
      e => e.source === 'Query' && e.edgeType === EdgeType.FIELD
    );

    expect(queryFieldEdges.length).toBeGreaterThan(0);
  });

  it('should handle large schema efficiently', () => {
    if (skipTests) return;

    const startTime = Date.now();

    parseIntrospection(introspectionData);
    const graph = extractGraph(introspectionData);
    toReactFlow(graph);

    const duration = Date.now() - startTime;

    // Should process in less than 500ms
    expect(duration).toBeLessThan(500);
  });

  it('should preserve all node metadata in React Flow conversion', () => {
    if (skipTests) return;

    const graph = extractGraph(introspectionData);
    const reactFlow = toReactFlow(graph);

    // Check that metadata is preserved
    reactFlow.nodes.forEach(node => {
      expect(node.data.label).toBeDefined();
      expect(node.data.kind).toBeDefined();
    });
  });

  it('should apply correct edge styles', () => {
    if (skipTests) return;

    const graph = extractGraph(introspectionData);
    const reactFlow = toReactFlow(graph);

    // All edges should have style
    reactFlow.edges.forEach(edge => {
      expect(edge.style).toBeDefined();
      expect(edge.style?.stroke).toBeDefined();
      expect(edge.style?.strokeWidth).toBeDefined();
    });
  });

  it('should filter out introspection types', () => {
    if (skipTests) return;

    const graph = extractGraph(introspectionData);

    // No node names should start with __
    const introspectionTypes = Array.from(graph.nodes.keys()).filter(
      name => name.startsWith('__')
    );

    expect(introspectionTypes.length).toBe(0);
  });
});
