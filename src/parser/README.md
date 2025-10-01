# Parser Module

Lightweight GraphQL introspection parsing without schema validation. Extracts type information from raw JSON responses.

## Purpose

Parse GraphQL introspection JSON into structured data optimized for visualization, filtering out introspection types and preserving only what's needed.

## Core Functions

### parseIntrospection()

```typescript
parseIntrospection(introspectionData: { data: IntrospectionResult }): ParsedIntrospection
```

Takes raw introspection response, filters types starting with `__`, returns simplified type list with query type name.

### unwrapType()

```typescript
unwrapType(typeRef: IntrospectionTypeRef): string | null
```

Recursively unwraps LIST and NON_NULL wrappers to get base type name.

Examples: `[String!]!` → `String`, `[Device]` → `Device`

## Design Decisions

**Why custom parser instead of buildClientSchema?**
- buildClientSchema requires complete, valid introspection (throws on incomplete data)
- Designed for execution, not visualization
- We only need relationships, not executable schema
- Custom parser is simpler, faster, and more tolerant

**Early filtering**
- Introspection types (`__Schema`, `__Type`, etc.) removed immediately
- Reduces data volume for downstream processing
- These meta-types aren't relevant for business visualization

**Graceful handling**
- No validation or error throwing for missing optional fields
- Tolerates incomplete introspection data
- Extract what we need, ignore the rest

## Usage

```typescript
import { parseIntrospection } from './parser/parseIntrospection';

const parsed = parseIntrospection(mockData);
// parsed.types: filtered type array
// parsed.queryTypeName: "Query"
```

See `src/tests/unit/parseIntrospection.test.ts` for comprehensive examples.
