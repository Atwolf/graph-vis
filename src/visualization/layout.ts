/**
 * Layout algorithms for positioning nodes
 */

import type { ReactFlowNode, ReactFlowEdge } from './types';

/**
 * Apply hierarchical layout to nodes
 * Simple layered layout starting from root
 *
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @returns Nodes with computed positions
 */
export function layoutNodes(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[]
): ReactFlowNode[] {
  // Simple grid layout as a starting point
  // More sophisticated algorithms can be added later
  return simpleGridLayout(nodes);
}

/**
 * Simple grid layout - arranges nodes in a grid
 *
 * @param nodes - Nodes to layout
 * @returns Nodes with positions
 */
function simpleGridLayout(nodes: ReactFlowNode[]): ReactFlowNode[] {
  const NODE_WIDTH = 250;
  const NODE_HEIGHT = 150;
  const COLS = Math.ceil(Math.sqrt(nodes.length));

  return nodes.map((node, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);

    return {
      ...node,
      position: {
        x: col * NODE_WIDTH,
        y: row * NODE_HEIGHT,
      },
    };
  });
}

/**
 * Hierarchical layout - arranges nodes in layers based on depth from root
 *
 * @param nodes - Nodes to layout
 * @param edges - Edges defining hierarchy
 * @param rootId - Root node ID
 * @returns Nodes with positions
 */
export function hierarchicalLayout(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  rootId: string
): ReactFlowNode[] {
  const NODE_WIDTH = 250;
  const NODE_HEIGHT = 150;
  const HORIZONTAL_SPACING = 50;
  const VERTICAL_SPACING = 100;

  // Build adjacency list
  const adjList = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, []);
    }
    adjList.get(edge.source)!.push(edge.target);
  });

  // BFS to assign layers
  const layers = new Map<number, string[]>();
  const nodeDepth = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [
    { id: rootId, depth: 0 },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    nodeDepth.set(id, depth);

    if (!layers.has(depth)) {
      layers.set(depth, []);
    }
    layers.get(depth)!.push(id);

    const children = adjList.get(id) || [];
    children.forEach((childId) => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    });
  }

  // Position nodes by layer
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const positionedNodes: ReactFlowNode[] = [];

  layers.forEach((nodeIds, depth) => {
    const y = depth * (NODE_HEIGHT + VERTICAL_SPACING);
    const layerWidth =
      nodeIds.length * NODE_WIDTH +
      (nodeIds.length - 1) * HORIZONTAL_SPACING;
    const startX = -layerWidth / 2;

    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        positionedNodes.push({
          ...node,
          position: {
            x: startX + index * (NODE_WIDTH + HORIZONTAL_SPACING),
            y,
          },
        });
      }
    });
  });

  // Add any unvisited nodes at the bottom
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      positionedNodes.push({
        ...node,
        position: {
          x: Math.random() * 500,
          y: (layers.size + 1) * (NODE_HEIGHT + VERTICAL_SPACING),
        },
      });
    }
  });

  return positionedNodes;
}
