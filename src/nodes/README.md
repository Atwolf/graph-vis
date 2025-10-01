# Nodes Module

Creates TypeNode objects with pre-computed metadata flags. Core principle: compute once at creation, not repeatedly during traversal.

## Purpose

Transform raw introspection types into TypeNodes with metadata needed for filtering and visualization.

## Core Function

### createTypeNode()

```typescript
createTypeNode(typeData: IntrospectionType): TypeNode
```

Returns immutable TypeNode with all metadata computed at instantiation.

## Metadata Flags

**isRelay** - Identifies Relay pagination types (`Connection`, `Edge`, `PageInfo`)
- Purpose: Allow hiding pagination scaffolding from business view

**isBuiltIn** - Marks GraphQL primitives (`String`, `Int`, `Float`, `Boolean`, `ID`) and introspection types
- Purpose: Filter out technical primitives from executive view

**isComposite** - Determines if type can have relationships (`OBJECT`, `INTERFACE`, `UNION`)
- Purpose: Graph extraction only processes composite types for edges

## Design Decisions

**Compute-once strategy**
- All metadata calculated during node creation, not via helper functions called repeatedly
- Performance: avoids redundant computation during traversal/rendering
- Simplicity: all metadata immediately available

**Immutability**
- TypeNode never modified after creation
- No setters or mutation methods
- Downstream modules read but never modify

**Field simplification**
- Unwraps type references to simple names
- Removes args (not needed for visualization)
- Creates lightweight FieldInfo objects

## Usage

```typescript
import { createTypeNode } from './nodes/createTypeNode';

const node = createTypeNode(introspectionType);
// node.isRelay, node.isBuiltIn, node.isComposite pre-computed
```

See `src/tests/unit/createTypeNode.test.ts` for examples.
