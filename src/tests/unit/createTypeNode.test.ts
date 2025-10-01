import { describe, it, expect } from 'vitest';
import { createTypeNode } from '../../nodes/createTypeNode';
import { parseIntrospection } from '../../parser/parseIntrospection';
import mockData from '../../data/mock_data.json';
import type { IntrospectionType } from '../../parser/types';

describe('createTypeNode', () => {
  const parsed = parseIntrospection(mockData);

  it('should create node with correct metadata for OBJECT type', () => {
    const circuitType = parsed.types.find(
      (t) => t.name === 'CircuitTerminationType'
    ) as IntrospectionType;

    const node = createTypeNode(circuitType);

    expect(node.name).toBe('CircuitTerminationType');
    expect(node.kind).toBe('OBJECT');
    expect(node.isComposite).toBe(true);
    expect(node.isRelay).toBe(false);
    expect(node.isBuiltIn).toBe(false);
  });

  it('should identify Relay connection types', () => {
    const connectionType: IntrospectionType = {
      kind: 'OBJECT',
      name: 'CircuitConnection',
      fields: [],
    };

    const node = createTypeNode(connectionType);

    expect(node.isRelay).toBe(true);
  });

  it('should identify Relay edge types', () => {
    const edgeType: IntrospectionType = {
      kind: 'OBJECT',
      name: 'CircuitEdge',
      fields: [],
    };

    const node = createTypeNode(edgeType);

    expect(node.isRelay).toBe(true);
  });

  it('should identify PageInfo as Relay type', () => {
    const pageInfoType: IntrospectionType = {
      kind: 'OBJECT',
      name: 'PageInfo',
      fields: [],
    };

    const node = createTypeNode(pageInfoType);

    expect(node.isRelay).toBe(true);
  });

  it('should identify built-in scalar types', () => {
    const stringType: IntrospectionType = {
      kind: 'SCALAR',
      name: 'String',
    };

    const node = createTypeNode(stringType);

    expect(node.isBuiltIn).toBe(true);
    expect(node.isComposite).toBe(false);
  });

  it('should mark INTERFACE as composite', () => {
    const interfaceType: IntrospectionType = {
      kind: 'INTERFACE',
      name: 'Node',
      fields: [
        {
          name: 'id',
          type: { kind: 'SCALAR', name: 'ID', ofType: null },
        },
      ],
    };

    const node = createTypeNode(interfaceType);

    expect(node.isComposite).toBe(true);
  });

  it('should mark UNION as composite', () => {
    const unionType: IntrospectionType = {
      kind: 'UNION',
      name: 'SearchResult',
      possibleTypes: [
        { kind: 'OBJECT', name: 'Device', ofType: null },
        { kind: 'OBJECT', name: 'Cable', ofType: null },
      ],
    };

    const node = createTypeNode(unionType);

    expect(node.isComposite).toBe(true);
  });

  it('should mark SCALAR as non-composite', () => {
    const scalarType: IntrospectionType = {
      kind: 'SCALAR',
      name: 'DateTime',
    };

    const node = createTypeNode(scalarType);

    expect(node.isComposite).toBe(false);
  });

  it('should extract field information correctly', () => {
    const cableType = parsed.types.find(
      (t) => t.name === 'CableType'
    ) as IntrospectionType;

    const node = createTypeNode(cableType);

    expect(node.fields).toBeDefined();
    expect(node.fields!.length).toBeGreaterThan(0);

    const idField = node.fields!.find((f) => f.name === 'id');
    expect(idField).toBeDefined();
    expect(idField!.typeName).toBe('UUID');
  });

  it('should handle types with no fields', () => {
    const scalarType: IntrospectionType = {
      kind: 'SCALAR',
      name: 'Int',
    };

    const node = createTypeNode(scalarType);

    expect(node.fields).toBeUndefined();
  });

  it('should extract interface names', () => {
    const typeWithInterface: IntrospectionType = {
      kind: 'OBJECT',
      name: 'Device',
      fields: [],
      interfaces: [{ kind: 'INTERFACE', name: 'Node', ofType: null }],
    };

    const node = createTypeNode(typeWithInterface);

    expect(node.interfaces).toBeDefined();
    expect(node.interfaces).toContain('Node');
  });

  it('should extract union member names', () => {
    const unionType: IntrospectionType = {
      kind: 'UNION',
      name: 'SearchResult',
      possibleTypes: [
        { kind: 'OBJECT', name: 'DeviceType', ofType: null },
        { kind: 'OBJECT', name: 'CableType', ofType: null },
      ],
    };

    const node = createTypeNode(unionType);

    expect(node.possibleTypes).toBeDefined();
    expect(node.possibleTypes).toContain('DeviceType');
    expect(node.possibleTypes).toContain('CableType');
  });

  it('should preserve description field', () => {
    const typeWithDescription: IntrospectionType = {
      kind: 'OBJECT',
      name: 'Device',
      description: 'Network device',
      fields: [],
    };

    const node = createTypeNode(typeWithDescription);

    expect(node.description).toBe('Network device');
  });
});
