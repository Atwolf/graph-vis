/**
 * Lightweight parser for GraphQL introspection JSON
 * Parses introspection data directly without schema validation
 */

import type {
  IntrospectionResult,
  IntrospectionType,
  ParsedIntrospection,
} from './types';

/**
 * Parse GraphQL introspection JSON into structured data
 *
 * @param introspectionData - Raw introspection result from GraphQL endpoint
 * @returns Parsed types and query type name
 */
export function parseIntrospection(
  introspectionData: { data: IntrospectionResult }
): ParsedIntrospection {
  const schema = introspectionData.data.__schema;

  if (!schema || !schema.types) {
    throw new Error('Invalid introspection data: missing __schema.types');
  }

  // Filter out introspection types (starting with __)
  const types = schema.types.filter(
    (type) => !type.name.startsWith('__')
  );

  const queryTypeName = schema.queryType?.name || null;

  return {
    types,
    queryTypeName,
  };
}

/**
 * Get the base type name from a type reference, unwrapping LIST and NON_NULL
 *
 * @param typeRef - Type reference that may be wrapped
 * @returns Base type name
 */
export function unwrapType(typeRef: any): string | null {
  if (!typeRef) return null;

  // Unwrap LIST and NON_NULL wrappers
  if (typeRef.kind === 'LIST' || typeRef.kind === 'NON_NULL') {
    return unwrapType(typeRef.ofType);
  }

  return typeRef.name;
}
