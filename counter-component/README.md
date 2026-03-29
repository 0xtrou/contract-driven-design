# Counter Component

A minimal **contract-driven, MCP-native** counter component demonstrating the architecture.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run as MCP server (stdio transport)
npm run start:stdio

# Or run with explicit transport
node dist/server.js --transport http --port 3001
```

## Contract

The component contract lives in [`counter.component.yml`](./counter.component.yml).

This defines:
- **Capabilities**: `increment`, `decrement`, `get`, `reset`
- **State**: A single integer counter with bounds
- **Errors**: `COUNTER_OVERFLOW`, `COUNTER_UNDERFLOW`
- **Side effects**: None (pure in-memory state)

## MCP Surface

When running, the component exposes itself as an MCP server with:

### Tools
| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `counter_increment` | Increment counter by 1 | `{ amount?: number }` | `{ value: number }` |
| `counter_decrement` | Decrement counter by 1 | `{ amount?: number }` | `{ value: number }` |
| `counter_get` | Get current value | `{}` | `{ value: number }` |
| `counter_reset` | Reset to zero | `{}` | `{ value: number }` |

### Resources
| Resource | URI | Description |
|----------|-----|-------------|
| Contract | `counter://contract` | The YAML contract itself |
| State | `counter://state` | Current counter state |

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Single test file
npx vitest run src/counter.test.ts
```

## Architecture

This component demonstrates:

1. **Contract-First**: `counter.component.yml` is the source of truth
2. **MCP-Native**: Generated MCP server surface from contract
3. **Test-Covered**: Contract conformance tests + property tests
4. **Zero External Dependencies**: Pure in-memory state

## File Structure

```
counter-component/
├── counter.component.yml    # Contract definition
├── src/
│   ├── types.ts             # TypeScript types from contract
│   ├── counter.ts           # Core counter logic
│   ├── counter.test.ts      # Unit tests
│   ├── server.ts            # MCP server implementation
│   └── server.test.ts       # MCP conformance tests
├── examples/
│   ├── increment.json       # Example: increment input/output
│   └── overflow.json        # Example: overflow error
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
