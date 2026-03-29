spec_version: 1.0.0

# SPECS.md — Contract-Driven Design

---

## 1. Purpose

This repository defines a philosophy with one governing rule:

> **We do not judge how you build. We enforce what you commit to.**

Observable behavior at a component boundary must honor the declared contract. Everything inside the boundary is non-normative. Every consumer — human, agent, CI pipeline, documentation system, runtime validator — reasons from the contract. There is no primary consumer; there is only the contract.

---

## 2. Core Thesis

A system is not trustworthy because it has good code.

A system is trustworthy because behavior is explicit and verifiable at the boundary.

If behavior is implicit — hidden in implementation details, inferred from tests, described only in prose — every consumer must develop its own mental model of what the component does. Those models diverge. Drift accumulates silently.

Contracts eliminate this. A contract is a machine-readable behavioral commitment that any consumer can read, validate against, and reason from.

### Root cause equation

```
Need-to-infer-behavior = hidden behavior + boundary leaks + undefined failures
```

Design goal: drive all three terms toward zero.

---

## 3. The Boundary Rule

> **Observable behavior at the component boundary must conform to the declared contract version.**

| Inside the boundary | At the boundary |
|---|---|
| Any code style | Declared input schema — enforced |
| Any algorithm | Declared output shape — enforced |
| Any level of mess | Declared error taxonomy — enforced |
| Any internal pattern | Declared side effects — enforced |
| No judgment | Declared annotations — enforced |

The only question the framework ever asks: **did you honor your commitments?**

If yes: ship it.
If no: blocked.

---

## 4. Contract-Driven Components

Every component declares a canonical contract (`*.component.yml`). This is the single source of truth for what the component does at its boundary.

- Implementation details are non-normative unless they alter boundary behavior.
- Tests are conformance evidence, not specification.
- Generated interfaces (protocol projections) are derived outputs, not source of truth.
- Composition dependencies are declared in the contract, not inferred from code.

The contract authority rule: when behavior observed at the boundary diverges from the contract, the component is non-conformant — regardless of implementation intent.

---

## 5. What Defines a Component

A component is the smallest unit that owns its own **state lifecycle** and **error boundary**.

The test: if two operations share state and their errors can affect each other, they belong to the same component. If they don't, they are separate components.

**Correct granularity:**
- `increment`, `decrement`, `get`, `reset` share counter state — one component.
- A payment capture and a refund have separate failure modes and state — two components.

**Anti-patterns:**
- One mega-contract per service — over-aggregation obscures boundaries.
- One contract per function — under-aggregation eliminates meaningful error/state ownership.

**Cost check:** a contract should be readable in under 2 minutes and shorter than the implementation it describes. If your contract is longer than your source code, you have over-specified. If a consumer cannot parse it in one pass, you have under-structured it.

---

## 6. Contract Requirements

### 6.1 Mandatory deliverables

A component is only deployable with:

1. **Canonical contract** — `component-name.component.yml`
2. **Boundary conformance evidence** — tests that programmatically verify the contract is honored

Everything else (implementation strategy, internal tests, code coverage, style) is the developer's concern.

### 6.2 Required contract fields

```yaml
spec_version: 1.0.0          # which spec version this contract targets
component: ComponentName
version: 1.0.0
kind: stateless | stateful | async | streaming

description: ...
instructions: ...

input:
  operation_name:
    type: object
    properties: { ... }
    required: [ ... ]

output: ...

errors:
  ERROR_CODE:
    retryable: true | false
    description: ...

policies:
  idempotency: required | not-required
  timeoutMs: 3000

sideEffects:
  allowed: [ ... ]
  forbidden: [ ... ]

guarantees:
  verifiable:
    - operation: operation_name
      assertion: what_is_tested
      test: test_file.ts#test_name
  aspirational:
    - "statement about expected behavior"
      enforcement: how this is maintained (runtime, review, convention)

annotations:
  operation_name:
    readOnly: true | false
    destructive: true | false
    idempotent: true | false
    openWorld: true | false
```

Optional:
```yaml
requires:
  - component: DependencyName
    version: ">=1.0.0"
    guarantees_assumed:
      - "guarantee from dependency contract this component relies on"
```

### 6.3 Contract authority

The contract is authoritative. When observed boundary behavior diverges from the contract, the component is non-conformant.

### 6.4 Spec version binding

Every contract declares the `spec_version` it was written against. When this spec changes in a backward-incompatible way, existing contracts targeting older spec versions remain valid under their declared version.

---

## 7. Component Kinds

### `kind: stateless`
No shared state between invocations. All inputs produce deterministic outputs.

### `kind: stateful`
Maintains internal state across invocations. Contract must declare `state` shape and default values. Failure paths must not mutate state unless explicitly declared.

### `kind: async`
Operations return immediately and complete asynchronously. Contract must declare job/task reference type and final result shape.

```yaml
kind: async

output:
  immediate:
    type: object
    properties:
      jobId: { type: string }
  final:
    type: object
    properties:
      result: { type: string }
      status: { type: string, enum: [success, failed] }
```

### `kind: streaming`
Operations produce incremental output over time. Contract must declare chunk shape and final shape.

```yaml
kind: streaming

output:
  stream:
    chunk_type: object
    properties:
      line: { type: string }
      stream: { type: string, enum: [stdout, stderr] }
  final:
    type: object
    properties:
      exitCode: { type: integer }

cancellation:
  supported: true
  guarantees:
    verifiable:
      - operation: cancel
        assertion: no_new_chunks_after_cancel
    aspirational:
      - "remote process is terminated on cancel"
        enforcement: runtime signal handler
```

---

## 8. Behavioral Guarantees

Schema-only contracts are insufficient. A contract must commit to behavioral semantics beyond shape.

Guarantees are split into two categories with different enforcement obligations.

### 8.1 Verifiable guarantees

Verifiable guarantees can be mechanically tested. Every verifiable guarantee MUST have a corresponding conformance test.

```yaml
guarantees:
  verifiable:
    - operation: get
      assertion: state_unchanged_after_call
      test: counter.contract.test.ts#get_does_not_modify
    - operation: reset
      assertion: value_is_zero_after_call
      test: counter.contract.test.ts#reset_sets_zero
```

If a verifiable guarantee has no test, conformance evidence is incomplete.

### 8.2 Aspirational guarantees

Aspirational guarantees describe expected behavior that cannot be exhaustively proven by test. They MUST declare their enforcement mechanism.

```yaml
guarantees:
  aspirational:
    - statement: "only declared error codes cross the boundary"
      enforcement: catch-all error wrapper in boundary layer
    - statement: "no undeclared network calls are made"
      enforcement: review + side-effect declaration process
```

Aspirational guarantees are not weaker. They are honest about what kind of verification is possible.

### 8.3 Failure determinism

All expected failures MUST be represented by declared error codes. An undeclared error escaping the boundary is a conformance violation regardless of whether it was tested.

---

## 9. Composition

Components compose. A contract may declare dependencies on other contracts.

```yaml
requires:
  - component: SSHConnectionPool
    version: ">=1.0.0"
    guarantees_assumed:
      - "connection is authenticated before use"
      - "connection timeout is enforced"
```

### 9.1 Trust boundary semantics

`guarantees_assumed` declares which guarantees from the dependency contract this component relies on.

If the dependency's contract changes such that an assumed guarantee no longer holds, the dependent component's conformance is at risk. This creates a computable dependency graph for contract compatibility.

### 9.2 Composition rule

A component is only as reliable as its weakest declared dependency guarantee.

Agents reading a component contract can immediately identify which other contracts they also need to read — and which specific guarantees form the trust boundary between them.

### 9.3 Circular dependency prohibition

A contract must not declare a circular dependency chain. `requires` is a directed acyclic graph.

---

## 10. Protocol Projections

A contract-driven component is projectable into any protocol interface. The contract is protocol-agnostic.

### 10.1 Available projections (examples)

| Protocol | Projection |
|---|---|
| MCP | Tools, resources, prompts, error payloads |
| OpenAPI | Paths, request/response schemas, error responses |
| gRPC | Service definitions, message types |
| CLI | Commands, flags, exit codes |
| SDK | Typed functions, error classes |

### 10.2 Projection rule

Every projection MUST be derived from the contract. No projection field may contradict or extend the contract without a contract change.

```
component.yml  →  [projected as]  →  MCP server
               →  [projected as]  →  OpenAPI spec
               →  [projected as]  →  TypeScript SDK
```

### 10.3 Reference projection

MCP is the reference projection in this repository. It is not the required projection. Systems not using MCP may project contracts into whichever protocol suits their stack.

---

## 11. Boundary Conformance Evidence

### 11.1 Mandatory pattern

Every component's boundary conformance test suite MUST:

1. **Programmatically load the YAML contract** — not hardcode expected values
2. **Assert operation parity** — every contract operation has a corresponding test
3. **Assert error taxonomy** — thrown codes are members of `contract.errors`
4. **Assert retryability accuracy** — thrown error retryable flags match contract
5. **Assert output shape** — every success response matches declared output schema
6. **Assert verifiable guarantees** — every verifiable guarantee has a corresponding test case

What conformance tests must NOT do:
- Assert implementation internals (algorithm choices, internal state representation)
- Assert code quality or style
- Use hardcoded expected values that duplicate the contract

### 11.2 Contract drift prevention

Drift prevention is not a convention — it is a mechanical requirement.

Conformance tests that load the contract programmatically are the mechanism. If the contract changes and the test does not, the test fails. If the test passes without reading the contract, it is not a conformance test.

---

## 12. Versioning

### 12.1 SemVer rule

Contracts MUST use semantic versioning.

- **Patch** — non-behavioral fixes (documentation, description wording)
- **Minor** — backward-compatible additions (new optional fields, new operations)
- **Major** — breaking boundary changes

### 12.2 Breaking change definition

A breaking change is any modification that invalidates a consumer's existing understanding of the boundary:

- removing or renaming required input fields
- changing output semantics for existing operations
- altering declared error meaning or retryability
- widening side effects (new external writes)
- removing operations
- narrowing assumed guarantees in `requires`

### 12.3 CI gate

Contract diffs must be automatically classified against this breaking change definition. Merges where the version bump does not match the change type are blocked.

---

## 13. Governance

### 13.1 Side-effect transparency

Every external side effect must be declared before deployment. An undeclared external call is a conformance violation, not a code style issue.

### 13.2 Auditability

Any consumer — human or automated — must be able to reconstruct what happened from:

- selected capability + contract version
- inputs
- output or error code
- retryability decision

---

## 14. Complexity discipline

The developer experience must remain lightweight:

1. Write the contract
2. Write the implementation (however you like)
3. Run `contract check` — one command
4. Ship

If adoption requires heavy framework ceremony, the philosophy has failed.

A contract longer than its implementation has failed.
A contract an agent cannot parse in one pass has failed.

---

## 15. Reference implementation

`counter-component/` demonstrates the model in practice:

- operations, errors, and state declared in contract
- guarantees split into verifiable (with test references) and aspirational (with enforcement declarations)
- boundary conformance tests programmatically load the contract YAML
- protocol projection derived from contract (MCP as reference projection)
- implementation internals are illustrative — not normative

---

## 16. Terminology

| Term | Definition |
|---|---|
| **Boundary** | The observable interface between a component and its consumers |
| **Contract** | Declared behavioral commitments at the boundary |
| **Conformance** | Evidence that boundary behavior matches declared contract |
| **Projection** | Interface derived from contract targeting a specific protocol |
| **Contract drift** | Divergence between declared and observed boundary behavior |
| **Verifiable guarantee** | A behavioral commitment that can be mechanically tested |
| **Aspirational guarantee** | A behavioral commitment maintained by convention or runtime wrapping |
| **Trust boundary** | The set of dependency guarantees a component assumes will hold |

---

## Core principle

Inside the boundary: freedom.
At the boundary: accountability.

The contract is the law.
Contracts benefit every consumer equally — humans, agents, CI, documentation, runtime.

**Commitments win.**
