# Visualization Module

Converts TypeGraph to React Flow format with layout positioning and visual styling.

## Purpose

Transform graph structure into React Flow visualization format with positioned nodes and styled edges.

## Core Function

### toReactFlow()

```typescript
toReactFlow(graph: TypeGraph): ReactFlowData
```

Returns positioned nodes and styled edges ready for React Flow rendering.

## Transformations

**Node conversion**
- Cleans type names (removes "Type" suffix for executive-friendly display)
- Preserves all metadata in data field for client-side filtering
- Applies layout algorithm to compute positions

**Edge conversion**
- Generates unique IDs (handles multiple edges between same nodes)
- Applies visual styles based on edge type
- Adds labels from field names or relationship type
- Animates FIELD edges to draw attention

## Edge Styling

**FIELD** - Solid blue, animated
- Primary relationships, most common

**IMPLEMENTS** - Dashed green
- Structural relationships

**UNION_MEMBER** - Dashed red
- Grouping relationships

## Layout Algorithms

**Simple Grid** (default)
- Fast, predictable grid arrangement
- No edge consideration
- Fixed spacing: 250px horizontal, 150px vertical

**Hierarchical** (alternative)
- BFS-based layer assignment
- Top-down from root
- Better for executive understanding

## Design Decisions

**Pre-computed layout**
- Computed during data processing, not client-side
- Consistent across renders
- No layout jank on initial display

**Unique edge IDs**
- Include index to handle multiple fields between same types
- Example: Query has both `device` and `devices` fields to DeviceType

**Metadata preservation**
- All node metadata kept in data field
- Enables client-side filtering without re-processing
- No data loss in transformation

**Animation only on FIELD edges**
- FIELD edges are primary relationships
- Too much animation is distracting
- IMPLEMENTS and UNION_MEMBER are structural, less dynamic

**Type name cleaning**
- CircuitTerminationType → CircuitTermination
- More natural for non-technical audience
- Preserves types actually named "Type"

## Usage

```typescript
import { toReactFlow } from './visualization/toReactFlow';

const reactFlowData = toReactFlow(graph);
// reactFlowData.nodes: ReactFlowNode[] with positions
// reactFlowData.edges: ReactFlowEdge[] with styles
```

See `src/tests/unit/toReactFlow.test.ts` for examples.
