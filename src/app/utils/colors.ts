import { TypeKind } from '../types/graph';

export const TYPE_KIND_COLORS: Record<TypeKind, string> = {
  OBJECT: '#2563eb',      // Blue
  INTERFACE: '#16a34a',   // Green
  UNION: '#ea580c',       // Orange
  SCALAR: '#6b7280',      // Gray
  ENUM: '#9333ea',        // Purple
};

export const EDGE_COLORS = {
  FIELD: '#2563eb',        // Blue
  IMPLEMENTS: '#16a34a',   // Green
  UNION_MEMBER: '#dc2626', // Red
};

export function getTypeColor(kind: TypeKind): string {
  return TYPE_KIND_COLORS[kind] || '#6b7280';
}
