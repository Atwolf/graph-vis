import { useMemo } from 'react';
import { CustomReactFlowNode, CustomReactFlowEdge, FilterState } from '../types/graph';

export function useFilteredGraph(
  nodes: CustomReactFlowNode[],
  edges: CustomReactFlowEdge[],
  filters: FilterState
) {
  return useMemo(() => {
    // Filter nodes based on hide settings
    const filteredNodes = nodes.filter((node) => {
      if (filters.hideBuiltIns && node.data.isBuiltIn) {
        return false;
      }
      if (filters.hideRelay && node.data.isRelay) {
        return false;
      }
      return true;
    });

    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Filter edges based on show settings and visible nodes
    const filteredEdges = edges.filter((edge) => {
      // Only show edges between visible nodes
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) {
        return false;
      }

      // Determine edge type based on style/properties
      const isFieldEdge = edge.animated === true;
      const isImplementsEdge = edge.style?.strokeDasharray === '5,5';
      const isUnionEdge = edge.style?.strokeDasharray === '3,3';

      if (isFieldEdge && !filters.showFields) {
        return false;
      }
      if (isImplementsEdge && !filters.showImplements) {
        return false;
      }
      if (isUnionEdge && !filters.showUnions) {
        return false;
      }

      return true;
    });

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [nodes, edges, filters]);
}
