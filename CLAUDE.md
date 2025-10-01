# Nautobot GraphQL Schema Visualizer

## Project Purpose

Create an **executive-friendly React Flow visualization** that shows how core components of Nautobot's data model connect together. This is NOT a technical schema validator - it's a high-level relationship diagram for non-technical stakeholders.

### Target Audience
- Tech executives who need to understand system architecture
- Business stakeholders evaluating Nautobot
- Technical leaders explaining data model to non-engineers

### What is Nautobot?
Nautobot is a network infrastructure management platform (similar to NetBox). It manages:
- Network devices and connections
- Circuits and cable paths
- Sites, racks, and physical infrastructure
- IP addressing and VLANs
- Configuration data

## Core Design Philosophy

### What We Do
- Parse GraphQL introspection JSON directly (no heavy validation)
- Extract type relationships from field references
- Create simple, clean data structures optimized for visualization
- Build interactive React Flow diagrams with toggleable relationships
- Focus on business-level understanding

### What We Don't Do
- Validate GraphQL schemas for execution
- Handle incomplete introspection data errors
- Create executable GraphQL schemas
- Show every technical detail

## Architecture Overview

The pipeline follows a linear transformation approach, where each stage produces a more refined data structure:

```
Raw Introspection JSON (from Nautobot API)
        ↓
  Lightweight Parser (parseIntrospection)
  Filters and simplifies type data
        ↓
  Type Node Factory (createTypeNode)
  Creates nodes with computed metadata
        ↓
  Graph Extractor (extractGraph)
  BFS traversal building complete type graph
        ↓
  React Flow Converter (toReactFlow)
  Transforms to visualization format
        ↓
  React Component (SchemaVisualizer)
  Interactive UI with filters and controls
```

## Data Structures

### Core Type Definitions

#### TypeNode (Node Representation)
```typescript
interface TypeNode {
  name: string;                // Type name (e.g., "CircuitTerminationType")
  kind: TypeKind;              // OBJECT, INTERFACE, UNION, SCALAR, ENUM
  isComposite: boolean;        // Can have outgoing edges (OBJECT/INTERFACE/UNION)
  isRelay: boolean;            // Relay pagination type (Connection/Edge/PageInfo)
  isBuiltIn: boolean;          // Built-in scalar or introspection type
  fields?: FieldInfo[];        // Fields for OBJECT/INTERFACE types
  interfaces?: string[];       // Interfaces this type implements
  possibleTypes?: string[];    // Union member types
  description?: string;        // Schema description text
}
```

**Metadata Flags (computed at creation):**
- `isComposite`: Determines if type can have relationships. True for OBJECT, INTERFACE, UNION.
- `isRelay`: Identifies Relay pagination types to optionally hide from executives.
- `isBuiltIn`: Marks GraphQL built-in types (String, Int, Float, Boolean, ID) and introspection types.

#### FieldInfo (Simplified Field Data)
```typescript
interface FieldInfo {
  name: string;        // Field name
  typeName: string;    // Target type name (unwrapped from LIST/NON_NULL)
  description?: string;
}
```

#### Edge (Relationship Between Types)
```typescript
interface Edge {
  source: string;       // Source type name
  target: string;       // Target type name
  edgeType: EdgeType;   // FIELD | IMPLEMENTS | UNION_MEMBER
  fieldName?: string;   // Field name (for FIELD edges only)
}
```

**Edge Types:**
- `FIELD`: Type A has a field of Type B (most common)
- `IMPLEMENTS`: Type A implements Interface B
- `UNION_MEMBER`: Union A contains Type B as member

#### TypeGraph (Complete Graph Structure)
```typescript
interface TypeGraph {
  nodes: Map<string, TypeNode>;  // All discovered types (O(1) lookup)
  edges: Edge[];                 // All relationships
  rootType: TypeNode;            // Entry point (usually Query type)
}
```

#### ReactFlowNode (Visualization Node)
```typescript
interface ReactFlowNode {
  id: string;                    // Type name
  type: string;                  // Node renderer type
  data: {
    label: string;               // Cleaned display name
    kind: string;                // Type kind
    fields?: FieldInfo[];
    isRelay?: boolean;
    isBuiltIn?: boolean;
    description?: string;
  };
  position: { x: number; y: number };  // Layout coordinates
}
```

#### ReactFlowEdge (Visualization Edge)
```typescript
interface ReactFlowEdge {
  id: string;                    // Unique edge identifier
  source: string;                // Source node ID
  target: string;                // Target node ID
  type?: string;                 // Edge renderer (smoothstep)
  label?: string;                // Display label
  animated?: boolean;            // Animation for FIELD edges
  style?: {
    stroke: string;              // Edge color
    strokeWidth: number;
    strokeDasharray?: string;    // Dash pattern for non-FIELD edges
  };
}
```

## Implementation Modules

### 1. Parser Module (`src/parser/`)

**Files:**
- `parseIntrospection.ts`: Main parsing logic
- `types.ts`: Parser-specific type definitions

**Purpose:** Parse raw GraphQL introspection JSON into structured data.

**Key Function: `parseIntrospection()`**
```typescript
function parseIntrospection(introspectionData: { data: IntrospectionResult }): ParsedIntrospection
```

**Input:** Raw introspection response from GraphQL endpoint
```json
{
  "data": {
    "__schema": {
      "queryType": { "name": "Query" },
      "types": [ /* array of type definitions */ ]
    }
  }
}
```

**Output:** Filtered and simplified type list
```typescript
{
  types: IntrospectionType[],  // Filtered types
  queryTypeName: string | null  // Root type name
}
```

**Logic:**
1. Extract `__schema.types` array from response
2. Filter out introspection types (names starting with `__`)
3. Preserve queryType name for graph traversal entry point
4. No validation - gracefully handle missing fields

**Key Function: `unwrapType()`**
```typescript
function unwrapType(typeRef: IntrospectionTypeRef): string | null
```

Recursively unwraps LIST and NON_NULL wrappers to get base type name:
- `[String!]!` → `String`
- `[Device]` → `Device`
- `CircuitTermination` → `CircuitTermination`

**Design Decisions:**
- No use of `buildClientSchema` from graphql-js (too heavyweight, requires complete data)
- Direct JSON parsing for speed and simplicity
- Tolerant of missing optional fields (args, inputFields, enumValues)
- Filters introspection types early to reduce downstream processing

### 2. Nodes Module (`src/nodes/`)

**Files:**
- `createTypeNode.ts`: Node factory implementation
- `types.ts`: TypeNode and FieldInfo definitions

**Purpose:** Create TypeNode objects with all metadata computed at instantiation.

**Key Function: `createTypeNode()`**
```typescript
function createTypeNode(typeData: IntrospectionType): TypeNode
```

**Computation Strategy:**
All metadata flags are computed once when the node is created, not via helper functions called repeatedly. This is a performance optimization and design principle.

**Metadata Computation Logic:**

1. **isRelay Detection:**
```typescript
const isRelay = name.endsWith('Connection') ||
                name.endsWith('Edge') ||
                name === 'PageInfo';
```
Identifies Relay pagination pattern types for optional filtering.

2. **isBuiltIn Detection:**
```typescript
const isBuiltIn = name.startsWith('__') ||
                  ['String', 'Int', 'Float', 'Boolean', 'ID'].includes(name);
```
Marks GraphQL primitives and introspection types.

3. **isComposite Detection:**
```typescript
const isComposite = kind === 'OBJECT' ||
                    kind === 'INTERFACE' ||
                    kind === 'UNION';
```
Determines if type can have outgoing edges (relationships).

**Field Extraction:**
- Calls internal `extractFields()` helper
- Unwraps field type references to get base type names
- Creates simplified FieldInfo objects
- Returns undefined if no fields (scalars, enums)

**Interface/Union Extraction:**
- Maps interface references to type names
- Maps union possibleTypes to type names
- Filters null values from unwrapping

**Design Decisions:**
- Compute-once strategy avoids repeated calculations
- Clean separation between parsing and node creation
- TypeNode is immutable after creation
- All metadata available for filtering without traversing graph

### 3. Graph Module (`src/graph/`)

**Files:**
- `extractGraph.ts`: Graph extraction with BFS
- `types.ts`: Edge, EdgeType, TypeGraph definitions

**Purpose:** Build complete type graph using breadth-first traversal from root type.

**Key Function: `extractGraph()`**
```typescript
function extractGraph(introspectionData: { data: any }): TypeGraph
```

**Algorithm: Breadth-First Search (BFS)**

1. **Initialization:**
   - Parse introspection data
   - Create lookup map: `Map<typeName, IntrospectionType>`
   - Find root type (Query) from schema
   - Initialize visited set and queue

2. **BFS Traversal:**
```typescript
while (queue.length > 0) {
  currentType = queue.shift()

  // Extract edges from fields
  for (field in currentType.fields) {
    targetType = unwrap(field.type)
    edges.push({ source: currentType, target: targetType, type: FIELD })
    if (!visited.has(targetType)) {
      queue.push(targetType)
      visited.add(targetType)
    }
  }

  // Extract edges from interfaces
  // Extract edges from union members
}
```

3. **Edge Creation:**
   - **FIELD edges**: From type to field target types
   - **IMPLEMENTS edges**: From type to interfaces it implements
   - **UNION_MEMBER edges**: From union to member types

4. **Node Creation:**
   - Create TypeNode only when first discovered
   - Store in nodes Map for O(1) lookup
   - Prevent duplicate processing with visited Set

**Complexity:**
- Time: O(V + E) where V = types, E = fields + interfaces + unions
- Space: O(V) for nodes Map and visited Set

**Design Decisions:**
- BFS ensures all reachable types are discovered
- Starting from Query type ensures relevance (unused types are excluded)
- Map-based storage for fast lookups during traversal
- Single pass through each type (visited tracking)
- Edges include field names for FIELD edges (useful for labeling)

**Edge Type Distribution in Typical Schema:**
- FIELD edges: 80-90% (most common)
- IMPLEMENTS edges: 5-10% (if interfaces used)
- UNION_MEMBER edges: 5-10% (if unions used)

### 4. Visualization Module (`src/visualization/`)

**Files:**
- `toReactFlow.ts`: Graph to React Flow conversion
- `layout.ts`: Layout algorithms
- `types.ts`: React Flow type definitions

**Purpose:** Convert TypeGraph to React Flow format with layout and styling.

**Key Function: `toReactFlow()`**
```typescript
function toReactFlow(graph: TypeGraph): ReactFlowData
```

**Transformation Steps:**

1. **Node Conversion:**
```typescript
TypeNode → ReactFlowNode {
  id: typeName,
  type: 'default',
  data: {
    label: cleanTypeName(name),    // Remove "Type" suffix
    kind: kind,
    fields: fields,
    isRelay: isRelay,
    isBuiltIn: isBuiltIn
  },
  position: { x: 0, y: 0 }          // Set by layout algorithm
}
```

2. **Edge Conversion:**
```typescript
Edge → ReactFlowEdge {
  id: `e-${source}-${target}-${index}`,
  source: source,
  target: target,
  type: 'smoothstep',
  label: getEdgeLabel(edge),
  animated: edgeType === FIELD,
  style: getEdgeStyle(edgeType)
}
```

3. **Edge Styling:**
- **FIELD**: Solid blue (#2563eb), animated, strokeWidth: 2
- **IMPLEMENTS**: Dashed green (#16a34a), dash pattern: '5,5'
- **UNION_MEMBER**: Dashed red (#dc2626), dash pattern: '3,3'

4. **Layout Application:**
- Call `layoutNodes()` to compute positions
- Default: Simple grid layout
- Alternative: `hierarchicalLayout()` for tree-like structure

**Helper Functions:**

**`cleanTypeName()`**
- Removes "Type" suffix from names (CircuitTerminationType → CircuitTermination)
- Preserves types actually named "Type"
- Executive-friendly display names

**`getEdgeLabel()`**
- FIELD edges: Shows field name
- IMPLEMENTS edges: Shows "implements"
- UNION_MEMBER edges: Shows "member"

**`getEdgeStyle()`**
- Returns color and stroke properties based on EdgeType
- Consistent visual language for relationship types

**Layout Algorithms:**

**Simple Grid Layout (default):**
```typescript
function simpleGridLayout(nodes: ReactFlowNode[]): ReactFlowNode[]
```
- Arranges nodes in grid pattern
- Column count: sqrt(node count)
- Fixed spacing: 250px horizontal, 150px vertical
- Fast, predictable, works for any graph

**Hierarchical Layout (alternative):**
```typescript
function hierarchicalLayout(nodes, edges, rootId): ReactFlowNode[]
```
- BFS from root to assign depth layers
- Horizontal spacing within layers
- Vertical spacing between layers
- Better for tree-like schemas

**Design Decisions:**
- Pre-compute layout on backend (could be done client-side)
- Unique edge IDs include index to handle multiple edges between same nodes
- Preserve all metadata in node data for frontend filtering
- Style edges distinctly so relationship types are obvious
- Animation on FIELD edges draws attention to primary relationships

### 5. API Module (`src/api/`)

**Files:**
- `nautobotClient.ts`: HTTP client for Nautobot API
- `introspectionQuery.ts`: GraphQL introspection query

**Purpose:** Fetch live schema data from Nautobot instances.

**Key Function: `fetchNautobotSchema()`**
```typescript
async function fetchNautobotSchema(config: NautobotConfig): Promise<any>
```

**Process:**
1. Construct GraphQL endpoint URL: `${baseUrl}/api/graphql/`
2. POST request with introspection query
3. Set headers:
   - `Content-Type: application/json`
   - `Authorization: Token ${apiToken}`
4. Parse JSON response
5. Check for GraphQL errors
6. Return introspection data

**Configuration Loading:**
```typescript
function loadNautobotConfig(): NautobotConfig
```
- Reads `NAUTOBOT_URL` from environment
- Reads `NAUTOBOT_API_TOKEN` from environment
- Throws error if missing (fails fast)

**Environment Setup:**
- `.env` file stores credentials (gitignored)
- `.env.example` provided as template
- Use `dotenv` package to load variables

**GraphQL Introspection Query:**
Fetches complete type information:
```graphql
query NautobotSchemaIntrospection {
  __schema {
    queryType { name }
    types {
      kind
      name
      description
      fields {
        name
        description
        type { ...TypeRef }
        isDeprecated
        deprecationReason
      }
      interfaces { kind name }
      possibleTypes { kind name }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      # Recursive to 7 levels deep
      # Handles deeply nested LIST/NON_NULL wrappers
    }
  }
}
```

**Design Decisions:**
- TypeRef fragment handles up to 7 levels of wrapper nesting
- Omits field args (not needed for visualization)
- Omits inputFields and enumValues (reduces payload size)
- Token-based auth (standard for Nautobot)
- Graceful URL normalization (handles trailing slashes)

## Data Flow

### Complete Pipeline Flow

```
1. Environment Variables
   NAUTOBOT_URL, NAUTOBOT_API_TOKEN
   ↓
2. Load Configuration
   loadNautobotConfig()
   ↓
3. Fetch Introspection
   POST https://demo.nautobot.com/api/graphql/
   Authorization: Token xxx
   Body: { query: introspectionQuery }
   ↓
4. Raw Response
   {
     data: {
       __schema: {
         queryType: { name: "Query" },
         types: [ { kind, name, fields, ... }, ... ]
       }
     }
   }
   ↓
5. Parse Introspection
   parseIntrospection(response)
   → Filter __types
   → Extract queryTypeName
   ↓
6. Create Type Map
   Map<typeName, IntrospectionType>
   ↓
7. Extract Graph (BFS)
   extractGraph(introspectionData)
   → Start at Query type
   → Create TypeNodes via createTypeNode()
   → Extract edges from fields/interfaces/unions
   → Queue connected types
   ↓
8. Type Graph
   {
     nodes: Map<name, TypeNode>,
     edges: Edge[],
     rootType: TypeNode
   }
   ↓
9. Convert to React Flow
   toReactFlow(graph)
   → Convert nodes with layout
   → Convert edges with styling
   ↓
10. React Flow Data
   {
     nodes: ReactFlowNode[],
     edges: ReactFlowEdge[]
   }
   ↓
11. React Component
   <SchemaVisualizer data={reactFlowData} />
   → Render with ReactFlow
   → Apply filters
   → Handle interactions
```

### Data Transformation Example

**Raw Introspection (snippet):**
```json
{
  "kind": "OBJECT",
  "name": "CircuitTerminationType",
  "fields": [
    {
      "name": "cable",
      "type": {
        "kind": "OBJECT",
        "name": "CableType"
      }
    }
  ]
}
```

**After Parse:**
```typescript
{
  kind: "OBJECT",
  name: "CircuitTerminationType",
  fields: [
    { name: "cable", type: { kind: "OBJECT", name: "CableType" } }
  ]
}
// (unchanged, but __types filtered)
```

**After createTypeNode:**
```typescript
{
  name: "CircuitTerminationType",
  kind: "OBJECT",
  isComposite: true,
  isRelay: false,
  isBuiltIn: false,
  fields: [
    { name: "cable", typeName: "CableType" }
  ]
}
```

**After extractGraph:**
```typescript
// In nodes Map:
"CircuitTerminationType" → { name: "CircuitTerminationType", ... }
"CableType" → { name: "CableType", ... }

// In edges array:
{
  source: "CircuitTerminationType",
  target: "CableType",
  edgeType: EdgeType.FIELD,
  fieldName: "cable"
}
```

**After toReactFlow:**
```typescript
// Node:
{
  id: "CircuitTerminationType",
  type: "default",
  data: {
    label: "CircuitTermination",
    kind: "OBJECT",
    fields: [{ name: "cable", typeName: "CableType" }]
  },
  position: { x: 250, y: 150 }
}

// Edge:
{
  id: "e-CircuitTerminationType-CableType-0",
  source: "CircuitTerminationType",
  target: "CableType",
  type: "smoothstep",
  label: "cable",
  animated: true,
  style: { stroke: "#2563eb", strokeWidth: 2 }
}
```

## Testing Strategy

### Unit Tests (`src/tests/unit/`)

Unit tests use mock data from `mock_data.json` for fast, deterministic testing.

**`parseIntrospection.test.ts`**
- Validates JSON parsing correctness
- Tests introspection type filtering
- Verifies type unwrapping logic
- Tests error handling for malformed data
- Confirms expected Nautobot types are found

**`createTypeNode.test.ts`**
- Tests metadata flag computation
- Validates Relay type detection patterns
- Checks built-in scalar identification
- Tests composite type classification
- Verifies field extraction and simplification
- Tests interface and union extraction

**`extractGraph.test.ts`**
- Validates BFS traversal completeness
- Tests edge creation for all edge types
- Verifies node deduplication
- Tests root type identification
- Checks deep traversal beyond Query fields
- Validates graph structure consistency

**`toReactFlow.test.ts`**
- Tests node conversion preserving metadata
- Validates edge conversion with correct styling
- Tests layout position assignment
- Checks type name cleaning logic
- Verifies edge ID uniqueness
- Tests animation flags for FIELD edges

### Integration Tests (`src/tests/integration/`)

**`nautobot.test.ts`**
- Makes live API calls to real Nautobot instance
- Tests complete pipeline with actual data
- Validates performance benchmarks
- Checks for Nautobot-specific types
- Tests error handling with invalid credentials
- Verifies graceful degradation

**Configuration:**
- Requires `NAUTOBOT_URL` and `NAUTOBOT_API_TOKEN` in `.env`
- Tests skip gracefully if credentials missing
- Extended timeout for network calls (30 seconds)

### Test Organization

```
src/tests/
├── unit/
│   ├── parseIntrospection.test.ts    # Parser tests
│   ├── createTypeNode.test.ts        # Node factory tests
│   ├── extractGraph.test.ts          # Graph extraction tests
│   └── toReactFlow.test.ts           # Conversion tests
└── integration/
    └── nautobot.test.ts              # Live API tests
```

### Running Tests

```bash
# All tests
npm test -- --run

# Unit tests only
npm test -- src/tests/unit/ --run

# Integration tests only
npm test -- src/tests/integration/ --run

# Watch mode
npm run test:watch
```

## Implementation Notes

### Why Not buildClientSchema?

The standard `buildClientSchema` from graphql-js was explicitly avoided:

**Problems with buildClientSchema:**
- Requires complete, valid introspection with all optional fields
- Designed for schema execution, not visualization
- Throws validation errors on incomplete data
- Heavy dependency with unnecessary features
- Overkill for relationship extraction

**Benefits of Custom Parser:**
- Works with incomplete introspection data
- No validation overhead
- Full control over data structure
- Easier to add visualization-specific features
- Simpler, more maintainable
- Smaller bundle size

### Performance Considerations

**Algorithm Complexity:**
- Parser: O(n) where n = number of types
- Node creation: O(1) per node
- Graph extraction: O(V + E) where V = types, E = relationships
- Layout: O(n) for grid, O(V + E) for hierarchical
- Total: O(V + E) - linear in graph size

**Optimization Strategies:**
1. **Compute metadata once** - All flags computed at node creation, not via repeated helper calls
2. **Map-based lookups** - O(1) type lookup during traversal
3. **Visited tracking** - Prevent duplicate processing
4. **Early filtering** - Remove introspection types before processing
5. **Lazy field extraction** - Only extract fields for composite types

**Benchmarks:**
- Parse: < 10ms for 100+ types
- Extract graph: < 50ms for 100+ types
- Convert to React Flow: < 20ms
- Total pipeline: < 100ms for typical Nautobot schema

**Memory Usage:**
- Linear in schema size: O(V + E)
- Map storage more efficient than repeated array searches
- Immutable data structures prevent mutation bugs

### Executive-Friendly Features

**Type Name Cleaning:**
- Remove "Type" suffix (CircuitTerminationType → CircuitTermination)
- More natural for non-technical audience
- Preserves types actually named "Type"

**Default Filters:**
- Hide built-in scalars by default (String, Int, etc.)
- Hide Relay pagination types (Connection, Edge, PageInfo)
- Show only business-relevant types initially
- Allow toggling to see complete schema

**Visual Design:**
- Color code by type kind (OBJECT, INTERFACE, UNION)
- Distinct edge styles for relationship types
- Animated FIELD edges draw attention
- Clean labels without technical jargon

**Progressive Disclosure:**
- Start with high-level view
- Click nodes to see details
- Expand/collapse field lists
- Filter by relationship type

## Package Dependencies

### Core Dependencies
```json
{
  "typescript": "^5.0.0",
  "vitest": "^1.0.0",
  "dotenv": "^17.2.3",
  "node-fetch": "^3.3.2"
}
```

### Visualization Dependencies
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "reactflow": "^11.11.4",
  "@mui/material": "^7.3.2",
  "@mui/icons-material": "^7.3.2"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^19.1.16",
  "@types/react-dom": "^19.1.9",
  "@vitejs/plugin-react": "^5.0.4",
  "vite": "^7.1.7"
}
```

## Development Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build TypeScript
npm run build

# Development server
npm run dev

# Preview production build
npm run preview
```

## Project Structure

```
graph-vis/
├── src/
│   ├── parser/
│   │   ├── parseIntrospection.ts     # JSON parsing logic
│   │   ├── types.ts                  # Parser type definitions
│   │   └── README.md                 # Parser documentation
│   │
│   ├── nodes/
│   │   ├── createTypeNode.ts         # Node factory with metadata
│   │   ├── types.ts                  # TypeNode definitions
│   │   └── README.md                 # Node factory documentation
│   │
│   ├── graph/
│   │   ├── extractGraph.ts           # BFS graph extraction
│   │   ├── types.ts                  # Graph type definitions
│   │   └── README.md                 # Graph extraction documentation
│   │
│   ├── visualization/
│   │   ├── toReactFlow.ts            # React Flow conversion
│   │   ├── layout.ts                 # Layout algorithms
│   │   ├── types.ts                  # Visualization types
│   │   └── README.md                 # Visualization documentation
│   │
│   ├── api/
│   │   ├── nautobotClient.ts         # HTTP client
│   │   ├── introspectionQuery.ts     # GraphQL query
│   │   └── README.md                 # API integration documentation
│   │
│   ├── components/
│   │   ├── SchemaVisualizer.tsx      # Main React component
│   │   ├── TypeNode.tsx              # Custom node component
│   │   └── Controls.tsx              # Filter controls
│   │
│   ├── data/
│   │   └── mock_data.json            # Sample Nautobot introspection
│   │
│   ├── tests/
│   │   ├── unit/                     # Unit tests
│   │   │   ├── parseIntrospection.test.ts
│   │   │   ├── createTypeNode.test.ts
│   │   │   ├── extractGraph.test.ts
│   │   │   └── toReactFlow.test.ts
│   │   └── integration/              # Integration tests
│   │       └── nautobot.test.ts
│   │
│   └── index.ts                      # Main exports
│
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Template for .env
├── .gitignore                        # Git ignore rules
├── CLAUDE.md                         # This file (architecture docs)
├── package.json                      # NPM configuration
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Test configuration
└── vite.config.ts                    # Vite configuration
```

## Success Criteria

### Functional Requirements
- Parse Nautobot introspection successfully
- Extract all major types (Circuit, Cable, Device, Site, Interface)
- Identify all relationship types (FIELD, IMPLEMENTS, UNION_MEMBER)
- Convert to React Flow format with layout
- Render interactive visualization
- Toggle relationship types
- Filter by type kind
- Search and highlight types

### Quality Requirements
- All tests pass with good coverage
- TypeScript strict mode with no errors
- Handles incomplete introspection gracefully
- Clean, readable, well-documented code
- Fast performance (sub-second for 100+ nodes)
- No memory leaks or performance degradation

### User Experience Requirements
- Executives can understand visualization without technical knowledge
- Important relationships are visually obvious
- Layout is clean and readable
- Interactive controls are intuitive
- Filtering works smoothly
- Search is responsive
- Node details are comprehensive

## Future Enhancements

### Layout Improvements
- Hierarchical layout (top-down from Query)
- Force-directed layout option
- Manual node positioning with save
- Smart edge routing to avoid overlaps
- Automatic clustering of related types

### Filtering Enhancements
- Domain-based filtering (network, admin, infrastructure)
- Importance-based filtering (show only top N most-connected types)
- Path filtering (show only types between A and B)
- Regex search for type names
- Filter by field count, connection count

### Visualization Features
- Color coding by domain (network vs admin types)
- Edge bundling for complex graphs
- Mini-map for large schemas
- Zoom to fit selection
- Highlight path between two types
- Show type statistics (field count, connection count)

### Export Capabilities
- Export as PNG/SVG
- Export as DOT (Graphviz format)
- Export as JSON (for other tools)
- Share via URL with filter state
- Generate schema documentation

### Analysis Features
- Type usage statistics
- Identify orphaned types (no connections)
- Find circular dependencies
- Detect anti-patterns
- Schema complexity metrics
- Change detection between versions

## Key Takeaways for New Agents

### Project Goals
1. **Executive-friendly visualization** - not technical schema validation
2. **Relationship understanding** - show how types connect
3. **Performance** - fast processing of large schemas
4. **Simplicity** - clean code, clear data flow
5. **Extensibility** - easy to add new features

### Design Principles
1. **Compute once** - metadata at creation, not via helpers
2. **Immutable data** - transform, don't mutate
3. **Linear pipeline** - clear stages, unidirectional flow
4. **Type safety** - TypeScript strict mode
5. **Graceful degradation** - handle incomplete data

### Data Flow Summary
```
API → Parse → Create Nodes → Extract Graph → Convert → Render
```

Each stage produces a more refined structure. The graph is the central data model, with React Flow format being a view-specific transformation.

### When Adding Features
- Parse: Add new fields to IntrospectionType
- Nodes: Add metadata flags to TypeNode
- Graph: Add new edge types to EdgeType enum
- Visualization: Add styling in toReactFlow
- Frontend: Add filters/controls in components

### Testing Approach
- Unit tests with mock data for speed
- Integration tests with live API for validation
- Test each module independently
- Test full pipeline together
- Performance benchmarks for large schemas
