import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Controls as FlowControls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { CustomNode } from './CustomNode';
import { Controls } from './Controls';
import { SearchBar } from './SearchBar';
import { InfoPanel } from './InfoPanel';
import { useFilteredGraph } from '../hooks/useFilteredGraph';
import { useSearch } from '../hooks/useSearch';
import { CustomReactFlowNode, CustomReactFlowEdge, FilterState } from '../types/graph';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
  },
});

interface SchemaVisualizerProps {
  initialNodes: CustomReactFlowNode[];
  initialEdges: CustomReactFlowEdge[];
}

function SchemaVisualizerContent({ initialNodes, initialEdges }: SchemaVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [filters, setFilters] = useState<FilterState>({
    showFields: true,
    showImplements: true,
    showUnions: true,
    hideBuiltIns: true,
    hideRelay: true,
  });

  const [selectedNode, setSelectedNode] = useState<CustomReactFlowNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [controlsOpen, setControlsOpen] = useState(true);

  const filteredData = useFilteredGraph(nodes, edges, filters);
  const { highlightedNodes } = useSearch(filteredData.nodes, searchQuery);

  // Update nodes with highlight styling
  const styledNodes = useMemo(() => {
    return filteredData.nodes.map((node) => ({
      ...node,
      selected: highlightedNodes.has(node.id) || node.id === selectedNode?.id,
      style: {
        ...node.style,
        opacity: searchQuery && !highlightedNodes.has(node.id) ? 0.3 : 1,
      },
    }));
  }, [filteredData.nodes, highlightedNodes, searchQuery, selectedNode]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      default: CustomNode,
    }),
    []
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: CustomReactFlowNode) => {
      setSelectedNode(node);
    },
    []
  );

  const handleCloseInfo = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Calculate connection counts for selected node
  const connectionCounts = useMemo(() => {
    if (!selectedNode) return { incoming: 0, outgoing: 0 };

    const incoming = edges.filter((e) => e.target === selectedNode.id).length;
    const outgoing = edges.filter((e) => e.source === selectedNode.id).length;

    return { incoming, outgoing };
  }, [selectedNode, edges]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <Box
        sx={{
          ml: controlsOpen ? '280px' : 0,
          transition: 'margin 0.2s ease',
        }}
      >
        <SearchBar
          onSearch={setSearchQuery}
          onMenuClick={() => setControlsOpen(!controlsOpen)}
        />
      </Box>

      <Box sx={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Controls
          filters={filters}
          onChange={setFilters}
          open={controlsOpen}
          onClose={() => setControlsOpen(false)}
        />

        <Box
          sx={{
            flex: 1,
            ml: controlsOpen ? '280px' : 0,
            mr: selectedNode ? '360px' : 0,
            transition: 'margin 0.2s ease',
          }}
        >
          <ReactFlow
            nodes={styledNodes}
            edges={filteredData.edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={4}
          >
            <Background />
            <FlowControls />
            <MiniMap
              nodeColor={(node) => {
                const customNode = node as CustomReactFlowNode;
                return customNode.data.kind === 'OBJECT'
                  ? '#2563eb'
                  : customNode.data.kind === 'INTERFACE'
                  ? '#16a34a'
                  : '#6b7280';
              }}
            />
          </ReactFlow>
        </Box>

        <InfoPanel
          node={selectedNode}
          onClose={handleCloseInfo}
          incomingCount={connectionCounts.incoming}
          outgoingCount={connectionCounts.outgoing}
        />
      </Box>
    </Box>
  );
}

export function SchemaVisualizer(props: SchemaVisualizerProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReactFlowProvider>
        <SchemaVisualizerContent {...props} />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
