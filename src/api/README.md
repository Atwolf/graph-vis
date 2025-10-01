# API Module

HTTP client for fetching GraphQL introspection data from live Nautobot instances.

## Purpose

Fetch schema data from Nautobot GraphQL API with token authentication and error handling.

## Core Functions

### fetchNautobotSchema()

```typescript
fetchNautobotSchema(config: NautobotConfig): Promise<any>
```

POSTs introspection query to Nautobot GraphQL endpoint with token authentication.

### loadNautobotConfig()

```typescript
loadNautobotConfig(): NautobotConfig
```

Loads configuration from environment variables (`NAUTOBOT_URL`, `NAUTOBOT_API_TOKEN`). Throws if missing.

## GraphQL Query

Fetches complete type information needed for visualization:
- Type definitions (kind, name, description)
- Field information (name, type, deprecation)
- Relationships (interfaces, union members)

**Excludes** to reduce payload:
- Field arguments (not needed for visualization)
- Input fields (focus on output types)
- Enum values (not needed for relationships)

**TypeRef fragment** handles 7 levels of LIST/NON_NULL wrapper nesting.

## Design Decisions

**Token-based auth**
- Nautobot standard: `Authorization: Token xxx`
- Not Bearer (OAuth) or Basic (username:password)

**URL normalization**
- Strips trailing slashes before appending `/api/graphql/`
- Handles both `https://demo.nautobot.com` and `https://demo.nautobot.com/`

**Fail-fast configuration**
- Throws immediately if credentials missing
- Better than failing during request

**Raw fetch, not GraphQL client**
- Only need one query (introspection)
- Avoid heavy dependencies
- Full control over request format

**POST for queries**
- GraphQL convention
- Avoids URL length limits for complex queries

## Environment Setup

Store credentials in `.env` (gitignored):
```bash
NAUTOBOT_URL=https://demo.nautobot.com
NAUTOBOT_API_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

Load with dotenv:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

## Error Handling

**Network errors** (404, 401, 403, 500)
- Throws with status code and message
- Common: 404 (wrong URL), 401 (invalid token)

**GraphQL errors**
- Response can be 200 but contain errors in body
- Checks `result.errors` and throws if present

**Missing configuration**
- Throws with helpful message about setting env vars

## Usage

```typescript
import { fetchNautobotSchema, loadNautobotConfig } from './api/nautobotClient';

const config = loadNautobotConfig();
const introspectionData = await fetchNautobotSchema(config);
```

See `src/tests/integration/nautobot.test.ts` for live API examples.

## Security

**Token storage**
- Development: `.env` file (gitignored)
- Production: environment variables, secret management

**HTTPS required**
- Tokens in clear text in header
- HTTPS encrypts entire request

**Least privilege**
- Read-only tokens sufficient
- No write/delete permissions needed
