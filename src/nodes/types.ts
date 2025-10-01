/**
 * Type node definitions for the graph structure
 */

import type { TypeKind } from '../parser/types';

export interface FieldInfo {
  name: string;
  typeName: string;
  description?: string;
}

export interface TypeNode {
  name: string;
  kind: TypeKind;
  isComposite: boolean;
  isRelay: boolean;
  isBuiltIn: boolean;
  fields?: FieldInfo[];
  interfaces?: string[];
  possibleTypes?: string[];
  description?: string;
}

export { TypeKind };
