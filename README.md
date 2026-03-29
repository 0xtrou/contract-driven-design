# Contract-Driven Design — Philosophy

> **We don't judge how you build. We enforce what you commit to.**

---

## The Problem

Everyone who touches your code — humans, agents, CI pipelines, documentation tools — currently *infers* what a component does.

They read source code. They trace dependencies. They guess at error behavior. They build mental models that may be wrong.

Those models diverge. Drift accumulates. Trust erodes.

---

## The Solution

**Every component publishes a contract.**

One file. Machine-readable. Behavioral commitments declared at the boundary.

Consumers read the contract — not the source code. The contract becomes the single source of truth for *all* consumers equally. There is no primary consumer. There is only the contract.

---

## Core Beliefs

### 1. Boundaries over internals

What happens inside your component is your business. How you structure code, what patterns you use, how clean or messy it is — none of that is our concern.

What happens *at the boundary* is everyone's concern. That's where commitments live. That's where enforcement happens.

### 2. Contracts benefit everyone

Agents use contracts to avoid source-code archaeology.  
Humans use contracts as living documentation that never goes stale.  
CI uses contracts as the gate for deployment.  
Runtime systems use contracts to validate behavior on the fly.

The same artifact serves every consumer. No divergence. No drift.

### 3. Verifiable vs aspirational

Some guarantees can be mechanically tested. Others rely on convention, review, or runtime wrapping.

We distinguish them explicitly. Verifiable guarantees link to tests. Aspirational guarantees declare their enforcement mechanism.

Both matter. Honesty about which is which matters more.

### 4. Composition is declarative

Components depend on other components. The contract declares those dependencies and which guarantees from the dependency contract are assumed.

This creates a computable trust graph. Agents can traverse it. Humans can reason about it.

### 5. Protocol-agnostic, not protocol-locked

The contract is the authority. MCP, OpenAPI, gRPC, CLI, SDK — these are all *projections* of the contract into a runtime protocol.

The contract drives the projection. Never the reverse.

---

## The Equation

```
Total consumer cost = contract reading cost +
                      residual hidden behavior +
                      boundary leaks +
                      undefined failures
```

The design goal is to minimize all four terms:

- **Contract reading cost** — keep contracts short (2-minute rule)
- **Residual hidden behavior** — declare it or it doesn't exist
- **Boundary leaks** — enforce the boundary mechanically
- **Undefined failures** — every failure has a declared error code

---

## What Is a Component?

A component is the smallest unit that owns its own **state lifecycle** and **error boundary**.

If two operations share state and their failures can affect each other — they are one component.  
If they don't — they are separate components.

**Correct:** `increment`, `decrement`, `get`, `reset` are one component (shared counter state).  
**Anti-pattern:** One mega-contract per service.  
**Anti-pattern:** One contract per function.

---

## Development Paths

You can write contracts in two ways. Both are valid.

### Contract-first path

1. Draft the contract
2. Implement to match it
3. Run conformance
4. Iterate if gaps found

### Extraction path

1. Write implementation
2. Extract contract from observed behavior
3. Run conformance + close gaps
4. Stabilize contract

The conformance gate is identical for both paths. The spec does not judge how you arrive at the contract — only that you honor it.

---

## The Release Gate

A component is not done unless:

- contract exists
- conformance tests pass (programmatically loading the contract)
- projection surfaces match the contract
- verifiable guarantees have linked tests
- aspirational guarantees declare enforcement mechanisms

This is the quality gate. Everything else is optional.

---

## What Is "Behavior"?

Behavior is observable boundary semantics across:

1. **Input acceptance** — what the boundary accepts or rejects
2. **Output shape** — what the boundary returns on success
3. **Error taxonomy** — what error codes escape, with retryability
4. **Side-effect set** — what external systems the component may touch
5. **State transitions** — how state changes (for stateful components)
6. **Timing/resource guarantees** — only if declared in policies
7. **Determinism scope** — whether repeated calls produce identical outputs (if declared)

Anything not declared here is out of scope unless explicitly added.

---

## Complexity Discipline

If your contract is longer than your implementation, you have over-specified.  
If a consumer cannot read your contract in under 2 minutes, you have over-specified.  
If an agent cannot parse your contract in one pass, you have under-structured it.

The goal is lightweight, not ceremonial.

---

## The Core Rule

> Observable behavior at the component boundary must conform to the declared contract.

Inside the boundary: freedom.  
At the boundary: accountability.

**Commitments win.**

---

## Specification

The normative specification lives in [`SPEC.md`](./SPEC.md).

That document contains:
- JSON Schema for contract validation
- MUST / MUST NOT conformance language
- Precise projection rules
- Conformance test requirements

This document is philosophy. That document is specification.

---

## Quick Start

```bash
cd counter-component
npm install
npm test              # boundary conformance suite
npm run start:stdio   # run as MCP server (reference projection)
```

Read the contract: `cat counter-component/counter.component.yml`  
Read the full spec: [`SPEC.md`](./SPEC.md)

---

## Acknowledgments

- [Design by Contract](https://en.wikipedia.org/wiki/Design_by_contract) — Bertrand Meyer
- [Model Context Protocol](https://modelcontextprotocol.io) — Anthropic
- [Clarity Language](https://docs.stacks.co/clarity/overview) — decidability as design principle
- [Pact](https://docs.pact.io) — consumer-driven contract testing
- [Semantic Versioning](https://semver.org) — standard versioning model

---

MIT License
