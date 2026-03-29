# Contract-Driven Design

> **We don't judge how you build. We enforce what you commit to.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

Consumers of a component — humans, agents, CI pipelines, documentation systems — currently infer behavior from source code.

```
┌─────────────────────────────────────────────────────────┐
│  Consumer needs to understand "capturePayment()"        │
│                                                         │
│  ❌ Without a contract:                                 │
│     → read implementation                               │
│     → trace dependencies                                │
│     → infer error behavior                              │
│     → hope nothing is hidden                            │
│     → build a mental model that may be wrong            │
└─────────────────────────────────────────────────────────┘
```

---

## The Solution

**Every component commits to a contract.** Behavior is explicit at the boundary.

```
┌─────────────────────────────────────────────────────────┐
│  Consumer needs to understand "CapturePaymentComponent" │
│                                                         │
│  ✅ With a contract:                                    │
│     → read component.yml (one file)                     │
│     → know inputs, outputs, errors, side effects        │
│     → know which guarantees are tested vs aspirational  │
│     → know composition dependencies                     │
│     → source reading is not required                    │
└─────────────────────────────────────────────────────────┘
```

Contracts benefit every consumer equally. There is no primary consumer — there is only the contract.

---

## The Core Rule

> Observable behavior at the component boundary must conform to the declared contract.

| Inside the component | At the boundary |
|---|---|
| Any code style | Declared input schema |
| Any algorithm | Declared output shape |
| Any level of mess | Declared error taxonomy |
| No judgment | Declared side effects and guarantees |

**We judge commitments. Not internals.**

---

## Key Concepts

| Concept | What it means |
|---|---|
| **Contract-first** | The contract is the single source of truth for all consumers |
| **Boundary enforcement** | Only boundary behavior is judged — internals are free |
| **Split guarantees** | Verifiable (tested) vs aspirational (convention-enforced) |
| **Composition model** | `requires` declares dependency contracts and assumed guarantees |
| **Protocol-projectable** | MCP, OpenAPI, gRPC, CLI, SDK — all derived from contract |
| **Component granularity** | Smallest unit that owns its own state lifecycle and error boundary |
| **Contract cost** | Readable in <2 min, shorter than the implementation |

---

## Quick Start

```bash
cd counter-component
npm install
npm test              # boundary conformance suite
npm run start:stdio   # run as MCP server (reference projection)
```

Full philosophy: [`SPECS.md`](./SPECS.md)

---

## Contract Anatomy

```yaml
spec_version: 1.0.0
component: CounterComponent
version: 1.0.0
kind: stateful

input:
  increment:
    type: object
    properties:
      amount: { type: integer, minimum: 1 }

output:
  type: object
  required: [value]
  properties:
    value: { type: integer }

errors:
  COUNTER_OVERFLOW:
    retryable: false
    description: Increment would exceed maximum value

sideEffects:
  allowed: []
  forbidden: [network, filesystem, database]

guarantees:
  verifiable:
    - operation: get
      assertion: state_unchanged_after_call
      test: counter.test.ts#get_does_not_change_observable_value
  aspirational:
    - statement: "only declared error codes cross the boundary"
      enforcement: catch-all error wrapper + error taxonomy test

annotations:
  get:
    readOnly: true
    idempotent: true
    destructive: false
    openWorld: false
```

---

## Why This Matters

- **For humans** — contracts are the map; internals can change freely if the boundary holds
- **For agents** — read 1 file, know all commitments; no source crawling
- **For CI** — conformance check is one command; drift is mechanically prevented
- **For documentation** — the contract IS the docs; always current, never stale

---

## Protocol Projections

The contract is protocol-agnostic. It projects into any runtime interface:

| Protocol | Projection |
|---|---|
| MCP | Tools, resources, prompts |
| OpenAPI | Paths, schemas, error responses |
| gRPC | Services, messages |
| CLI | Commands, flags, exit codes |
| SDK | Typed functions, error classes |

MCP is the reference projection in this repo. It is not the required projection.

---

## Roadmap

- [ ] `cddc check` — contract conformance CLI
- [ ] Breaking-change classifier for CI
- [ ] `defineComponent()` — typed contract binding API
- [ ] Contract registry / dependency resolution
- [ ] `kind: streaming` and `kind: async` reference components

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

- [Design by Contract](https://en.wikipedia.org/wiki/Design_by_contract) — Bertrand Meyer
- [Model Context Protocol](https://modelcontextprotocol.io) — Anthropic
- [Clarity Language](https://docs.stacks.co/clarity/overview) — decidability as design principle
- [Pact](https://docs.pact.io) — consumer-driven contract testing
