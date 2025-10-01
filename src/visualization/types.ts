/**
 * React Flow visualization types
 */

export interface ReactFlowNode {
  id: string;
  type: string;
  data: {
    label: string;
    kind: string;
    fields?: Array<{ name: string; typeName: string }>;
    isRelay?: boolean;
    isBuiltIn?: boolean;
    description?: string;
  };
  position: { x: number; y: number };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface ReactFlowData {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}
