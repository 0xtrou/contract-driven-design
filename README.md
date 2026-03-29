# Contract-Driven Design — Philosophy

> **We don't judge how you build. We enforce what you commit to.**

---

## Why this exists

Software behavior is usually inferred from source code.
That creates drift between humans, agents, CI, and runtime behavior.

Contract-Driven Design replaces inference with explicit commitments:

- one contract file per component
- boundary behavior declared, not implied
- conformance proven mechanically

The contract is the source of truth for every consumer.

---

## Core principle

Inside the boundary: freedom.  
At the boundary: accountability.

You can write messy code, clean code, or any architecture you want.  
None of that is judged here.

Only one question matters:

> Did you honor your contract commitments at the boundary?

---

## What counts as a commitment

A contract declares boundary behavior for:

- accepted input shape
- produced output shape
- error taxonomy + retryability
- side-effect permissions
- state transition promises (if stateful)
- protocol projection expectations

Commitments can be:

- **Verifiable** — mechanically tested
- **Aspirational** — enforced by declared mechanism (wrapper, review, policy)

Both are explicit. Nothing is implicit.

---

## What this is not

- Not a style guide
- Not a clean-code manifesto
- Not an architecture doctrine
- Not agent-only framing

This is a boundary contract philosophy for all consumers equally.

---

## Reading order

1. **This README** — philosophy (why)
2. **[`SPEC.md`](./SPEC.md)** — normative rules (what)
3. **`counter-component/`** — reference implementation (how)

---

## Release truth

A component is not done when code "looks good."  
A component is done when conformance evidence passes.

**Commitments win.**

---

MIT License
