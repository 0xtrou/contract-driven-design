# Contract-Driven Design

> **Build software where agents are the primary consumer.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

AI agents currently need to **read entire codebases** to understand behavior.

```
┌─────────────────────────────────────────────────────────┐
│  Agent needs to understand "capturePayment()"           │
│                                                         │
│  ❌ Current approach:                                   │
│     → grep for function                                 │
│     → read implementation                               │
│     → trace dependencies                                │
│     → infer error behavior                              │
│     → hope nothing is hidden                            │
└─────────────────────────────────────────────────────────┘
```

This is fragile, token-expensive, and unreliable.

---

## The Solution

**Every component publishes a contract.** Behavior is explicit at the boundary.

```
┌─────────────────────────────────────────────────────────┐
│  Agent needs to understand "CapturePaymentComponent"    │
│                                                         │
│  ✅ Contract-driven approach:                           │
│     → read component.yml (one file)                     │
│     → know inputs, outputs, errors                      │
│     → know side effects & guarantees                    │
│     → no source reading required                        │
└─────────────────────────────────────────────────────────┘
```

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Contract-First** | Define behavior before implementation |
| **Blackbox Guarantees** | Interface alone is sufficient |
| **MCP-Native** | Every component is an MCP server |
| **Executable Specs** | Contracts are machine-readable YAML |
| **Zero Hidden State** | All side effects are declared |

---

## Equation

```
Need-to-read-repo = hidden behavior + boundary leaks + undefined failures
```

**Design goal:** drive all three terms toward zero.

---

## Quick Start

### 1. Read the Spec

The full philosophy lives in [`SPECS.md`](./SPECS.md).

### 2. Study the Reference

`counter-component/` is a minimal working example:

```bash
cd counter-component
npm install
npm test        # 28 tests pass
npm run build   # zero type errors
```

### 3. Run as MCP Server

```bash
npm run start:stdio
```

The component exposes:
- 4 tools: `counter_increment`, `counter_decrement`, `counter_get`, `counter_reset`
- 2 resources: `counter://contract`, `counter://state`

---

## What's Inside

```
.
├── SPECS.md                    # Full philosophy & specification
├── counter-component/          # Reference implementation
│   ├── counter.component.yml   # Canonical contract
│   ├── src/
│   │   ├── types.ts            # TypeScript types from contract
│   │   ├── counter.ts          # Core logic
│   │   ├── counter.test.ts     # Unit tests
│   │   ├── server.ts           # MCP server
│   │   └── server.test.ts      # MCP conformance tests
│   ├── examples/               # Golden input/output pairs
│   └── README.md               # Component docs
└── README.md                   # You are here
```

---

## Contract Anatomy

A minimal contract (`*.component.yml`):

```yaml
component: CounterComponent
version: 1.0.0
kind: stateful

input:
  increment:
    type: object
    properties:
      amount:
        type: integer
        minimum: 1

output:
  type: object
  required: [value]
  properties:
    value:
      type: integer

errors:
  COUNTER_OVERFLOW:
    retryable: false
    description: Increment would exceed maximum value

sideEffects:
  allowed: []
  forbidden:
    - network
    - filesystem
    - database

guarantees:
  success:
    - output.value is always an integer
    - get never modifies state
    - reset always sets value to 0
  failure:
    - state is never modified on error
    - only declared error codes may be returned
```

---

## Why This Matters

### For Agents

- **Token efficiency**: Read 1 file, not 100
- **Deterministic reasoning**: No hidden behavior
- **Capability discovery**: Tools are self-describing
- **Safe composition**: Boundaries are explicit

### For Humans

- **Faster onboarding**: Contracts are the map
- **Safer refactoring**: Breaking changes are visible
- **Better APIs**: Contracts force clarity
- **Living documentation**: Spec is executable

---

## Two-Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  Agent-First Driven Design (AFDD)                       │
│  "The primary consumer is an autonomous agent"          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Contract-Driven Components (CDC)                       │
│  "Every component has a canonical contract artifact"    │
└─────────────────────────────────────────────────────────┘
```

AFDD without CDC is ideology.
CDC without AFDD is overhead.
**Both are required.**

---

## MCP Projection

Every contract projects into an MCP server:

| Contract | → | MCP |
|----------|---|-----|
| Operations | → | Tools |
| Examples | → | Prompts |
| State/Contract | → | Resources |
| Errors | → | Structured payloads |

The contract is authority. MCP is projection.

---

## Non-Negotiable Rules

1. No component without a contract
2. No contract without tests
3. No hidden side effects
4. No undeclared error codes
5. No breaking changes without major version bump
6. No MCP surface that contradicts the contract
7. No "done" status without conformance evidence

---

## Roadmap

- [ ] Contract linter (`npx agent-contract check`)
- [ ] Breaking-change detector for CI
- [ ] More reference components (HTTP client, data transformer, workflow orchestrator)
- [ ] Contract registry prototype
- [ ] TypeScript contract → MCP code generator

---

## Philosophy

> Readable code is valuable.
> Readable contracts are mandatory.

For humans, code explains *how*.
For agents, contracts define *what is guaranteed*.

**In contract-driven design, guarantees win.**

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

## Acknowledgments

This work builds on:
- [Model Context Protocol](https://modelcontextprotocol.io) — Anthropic
- [Design by Contract](https://en.wikipedia.org/wiki/Design_by_contract) — Bertrand Meyer
- [Pact](https://docs.pact.io) — Consumer-driven contracts
- [OpenAPI](https://spec.openapis.org) — Interface definition

---

<div align="center">

**Contract-Driven Design**

*Built for agents. Readable by humans.*

</div>
