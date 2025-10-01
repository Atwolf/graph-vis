import { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { CustomReactFlowNode } from '../types/graph';

export function useSearch(nodes: CustomReactFlowNode[], searchQuery: string) {
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const { fitView, setCenter } = useReactFlow();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedNodes(new Set());
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = nodes.filter((node) =>
      node.data.label.toLowerCase().includes(query)
    );

    const matchIds = new Set(matches.map((n) => n.id));
    setHighlightedNodes(matchIds);

    // Pan to first match
    if (matches.length > 0) {
      const firstMatch = matches[0];
      setCenter(firstMatch.position.x, firstMatch.position.y, {
        duration: 800,
        zoom: 1.5,
      });
    }
  }, [searchQuery, nodes, setCenter]);

  return {
    highlightedNodes,
    matchCount: highlightedNodes.size,
  };
}
