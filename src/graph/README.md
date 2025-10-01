# Graph Module

Builds complete type graph using breadth-first search from root Query type. Discovers all reachable types and their relationships.

## Purpose

Extract relationship graph from introspection data through BFS traversal, creating nodes and edges for visualization.

## Core Function

### extractGraph()

```typescript
extractGraph(introspectionData: { data: any }): TypeGraph
```

Returns TypeGraph with Map of nodes, array of edges, and root type.

## Edge Types

**FIELD** - Type has field of another type (most common, ~80-90%)
- Example: CircuitTermination has field "cable" of type Cable

**IMPLEMENTS** - Type implements interface (~5-10%)
- Example: Device implements Node interface

**UNION_MEMBER** - Union contains type (~5-10%)
- Example: SearchResult union contains Device type

## Algorithm

Breadth-first search starting from Query:
1. Create root node from Query type
2. For each type in queue:
   - Extract FIELD edges from fields
   - Extract IMPLEMENTS edges from interfaces
   - Extract UNION_MEMBER edges from union members
   - Queue undiscovered target types
3. Continue until queue empty

## Design Decisions

**Why BFS?**
- Natural for hierarchical layout (types at same depth on same layer)
- Better for executive understanding (top-down API flow)
- More intuitive visualization structure

**Why start at Query?**
- Only exposes types actually used in API
- Excludes orphaned/unused types
- Represents public API surface area

**Map for nodes, Array for edges**
- Map enables O(1) lookup during traversal
- Natural name → node mapping
- Array sufficient for edges (no lookup needed)

**Visited tracking**
- Prevents processing same type multiple times
- Handles cyclic schemas (Device → Cable → Device)
- Ensures each type processed exactly once

## Usage

```typescript
import { extractGraph } from './graph/extractGraph';
import { EdgeType } from './graph/types';

const graph = extractGraph(mockData);
// graph.nodes: Map<string, TypeNode>
// graph.edges: Edge[]
// graph.rootType: TypeNode
```

See `src/tests/unit/extractGraph.test.ts` for examples.
