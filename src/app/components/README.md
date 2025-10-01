# UI Components

## Overview

Executive-friendly UI components built with Material-UI that render the GraphQL schema visualization. Each component follows a single-responsibility principle with clear separation between presentation and business logic.

## Component Hierarchy

```
SchemaVisualizer (Root)
├── ThemeProvider (MUI Theme)
├── ReactFlowProvider (React Flow Context)
└── SchemaVisualizerContent
    ├── SearchBar (Top Navigation)
    ├── Controls (Left Sidebar - Filters)
    ├── ReactFlow (Center Canvas)
    │   ├── CustomNode (x N nodes)
    │   ├── Background (Grid pattern)
    │   ├── MiniMap (Overview)
    │   └── FlowControls (Zoom buttons)
    └── InfoPanel (Right Drawer - Details)
```

---

## SchemaVisualizer

**File**: `SchemaVisualizer.tsx`

**Purpose**: Main application container that orchestrates state management, hook composition, and layout rendering.

### Props

```typescript
interface SchemaVisualizerProps {
  initialNodes: CustomReactFlowNode[];  // Pre-processed nodes from pipeline
  initialEdges: CustomReactFlowEdge[];  // Pre-styled edges from pipeline
}
```

### State Management

```typescript
// React Flow state
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

// Filter state
const [filters, setFilters] = useState<FilterState>({
  showFields: true,
  showImplements: true,
  showUnions: true,
  hideBuiltIns: true,
  hideRelay: true,
});

// UI state
const [selectedNode, setSelectedNode] = useState<CustomReactFlowNode | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [controlsOpen, setControlsOpen] = useState(true);
```

### Data Flow

1. **Filtering**: `useFilteredGraph(nodes, edges, filters)` → filtered graph
2. **Search**: `useSearch(filteredNodes, searchQuery)` → highlighted node IDs
3. **Styling**: Compute `styledNodes` with opacity and selection
4. **Connection Counts**: Calculate incoming/outgoing edges for selected node
5. **Rendering**: Pass data to React Flow and child components

### Key Features

#### Dynamic Node Styling
```typescript
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
```

- Dim non-matching nodes during search (opacity 0.3)
- Highlight search matches and selected node
- Smooth opacity transitions

#### Connection Count Calculation
```typescript
const connectionCounts = useMemo(() => {
  if (!selectedNode) return { incoming: 0, outgoing: 0 };

  const incoming = edges.filter((e) => e.target === selectedNode.id).length;
  const outgoing = edges.filter((e) => e.source === selectedNode.id).length;

  return { incoming, outgoing };
}, [selectedNode, edges]);
```

- Memoized for performance
- Shows in InfoPanel for context

#### Responsive Layout
```typescript
<Box
  sx={{
    flex: 1,
    ml: controlsOpen ? '280px' : 0,
    mr: selectedNode ? '360px' : 0,
    transition: 'margin 0.2s ease',
  }}
>
```

- Canvas adapts when sidebars open/close
- Smooth 200ms transitions
- Full-height layout (100vh)

### Design Decisions

**Wrapper Pattern**: `SchemaVisualizer` → `SchemaVisualizerContent`
- Outer component provides MUI Theme and React Flow Provider
- Inner component contains business logic
- Clean separation of context setup from state management

**Custom Node Types**: Registered once with `useMemo`
```typescript
const nodeTypes: NodeTypes = useMemo(() => ({ default: CustomNode }), []);
```
- Stable reference prevents React Flow re-initialization
- Custom node component for all nodes

**MiniMap Coloring**: Color-coded by type kind
```typescript
nodeColor={(node) => {
  const customNode = node as CustomReactFlowNode;
  return customNode.data.kind === 'OBJECT' ? '#2563eb'
    : customNode.data.kind === 'INTERFACE' ? '#16a34a'
    : '#6b7280';
}}
```

---

## CustomNode

**File**: `CustomNode.tsx`

**Purpose**: Render individual GraphQL types as interactive MUI Card components with color-coding and field previews.

### Props

```typescript
interface CustomNodeProps {
  data: CustomReactFlowNode['data'];  // Node metadata (label, kind, fields, etc.)
  selected?: boolean;                 // Selection state from React Flow
}
```

### Visual Design

```
┌─────────────────────────────────┐
│ TypeName           [KIND]       │  ← Header with badge
├─────────────────────────────────┤
│ field1: String                  │  ← Field preview (max 3)
│ field2: Int                     │
│ field3: CircuitTerminationType  │
│ +12 more                        │  ← Overflow indicator
└─────────────────────────────────┘
```

### Color Coding

```typescript
const TYPE_KIND_COLORS = {
  OBJECT: '#2563eb',      // Blue - Primary types
  INTERFACE: '#16a34a',   // Green - Contracts
  UNION: '#ea580c',       // Orange - Choices
  SCALAR: '#6b7280',      // Gray - Primitives
  ENUM: '#9333ea',        // Purple - Enumerations
};
```

**Applied To**:
- Type name text color
- Selected border color
- Kind badge background

### Interactive States

**Default**:
```typescript
border: '1px solid #e0e0e0'
boxShadow: 1
```

**Hover**:
```typescript
boxShadow: 3
transform: 'translateY(-2px)'
transition: 'all 0.2s ease'
```

**Selected**:
```typescript
border: `2px solid ${typeColor}`
boxShadow: 4
```

### Field Preview Logic

```typescript
const maxFieldsToShow = 3;

{data.fields && data.fields.length > 0 && (
  <Box sx={{ mt: 1 }}>
    {data.fields.slice(0, maxFieldsToShow).map((field, idx) => (
      <Typography variant="caption" display="block">
        {field.name}: {field.typeName}
      </Typography>
    ))}
    {data.fields.length > maxFieldsToShow && (
      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
        +{data.fields.length - maxFieldsToShow} more
      </Typography>
    )}
  </Box>
)}
```

### Design Decisions

**Limited Field Preview**: Show only first 3 fields
- Avoids visual clutter on canvas
- Indicates more fields with "+N more"
- Full list available in InfoPanel

**Compact Layout**: 180-280px width
- Fits many nodes on screen
- Text truncation with ellipsis for long names
- Auto height based on content

**MUI Card Component**: Professional appearance
- Built-in elevation and shadows
- Rounded corners (8px border-radius)
- Responsive hover effects

**React Flow Handles**: Top (target) and Bottom (source)
- Standard positioning for hierarchical layouts
- Supports bi-directional edges

---

## Controls

**File**: `Controls.tsx`

**Purpose**: Left sidebar with filter toggles for relationship and node visibility control.

### Props

```typescript
interface ControlsProps {
  filters: FilterState;                    // Current filter state
  onChange: (filters: FilterState) => void;  // Filter update callback
  open: boolean;                           // Drawer visibility
  onClose: () => void;                     // Close drawer callback
}
```

### Filter Categories

#### Relationships (Show/Hide Edges)

```typescript
<FormControlLabel
  control={<Switch checked={filters.showFields} />}
  label={
    <Box>
      <Typography variant="body2">Field Edges</Typography>
      <Typography variant="caption" color="text.secondary">
        Show type field relationships
      </Typography>
    </Box>
  }
/>
```

- **Field Edges**: Type → Type relationships via fields (solid blue, animated)
- **Implements**: Type → Interface relationships (dashed green)
- **Union Members**: Union → Type relationships (dashed red)

#### Node Visibility (Show/Hide Nodes)

- **Hide Built-ins**: Filter out String, Int, Float, Boolean, ID
- **Hide Relay Types**: Filter out Connection, Edge, PageInfo patterns

### UX Features

**Descriptive Labels**:
- Primary label (e.g., "Field Edges")
- Secondary description (e.g., "Show type field relationships")
- Executive-friendly language (no technical jargon)

**Persistent Drawer**:
```typescript
<Drawer
  variant="persistent"
  anchor="left"
  open={open}
  sx={{ width: 280 }}
>
```
- Stays open until explicitly closed
- Does not overlay canvas
- Canvas margin adjusts automatically

**Visual Grouping**:
- Section headers ("Relationships", "Node Visibility")
- Dividers between sections
- Consistent spacing (16px padding)

### Design Decisions

**Default Filter State**: Hide noise, show all relationships
```typescript
{
  showFields: true,
  showImplements: true,
  showUnions: true,
  hideBuiltIns: true,    // Hide by default
  hideRelay: true,       // Hide by default
}
```

**Switch Toggles**: Binary on/off (no tri-state)
- Clear visual feedback
- Instant filter application
- MUI Switch component for consistency

**Collapsible Sidebar**: User control over workspace
- Chevron icon to close
- Menu button in SearchBar to reopen
- Preserves filter state when closed

---

## SearchBar

**File**: `SearchBar.tsx`

**Purpose**: Top navigation bar with search input, app branding, and menu toggle.

### Props

```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;  // Search query callback
  onMenuClick: () => void;            // Menu toggle callback
}
```

### Layout

```
┌────────────────────────────────────────────────────┐
│ [☰]  GraphQL Schema Visualizer  [🔍 Search...] [×] │
└────────────────────────────────────────────────────┘
```

### Features

#### Search Input
```typescript
<TextField
  fullWidth
  size="small"
  placeholder="Search types..."
  value={query}
  onChange={handleChange}
  InputProps={{
    startAdornment: <SearchIcon />,
    endAdornment: query && <ClearIcon />
  }}
/>
```

- **Live Search**: Fires `onSearch` on every keystroke
- **Clear Button**: Appears when query is not empty
- **Icon Indicators**: Search icon (left), Clear icon (right)
- **Max Width**: 600px for readability

#### Menu Toggle
```typescript
<IconButton onClick={onMenuClick}>
  <MenuIcon />
</IconButton>
```

- Hamburger icon to toggle Controls sidebar
- Standard MUI IconButton for accessibility

### Search Behavior

**Controlled Input**:
```typescript
const [query, setQuery] = useState('');

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const newQuery = event.target.value;
  setQuery(newQuery);
  onSearch(newQuery);
};
```

- Local state for input value
- Callback to parent on every change
- Parent handles search logic via `useSearch` hook

**Clear Functionality**:
```typescript
const handleClear = () => {
  setQuery('');
  onSearch('');
};
```

### Design Decisions

**MUI AppBar**: Consistent header styling
- Elevation: 1 (subtle shadow)
- Color: default (white background)
- Full-width with Toolbar for padding

**Search-First Design**: Prominent search input
- Takes majority of AppBar space
- Clear affordance for text input
- Familiar UX pattern

---

## InfoPanel

**File**: `InfoPanel.tsx`

**Purpose**: Right-side drawer showing comprehensive details for the selected node.

### Props

```typescript
interface InfoPanelProps {
  node: CustomReactFlowNode | null;  // Selected node (null if none)
  onClose: () => void;               // Close panel callback
  incomingCount?: number;            // Incoming edge count
  outgoingCount?: number;            // Outgoing edge count
}
```

### Layout

```
┌──────────────────────────────┐
│ Type Details            [×]  │  ← Header with close button
├──────────────────────────────┤
│ TypeName  [KIND]             │  ← Title with badge
│ Description text here...     │
│ [Relay Type] [Built-in Type] │  ← Metadata badges
├──────────────────────────────┤
│ Connections                  │  ← Statistics
│ 5 Incoming   12 Outgoing     │
├──────────────────────────────┤
│ Fields (24)                  │  ← Complete field list
│ • id: ID                     │
│ • name: String               │
│ • circuit: CircuitType       │
│ ...                          │
│ (scrollable)                 │
└──────────────────────────────┘
```

### Sections

#### Header
```typescript
<Box display="flex" justifyContent="space-between">
  <Typography variant="h6" fontWeight="bold">
    Type Details
  </Typography>
  <IconButton onClick={onClose} size="small">
    <CloseIcon />
  </IconButton>
</Box>
```

#### Type Information
```typescript
<Box display="flex" alignItems="center" gap={1}>
  <Typography variant="h5" fontWeight="bold" sx={{ color: typeColor }}>
    {node.data.label}
  </Typography>
  <Chip label={node.data.kind} sx={{ backgroundColor: typeColor }} />
</Box>

{node.data.description && (
  <Typography variant="body2" color="text.secondary">
    {node.data.description}
  </Typography>
)}
```

#### Metadata Badges
```typescript
{node.data.isRelay && <Chip label="Relay Type" color="info" size="small" />}
{node.data.isBuiltIn && <Chip label="Built-in Type" color="default" size="small" />}
```

#### Connection Statistics
```typescript
<Box display="flex" gap={2}>
  <Box>
    <Typography variant="h6" fontWeight="bold">{incomingCount}</Typography>
    <Typography variant="caption" color="text.secondary">Incoming</Typography>
  </Box>
  <Box>
    <Typography variant="h6" fontWeight="bold">{outgoingCount}</Typography>
    <Typography variant="caption" color="text.secondary">Outgoing</Typography>
  </Box>
</Box>
```

#### Field List
```typescript
<List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
  {node.data.fields.map((field, idx) => (
    <ListItem key={idx}>
      <ListItemText
        primary={<Typography variant="body2" fontWeight="medium">{field.name}</Typography>}
        secondary={<Typography variant="caption">{field.typeName}</Typography>}
      />
    </ListItem>
  ))}
</List>
```

### Design Decisions

**Temporary Drawer**: Closes on outside click
```typescript
<Drawer anchor="right" open={!!node} onClose={onClose}>
```

**Fixed Width**: 360px for consistent layout
- Wide enough for readable field names
- Narrow enough to preserve canvas space

**Scrollable Field List**: Handles types with many fields
- Max height 400px
- Dense list variant for compact display
- Full field names (no truncation)

**Connection Context**: Shows graph relationships
- Helps understand type importance
- Incoming edges show "used by" relationships
- Outgoing edges show "depends on" relationships

---

## Design System

### Spacing

- **Sidebar Width**: 280px (Controls), 360px (InfoPanel)
- **Node Width**: 180px (min), 280px (max)
- **Padding**: 12px (Cards), 16px (Panels)
- **Margins**: 8px (between elements), 16px (between sections)
- **Gaps**: 8-16px (flexbox gaps)

### Typography

- **App Title**: h6, bold
- **Node Label**: subtitle2, bold, color-coded
- **Field Name**: caption (0.7rem), gray
- **Panel Title**: h5, bold, color-coded
- **Description**: body2, secondary color
- **Badge**: 0.65rem, bold, white on colored background

### Colors

Defined in `../utils/colors.ts`:

```typescript
TYPE_KIND_COLORS = {
  OBJECT: '#2563eb',      // Blue
  INTERFACE: '#16a34a',   // Green
  UNION: '#ea580c',       // Orange
  SCALAR: '#6b7280',      // Gray
  ENUM: '#9333ea',        // Purple
}
```

### Transitions

- **Sidebar**: 200ms ease (margin transitions)
- **Hover**: 200ms ease (elevation, transform)
- **Search Pan**: 800ms with zoom animation
- **Opacity**: Instant (search highlighting)

### Shadows (MUI Elevation)

- **Default Card**: elevation 1
- **Hover Card**: elevation 3
- **Selected Card**: elevation 4
- **AppBar**: elevation 1
- **Drawer**: elevation 16 (MUI default)

## Accessibility

### Semantic HTML
- `<AppBar>` for navigation
- `<Drawer>` for sidebars
- `<Card>` for node representation
- `<List>` for field lists

### ARIA Labels
```typescript
<IconButton aria-label="menu" onClick={onMenuClick}>
  <MenuIcon />
</IconButton>
```

### Keyboard Support
- Tab navigation through interactive elements
- Enter to activate buttons
- Esc to close drawers
- Focus indicators on all inputs

### Screen Readers
- Descriptive labels on all controls
- Role attributes from MUI components
- Alt text on icons (via aria-label)

## Performance Optimizations

### Memoization
```typescript
const nodeTypes = useMemo(() => ({ default: CustomNode }), []);
const styledNodes = useMemo(() => { /* ... */ }, [filteredData, highlightedNodes]);
const connectionCounts = useMemo(() => { /* ... */ }, [selectedNode, edges]);
```

### Callback Stability
```typescript
const handleNodeClick = useCallback((_, node) => setSelectedNode(node), []);
const handleCloseInfo = useCallback(() => setSelectedNode(null), []);
```

### Efficient Rendering
- React Flow's virtual rendering for large graphs
- Conditional rendering (InfoPanel only when node selected)
- Dense MUI list variant for many fields
- CSS transitions (GPU-accelerated)

## Testing Recommendations

### Unit Tests
- CustomNode rendering with various type kinds
- Controls toggle behavior
- SearchBar clear functionality
- InfoPanel field list rendering

### Integration Tests
- SchemaVisualizer with mock data
- Filter interaction → graph updates
- Search → node highlighting and pan
- Node selection → InfoPanel display

### Visual Regression
- Screenshot tests for each component
- Theme consistency across components
- Responsive layout at various widths

## Future Enhancements

### Features
- **Export Node Details**: Copy to clipboard, print view
- **Field Search**: Filter field list in InfoPanel
- **Hover Tooltips**: Show field types on edge hover
- **Keyboard Shortcuts**: Quick access to filters and search
- **Custom Themes**: User-selectable color schemes

### UX Improvements
- **Mobile Responsive**: Bottom sheet for mobile InfoPanel
- **Touch Gestures**: Pinch to zoom, swipe to dismiss
- **Loading States**: Skeleton screens during data load
- **Empty States**: Friendly messages when no results
- **Error Boundaries**: Graceful error handling

### Performance
- **Virtual Scrolling**: For 100+ field lists
- **Lazy Loading**: InfoPanel content on-demand
- **Image Export**: HTML2Canvas for visualization export
