# Contract-Driven Design

> **We don't judge how you build. We enforce what you commit to.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

AI agents currently need to **read entire codebases** to understand behavior.

```
┌─────────────────────────────────────────────────────────┐
│  Agent needs to understand "capturePayment()"           │
│                                                         │
│  ❌ Without a contract:                                 │
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

**Every component commits to a contract.** Behavior is explicit at the boundary.

```
┌─────────────────────────────────────────────────────────┐
│  Agent needs to understand "CapturePaymentComponent"    │
│                                                         │
│  ✅ With a contract:                                    │
│     → read component.yml (one file)                     │
│     → know inputs, outputs, errors                      │
│     → know side effects & guarantees                    │
│     → source reading is not required                    │
└─────────────────────────────────────────────────────────┘
```

---

## The Core Rule

> Observable behavior at the component boundary must conform to the declared contract.

What this means in practice:

| Inside the component | At the boundary |
|---|---|
| Any code style | Declared input schema |
| Any algorithm | Declared output shape |
| Any level of mess | Declared error taxonomy |
| No judgment | Declared side effects |
| Completely free | Declared annotations |

**We judge commitments. Not internals.**

---

## Equation

```
Need-to-read-repo = hidden behavior + boundary leaks + undefined failures
```

Drive all three terms to zero. That's the whole philosophy.

---

## Quick Start

### 1. Read the Spec

Full philosophy in [`SPECS.md`](./SPECS.md).

### 2. Run the Reference

`counter-component/` is a working example:

```bash
cd counter-component
npm install
npm test           # boundary conformance suite
npm run start:stdio  # run as MCP server
```

### 3. Explore the MCP Surface

```bash
npm run start:stdio
```

Exposes:
- 4 tools: `counter_increment`, `counter_decrement`, `counter_get`, `counter_reset`
- 2 resources: `counter://contract`, `counter://state`
- 1 prompt: `counter_usage`

---

## What's Inside

```
.
├── SPECS.md                    # Full philosophy & specification
├── counter-component/          # Reference implementation
│   ├── counter.component.yml   # Canonical contract — source of truth
│   ├── src/
│   │   ├── contract.ts         # Contract loader & projection
│   │   ├── counter.ts          # Implementation (internals — non-normative)
│   │   ├── counter.test.ts     # Boundary conformance tests
│   │   ├── server.ts           # MCP server (projected from contract)
│   │   └── server.test.ts      # MCP boundary conformance tests
│   ├── examples/               # Input/output examples
│   └── README.md               # Component docs
└── README.md                   # You are here
```

---

## Contract Anatomy

The contract is the only normative artifact. Implementation is irrelevant.

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
    - output.value is always an integer within declared bounds
    - get never modifies state
    - reset always sets value to 0
  failure:
    - state is never modified on error
    - only declared error codes may be returned

annotations:
  get:
    readOnly: true
    destructive: false
    idempotent: true
    openWorld: false
```

---

## Why This Matters

### For Agents

- **Token efficiency** — read 1 file, not 100
- **Deterministic reasoning** — no hidden behavior
- **Safe consumption** — commitments are enforced, not hoped for
- **Composability** — boundaries are explicit

### For Humans

- **Faster onboarding** — the contract is the map
- **Safe refactoring** — internals can change freely if boundary holds
- **Breaking change detection** — diffs are classified automatically
- **No ceremony** — write contract, write anything, prove it works

---

## Two-Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  Agent-First Driven Design (AFDD)                       │
│  "Agents are the primary consumer"                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Contract-Driven Components (CDC)                       │
│  "Components commit to boundary contracts"              │
└─────────────────────────────────────────────────────────┘
```

AFDD without CDC is ideology.  
CDC without AFDD is overhead.  
**Both are required.**

---

## MCP Projection

Contracts project into MCP servers automatically:

| Contract | → | MCP |
|----------|---|-----|
| Operations | → | Tools |
| Instructions / Examples | → | Prompts |
| Contract artifact / State | → | Resources |
| Error taxonomy | → | Structured error payloads |
| Annotations | → | Tool metadata hints |

Contract is authority. MCP is projection.

---

## Non-Negotiable Rules

1. No component ships without a contract
2. No contract without boundary conformance evidence
3. No undeclared error codes at the boundary
4. No undeclared side effects
5. No breaking changes without a major version bump
6. No MCP surface that contradicts the contract
7. No "done" without conformance evidence passing

---

## Roadmap

- [ ] `cddc check` — contract conformance CLI
- [ ] Breaking-change classifier for CI
- [ ] `defineComponent()` — typed contract binding API
- [ ] Contract registry
- [ ] More reference components (effectful, workflow)

---

## Philosophy

Inside the boundary: build however you want.  
At the boundary: your commitments are law.

> **Commitments win.**

---

## License

MIT

---

## Acknowledgments

Builds on:
- [Model Context Protocol](https://modelcontextprotocol.io) — Anthropic
- [Design by Contract](https://en.wikipedia.org/wiki/Design_by_contract) — Bertrand Meyer
- [Clarity Language](https://docs.stacks.co/clarity/overview) — decidability as a design principle
- [Pact](https://docs.pact.io) — consumer-driven contract testing
