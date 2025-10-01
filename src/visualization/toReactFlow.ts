/**
 * React Flow converter - converts TypeGraph to React Flow format
 */

import type { TypeGraph } from '../graph/types';
import { EdgeType } from '../graph/types';
import type { ReactFlowData, ReactFlowNode, ReactFlowEdge } from './types';
import { layoutNodes } from './layout';

/**
 * Convert TypeGraph to React Flow format
 *
 * @param graph - Type graph with nodes and edges
 * @returns React Flow nodes and edges
 */
export function toReactFlow(graph: TypeGraph): ReactFlowData {
  // Convert nodes
  const reactFlowNodes: ReactFlowNode[] = Array.from(
    graph.nodes.values()
  ).map((typeNode) => ({
    id: typeNode.name,
    type: 'default',
    data: {
      label: cleanTypeName(typeNode.name),
      kind: typeNode.kind,
      fields: typeNode.fields,
      isRelay: typeNode.isRelay,
      isBuiltIn: typeNode.isBuiltIn,
      description: typeNode.description,
    },
    position: { x: 0, y: 0 }, // Will be updated by layout
  }));

  // Convert edges
  const reactFlowEdges: ReactFlowEdge[] = graph.edges.map(
    (edge, index) => ({
      id: `e-${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      label: getEdgeLabel(edge),
      animated: edge.edgeType === EdgeType.FIELD,
      style: getEdgeStyle(edge.edgeType),
    })
  );

  // Apply layout algorithm
  const nodesWithLayout = layoutNodes(reactFlowNodes, reactFlowEdges);

  return {
    nodes: nodesWithLayout,
    edges: reactFlowEdges,
  };
}

/**
 * Clean type name for display (remove "Type" suffix)
 *
 * @param name - Original type name
 * @returns Cleaned name
 */
function cleanTypeName(name: string): string {
  if (name.endsWith('Type') && name !== 'Type') {
    return name.slice(0, -4);
  }
  return name;
}

/**
 * Get edge label based on edge type and field name
 *
 * @param edge - Edge from type graph
 * @returns Label for display
 */
function getEdgeLabel(edge: any): string | undefined {
  if (edge.edgeType === EdgeType.FIELD && edge.fieldName) {
    return edge.fieldName;
  }
  if (edge.edgeType === EdgeType.IMPLEMENTS) {
    return 'implements';
  }
  if (edge.edgeType === EdgeType.UNION_MEMBER) {
    return 'member';
  }
  return undefined;
}

/**
 * Get edge styling based on edge type
 *
 * @param edgeType - Type of edge
 * @returns Style object
 */
function getEdgeStyle(edgeType: EdgeType): Record<string, any> {
  switch (edgeType) {
    case EdgeType.FIELD:
      return { stroke: '#2563eb', strokeWidth: 2 };
    case EdgeType.IMPLEMENTS:
      return { stroke: '#16a34a', strokeWidth: 2, strokeDasharray: '5,5' };
    case EdgeType.UNION_MEMBER:
      return { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '3,3' };
    default:
      return { stroke: '#64748b', strokeWidth: 1 };
  }
}
