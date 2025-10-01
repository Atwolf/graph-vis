/**
 * Type node factory - creates TypeNode with computed metadata
 */

import type { IntrospectionType } from '../parser/types';
import type { TypeNode, FieldInfo } from './types';
import { unwrapType } from '../parser/parseIntrospection';

const BUILT_IN_SCALARS = ['String', 'Int', 'Float', 'Boolean', 'ID'];

/**
 * Create a TypeNode from introspection data with all metadata computed at creation
 *
 * @param typeData - Raw introspection type data
 * @returns TypeNode with computed metadata
 */
export function createTypeNode(typeData: IntrospectionType): TypeNode {
  const { name, kind, description } = typeData;

  // Compute metadata flags once at creation
  const isRelay =
    name.endsWith('Connection') ||
    name.endsWith('Edge') ||
    name === 'PageInfo';

  const isBuiltIn =
    name.startsWith('__') || BUILT_IN_SCALARS.includes(name);

  const isComposite =
    kind === 'OBJECT' || kind === 'INTERFACE' || kind === 'UNION';

  // Extract field information
  const fields = extractFields(typeData);

  // Extract interface names
  const interfaces = typeData.interfaces?.map((iface) => unwrapType(iface)).filter((n): n is string => n !== null) || undefined;

  // Extract union member names
  const possibleTypes = typeData.possibleTypes?.map((type) => unwrapType(type)).filter((n): n is string => n !== null) || undefined;

  return {
    name,
    kind,
    isComposite,
    isRelay,
    isBuiltIn,
    fields,
    interfaces,
    possibleTypes,
    description,
  };
}

/**
 * Extract and simplify field information from introspection type
 *
 * @param typeData - Raw introspection type data
 * @returns Array of simplified field info
 */
function extractFields(typeData: IntrospectionType): FieldInfo[] | undefined {
  if (!typeData.fields || typeData.fields.length === 0) {
    return undefined;
  }

  return typeData.fields.map((field) => ({
    name: field.name,
    typeName: unwrapType(field.type) || 'Unknown',
    description: field.description,
  }));
}
