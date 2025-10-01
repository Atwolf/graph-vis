import { describe, it, expect } from 'vitest';
import { parseIntrospection, unwrapType } from '../../parser/parseIntrospection';
import mockData from '../../data/mock_data.json';

describe('parseIntrospection', () => {
  it('should parse Nautobot introspection data successfully', () => {
    const result = parseIntrospection(mockData);

    expect(result.types).toBeDefined();
    expect(result.types.length).toBeGreaterThan(0);
    expect(result.queryTypeName).toBe('Query');
  });

  it('should filter out introspection types starting with __', () => {
    const result = parseIntrospection(mockData);

    const hasIntrospectionTypes = result.types.some((type) =>
      type.name.startsWith('__')
    );
    expect(hasIntrospectionTypes).toBe(false);
  });

  it('should include CircuitTerminationType', () => {
    const result = parseIntrospection(mockData);

    const hasCircuitTermination = result.types.some(
      (type) => type.name === 'CircuitTerminationType'
    );
    expect(hasCircuitTermination).toBe(true);
  });

  it('should include CableType', () => {
    const result = parseIntrospection(mockData);

    const hasCable = result.types.some((type) => type.name === 'CableType');
    expect(hasCable).toBe(true);
  });

  it('should throw error for invalid introspection data', () => {
    const invalidData = { data: {} };

    expect(() => parseIntrospection(invalidData as any)).toThrow(
      'Invalid introspection data'
    );
  });
});

describe('unwrapType', () => {
  it('should unwrap NON_NULL types', () => {
    const typeRef = {
      kind: 'NON_NULL',
      name: null,
      ofType: {
        kind: 'SCALAR',
        name: 'String',
        ofType: null,
      },
    };

    expect(unwrapType(typeRef)).toBe('String');
  });

  it('should unwrap LIST types', () => {
    const typeRef = {
      kind: 'LIST',
      name: null,
      ofType: {
        kind: 'OBJECT',
        name: 'CircuitTerminationType',
        ofType: null,
      },
    };

    expect(unwrapType(typeRef)).toBe('CircuitTerminationType');
  });

  it('should unwrap nested LIST and NON_NULL types', () => {
    const typeRef = {
      kind: 'NON_NULL',
      name: null,
      ofType: {
        kind: 'LIST',
        name: null,
        ofType: {
          kind: 'NON_NULL',
          name: null,
          ofType: {
            kind: 'OBJECT',
            name: 'CableType',
            ofType: null,
          },
        },
      },
    };

    expect(unwrapType(typeRef)).toBe('CableType');
  });

  it('should return type name for non-wrapped types', () => {
    const typeRef = {
      kind: 'OBJECT',
      name: 'Query',
      ofType: null,
    };

    expect(unwrapType(typeRef)).toBe('Query');
  });

  it('should return null for null input', () => {
    expect(unwrapType(null)).toBe(null);
  });
});
