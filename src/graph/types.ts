/**
 * Graph structure types
 */

import type { TypeNode } from '../nodes/types';

export enum EdgeType {
  FIELD = 'FIELD',
  IMPLEMENTS = 'IMPLEMENTS',
  UNION_MEMBER = 'UNION_MEMBER',
}

export interface Edge {
  source: string;
  target: string;
  edgeType: EdgeType;
  fieldName?: string;
}

export interface TypeGraph {
  nodes: Map<string, TypeNode>;
  edges: Edge[];
  rootType: TypeNode;
}
