# Counter Component

A reference implementation of a **contract-driven** component.

The internals are intentionally unremarkable. The point is the boundary.

---

## Quick Start

```bash
npm install
npm test              # boundary conformance suite
npm run start:stdio   # run as MCP server (reference projection)
```

---

## Contract

Boundary commitments declared in [`counter.component.yml`](./counter.component.yml).

This is the only normative artifact. It defines:

- **Operations**: `increment`, `decrement`, `get`, `reset`
- **Output**: `{ value: integer }` on every successful call
- **Errors**: `COUNTER_OVERFLOW`, `COUNTER_UNDERFLOW` — typed, with retryability
- **Side effects**: none permitted
- **Verifiable guarantees**: tested and linked to specific test cases
- **Aspirational guarantees**: maintained by convention + enforcement mechanism declared

Internals are free to change. The contract is not.

---

## Protocol Projection (MCP)

The component projects into an MCP server as the reference projection:

### Tools (from contract operations)

| Tool | Contract operation |
|------|--------------------|
| `counter_increment` | `increment` |
| `counter_decrement` | `decrement` |
| `counter_get` | `get` |
| `counter_reset` | `reset` |

### Resources

| URI | Content |
|-----|---------|
| `counter://contract` | Canonical YAML contract |
| `counter://state` | Current boundary-observable state |

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

| File | What it proves |
|------|----------------|
| `contract.test.ts` | Contract loads, parses, and contains expected structure |
| `counter.test.ts` | Boundary commitments hold: output shape, error codes, guarantees |
| `server.test.ts` | Protocol projection matches contract: tools, annotations, resources |

---

## File Structure

```
counter-component/
├── counter.component.yml   # Canonical contract — only normative file
├── src/
│   ├── contract.ts         # Loads, validates, and projects the contract
│   ├── types.ts            # TypeScript types for contract shape
│   ├── counter.ts          # Implementation (non-normative)
│   ├── contract.test.ts    # Contract loading tests
│   ├── counter.test.ts     # Boundary conformance tests
│   ├── server.ts           # MCP server (reference projection)
│   └── server.test.ts      # MCP boundary conformance tests
├── examples/
│   ├── increment.json
│   └── overflow.json
├── package.json
├── tsconfig.json
└── vitest.config.ts
```
