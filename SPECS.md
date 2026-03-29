# SPECS.md — Contract-Driven Design Philosophy

## 1. Purpose

This repository defines a software philosophy with one governing rule:

> **We do not judge how you build. We enforce what you commit to.**

The observable behavior of a component at its boundary must honor the declared contract. Everything inside the boundary is non-normative.

---

## 2. Core Thesis

A system is not agent-friendly because it has good code.
A system is agent-friendly because behavior is explicit at the boundary.

If behavior is implicit — hidden in implementation details, tribal conventions, inferred from tests — agents must read source code.

If behavior is explicit in a contract at the boundary — agents reason from the contract alone.

### Root cause equation

```
Need-to-read-repo = hidden behavior + boundary leaks + undefined failures
```

Design goal: drive all three terms toward zero.

---

## 3. The Boundary Rule

This is the single normative statement of this philosophy:

> **Observable behavior at the component boundary must conform to the declared contract version.**

What this does and does not say:

| Inside the boundary | Outside the boundary |
|---|---|
| Not our concern | Fully enforced |
| Any code style | Declared input schema |
| Any algorithm | Declared output shape |
| Any level of mess | Declared error taxonomy |
| Any internal pattern | Declared side effects |
| No judgment | Declared annotations |

The framework never asks "is your code clean?"

It only asks one question: **did you honor your commitments?**

---

## 4. Two-Layer Model

### 4.1 Agent-First Driven Design (AFDD)

The architecture principle:

- The primary consumer of system capabilities is an autonomous agent.
- Capability boundaries must be discoverable and machine-readable.
- Agents reason from contracts, not source code.
- Human readability is valuable but not the integration bottleneck.

### 4.2 Contract-Driven Components (CDC)

The implementation mechanism:

- Every component declares a canonical contract (`*.component.yml`).
- The contract is the source of truth for boundary behavior.
- Implementation details are non-normative unless they alter boundary behavior.
- Generated interfaces (MCP/OpenAPI/SDK stubs) are projections of the contract.

AFDD without CDC is ideology.  
CDC without AFDD is overhead.  
Both are required.

---

## 5. Contract Requirements

### 5.1 Mandatory deliverables

A component is only deployable with:

1. **Canonical contract** — `component-name.component.yml`
2. **Boundary conformance evidence** — tests that verify the contract is honored

Implementation strategy, code structure, internal test coverage — these are the developer's concern, not the framework's.

### 5.2 Required contract fields

A valid contract MUST declare:

- `component`, `version`, `kind` — identity
- `description`, `instructions` — agent-facing semantics
- `input` schema per operation — what the boundary accepts
- `output` schema — what the boundary returns
- `errors` — typed, exhaustive failure taxonomy with retryability
- `policies` — timeout, idempotency, and behavioral policies
- `sideEffects.allowed` and `sideEffects.forbidden` — external effect permissions
- `guarantees.success` and `guarantees.failure` — behavioral commitments
- `annotations` per operation — readOnly, destructive, idempotent, openWorld

### 5.3 Contract authority

The contract is authoritative.

When behavior observed at the boundary diverges from the contract, the component is non-conformant — regardless of what the implementation intends.

---

## 6. MCP-Native Projection

Every contract-driven component is projectable into an MCP server surface.

### 6.1 Projection rule

| Contract field | MCP projection |
|---|---|
| Operations | Tools |
| Instructions / examples | Prompts |
| Contract artifact / state | Resources |
| Error taxonomy | Structured error payloads |
| Annotations | Tool metadata hints |

### 6.2 Authority rule

MCP is a runtime projection. It is not the authority.

```
counter.component.yml  →  [projected as]  →  MCP server
```

Changing the MCP surface without changing the contract is a violation.  
The contract drives the projection, never the reverse.

---

## 7. Behavioral Commitments

Schema-only contracts are insufficient.

A contract must commit to behavior beyond shape:

- invariants that always hold on success
- explicit failure semantics and retryability per error code
- state transition constraints for stateful components
- side-effect boundaries (what the component is and is not permitted to do)

### 7.1 Failure determinism

All expected failures MUST be represented by declared error codes.

An undeclared error escaping the component boundary is a contract violation.

### 7.2 State safety

For stateful components:

- invalid transitions MUST fail explicitly
- failure paths MUST NOT mutate state unless explicitly declared

---

## 8. Versioning

### 8.1 SemVer rule

Contracts MUST use semantic versioning.

- **Patch** — non-behavioral fixes
- **Minor** — backward-compatible additions
- **Major** — breaking boundary changes

### 8.2 Breaking change examples

- removing or renaming required input fields
- changing output semantics for existing operations
- altering declared error meaning or retryability
- widening side effects (new external writes)

### 8.3 CI gate

Contract diffs MUST be classified automatically.  
Merges are blocked when version bump and change type are inconsistent.

---

## 9. Boundary Conformance Evidence

A component is not deployable without evidence that its boundary honors its contract.

Conformance evidence MUST verify:

1. **Input boundary** — declared schema is enforced; invalid inputs are rejected
2. **Output boundary** — declared output shape is always produced on success
3. **Error boundary** — only declared error codes escape; retryability is accurate
4. **Side-effect boundary** — declared allowed/forbidden side effects are respected
5. **State boundary** — state is never mutated on failure (where declared)

**What conformance evidence does NOT require:**

- Internal unit tests
- Code coverage metrics
- Style or quality checks
- Any assertion about how the component is implemented

---

## 10. Governance

### 10.1 Capability minimization

Agents receive the minimum capability set required for task completion.

### 10.2 Side-effect transparency

Every external side effect must be declared before deployment.

An undeclared external call is a contract violation, not a code style issue.

### 10.3 Auditability

Agent actions must be reconstructible from:

- selected capability
- contract version
- inputs
- output or error
- policy decisions

---

## 11. Complexity discipline

This philosophy must remain operationally lightweight.

The developer's experience should feel like:

- write the contract
- write the implementation (however you like)
- run one conformance check
- ship

If adoption requires framework-heavy ceremony, the model has failed.

---

## 12. Reference implementation

`counter-component/` demonstrates boundary enforcement in practice:

- operations, errors, and state declared in contract
- MCP surface projected from contract
- boundary conformance tests prove commitments are honored
- implementation internals are illustrative — not normative

Future components only need to honor their contract.  
How they do it is their business.

---

## 13. Non-negotiable rules

1. No component ships without a contract.
2. No contract without boundary conformance evidence.
3. No undeclared error codes at the boundary.
4. No undeclared side effects.
5. No breaking changes without a major version bump.
6. No MCP surface that contradicts the contract.
7. No "done" without conformance evidence passing.

---

## 14. Terminology

| Term | Definition |
|---|---|
| **Boundary** | The observable interface between a component and its consumers |
| **Contract** | Declared behavioral commitments at the boundary |
| **Conformance** | Evidence that boundary behavior matches declared contract |
| **Projection** | Generated interface derived from contract (e.g. MCP server) |
| **Contract drift** | Divergence between declared and observed boundary behavior |
| **Blackbox guarantee** | Boundary behavior inferable from contract alone, without reading internals |

---

## 15. Core principle

We do not judge how you build.

We enforce what you commit to.

Inside the boundary: freedom.  
At the boundary: absolute accountability.

**Commitments win.**
