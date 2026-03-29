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

Boundary commitments are declared in [`counter.component.yml`](./counter.component.yml).

This is the only normative artifact for the component.

---

## Projection

This example uses MCP as a **reference projection** of the contract.

- tools are projected from contract operations
- annotations are projected from contract metadata
- contract/resource/prompt surfaces are derived from contract fields

---

## Conformance

Conformance is proven by tests that programmatically load the contract and verify boundary behavior.

```bash
npm test
```

---

## Read next

- Philosophy: [`../README.md`](../README.md)
- Normative rules: [`../SPEC.md`](../SPEC.md)
