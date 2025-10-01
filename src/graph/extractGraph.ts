/**
 * Graph extractor - builds complete type graph using BFS traversal
 */

import type { IntrospectionType } from '../parser/types';
import type { TypeNode } from '../nodes/types';
import type { TypeGraph, Edge } from './types';
import { EdgeType } from './types';
import { createTypeNode } from '../nodes/createTypeNode';
import { parseIntrospection } from '../parser/parseIntrospection';

/**
 * Extract complete type graph from introspection data using BFS traversal
 *
 * @param introspectionData - Raw introspection result
 * @returns Complete type graph with nodes and edges
 */
export function extractGraph(introspectionData: {
  data: any;
}): TypeGraph {
  const parsed = parseIntrospection(introspectionData);

  if (!parsed.queryTypeName) {
    throw new Error('No query type found in schema');
  }

  // Create a map of type name to introspection data for quick lookup
  const typeMap = new Map<string, IntrospectionType>();
  parsed.types.forEach((type) => {
    typeMap.set(type.name, type);
  });

  // Find root type (Query)
  const rootTypeData = typeMap.get(parsed.queryTypeName);
  if (!rootTypeData) {
    throw new Error(`Root type ${parsed.queryTypeName} not found`);
  }

  const nodes = new Map<string, TypeNode>();
  const edges: Edge[] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  // Start with root type
  const rootNode = createTypeNode(rootTypeData);
  nodes.set(rootNode.name, rootNode);
  visited.add(rootNode.name);
  queue.push(rootNode.name);

  // BFS traversal
  while (queue.length > 0) {
    const currentTypeName = queue.shift()!;
    const currentNode = nodes.get(currentTypeName)!;

    // Extract edges from fields
    if (currentNode.fields) {
      for (const field of currentNode.fields) {
        const targetTypeName = field.typeName;

        // Create edge
        edges.push({
          source: currentTypeName,
          target: targetTypeName,
          edgeType: EdgeType.FIELD,
          fieldName: field.name,
        });

        // Add target node if not visited
        if (!visited.has(targetTypeName)) {
          const targetTypeData = typeMap.get(targetTypeName);
          if (targetTypeData) {
            const targetNode = createTypeNode(targetTypeData);
            nodes.set(targetTypeName, targetNode);
            visited.add(targetTypeName);
            queue.push(targetTypeName);
          }
        }
      }
    }

    // Extract edges from interfaces
    if (currentNode.interfaces) {
      for (const interfaceName of currentNode.interfaces) {
        // Create edge
        edges.push({
          source: currentTypeName,
          target: interfaceName,
          edgeType: EdgeType.IMPLEMENTS,
        });

        // Add interface node if not visited
        if (!visited.has(interfaceName)) {
          const interfaceTypeData = typeMap.get(interfaceName);
          if (interfaceTypeData) {
            const interfaceNode = createTypeNode(interfaceTypeData);
            nodes.set(interfaceName, interfaceNode);
            visited.add(interfaceName);
            queue.push(interfaceName);
          }
        }
      }
    }

    // Extract edges from union members
    if (currentNode.possibleTypes) {
      for (const memberName of currentNode.possibleTypes) {
        // Create edge
        edges.push({
          source: currentTypeName,
          target: memberName,
          edgeType: EdgeType.UNION_MEMBER,
        });

        // Add member node if not visited
        if (!visited.has(memberName)) {
          const memberTypeData = typeMap.get(memberName);
          if (memberTypeData) {
            const memberNode = createTypeNode(memberTypeData);
            nodes.set(memberName, memberNode);
            visited.add(memberName);
            queue.push(memberName);
          }
        }
      }
    }
  }

  return {
    nodes,
    edges,
    rootType: rootNode,
  };
}
