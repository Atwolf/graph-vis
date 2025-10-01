import React, { useEffect, useState } from 'react';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { CustomReactFlowNode, CustomReactFlowEdge } from './types/graph';
import { extractGraph } from '../graph/extractGraph';
import { toReactFlow } from '../visualization/toReactFlow';
import mockData from '../data/mock_data.json';
import { Box, CircularProgress, Typography } from '@mui/material';

export function App() {
  const [data, setData] = useState<{
    nodes: CustomReactFlowNode[];
    edges: CustomReactFlowEdge[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Process the mock data through the pipeline
      const graph = extractGraph(mockData as any);
      const reactFlowData = toReactFlow(graph);

      setData({
        nodes: reactFlowData.nodes as CustomReactFlowNode[],
        edges: reactFlowData.edges as CustomReactFlowEdge[],
      });
    } catch (err) {
      console.error('Error processing schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to process schema');
    }
  }, []);

  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        flexDirection="column"
      >
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Schema
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return <SchemaVisualizer initialNodes={data.nodes} initialEdges={data.edges} />;
}
