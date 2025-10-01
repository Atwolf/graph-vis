import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

export interface ReactFlowData {
  nodes: CustomReactFlowNode[];
  edges: CustomReactFlowEdge[];
}

export interface CustomReactFlowNode extends ReactFlowNode {
  id: string;
  type: string;
  data: {
    label: string;
    kind: TypeKind;
    fields?: FieldInfo[];
    isRelay?: boolean;
    isBuiltIn?: boolean;
    description?: string;
  };
  position: { x: number; y: number };
}

export interface CustomReactFlowEdge extends ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
}

export interface FieldInfo {
  name: string;
  typeName: string;
}

export type TypeKind = 'OBJECT' | 'INTERFACE' | 'UNION' | 'SCALAR' | 'ENUM';

export interface FilterState {
  showFields: boolean;
  showImplements: boolean;
  showUnions: boolean;
  hideBuiltIns: boolean;
  hideRelay: boolean;
}
