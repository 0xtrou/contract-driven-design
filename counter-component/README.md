# Counter Component

A minimal reference implementation of a **contract-driven, MCP-native** component.

The internals are intentionally unremarkable. The point is the boundary.

---

## Quick Start

```bash
npm install
npm test              # boundary conformance suite
npm run start:stdio   # run as MCP server
```

---

## Contract

The component's boundary commitments are declared in [`counter.component.yml`](./counter.component.yml).

This file is the only normative artifact. It defines:

- **Operations**: `increment`, `decrement`, `get`, `reset`
- **Output**: `{ value: integer }` on every successful call
- **Errors**: `COUNTER_OVERFLOW`, `COUNTER_UNDERFLOW` — typed, with retryability declared
- **Side effects**: none permitted (`network`, `filesystem`, `database` all forbidden)
- **State bounds**: integer counter with declared min/max defaults
- **Annotations**: per-operation `readOnly`, `destructive`, `idempotent`, `openWorld`

Internals are free to change. The contract is not.

---

## MCP Surface

The component projects itself as an MCP server derived from the contract:

### Tools

| Tool | Contract operation |
|------|--------------------|
| `counter_increment` | `increment` |
| `counter_decrement` | `decrement` |
| `counter_get` | `get` |
| `counter_reset` | `reset` |

All tool metadata (input schemas, annotations) is derived from `counter.component.yml`.

### Resources

| URI | Content |
|-----|---------|
| `counter://contract` | Parsed contract (JSON) |
| `counter://state` | Current runtime state (JSON) |

### Prompts

| Name | Source |
|------|--------|
| `counter_usage` | `instructions` field from contract |

---

## Boundary Conformance Tests

Tests prove the boundary honors the contract. Implementation details are not tested.

```bash
npm test
```

Three test suites:

| File | What it tests |
|------|---------------|
| `contract.test.ts` | Contract loads and parses correctly |
| `counter.test.ts` | Boundary commitments: output shape, error codes, state guarantees |
| `server.test.ts` | MCP projection matches contract: tools, annotations, resources, prompts |

---

## File Structure

```
counter-component/
├── counter.component.yml   # Canonical contract — the only normative file
├── src/
│   ├── contract.ts         # Loads, validates, and projects the contract
│   ├── types.ts            # TypeScript types for contract shape
│   ├── counter.ts          # Implementation (illustrative — non-normative)
│   ├── contract.test.ts    # Contract loading tests
│   ├── counter.test.ts     # Boundary conformance tests
│   ├── server.ts           # MCP server (projected from contract)
│   └── server.test.ts      # MCP boundary conformance tests
├── examples/
│   ├── increment.json      # Successful operation example
│   └── overflow.json       # Error boundary example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
