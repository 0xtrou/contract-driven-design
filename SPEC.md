# SPEC.md — Contract-Driven Design Specification

**Spec Version:** `1.0.0`

This document is normative. `README.md` is philosophical context only.

---

## 1) Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** are to be interpreted as described in RFC 2119.

---

## 2) Conformance Statement

A component is **conformant** only if all of the following are true:

1. A contract file named `<component>.component.yml` exists.
2. That file validates against `schemas/component-contract.schema.json`.
3. Boundary conformance tests pass.
4. Projection outputs (MCP/OpenAPI/etc.) do not contradict the contract.

If any of the above fails, the component is non-conformant.

---

## 3) Boundary Rule

Only boundary behavior is normative.

- Internal implementation quality/style/architecture is out of scope.
- Observable behavior at the boundary MUST conform to contract commitments.

This spec does not judge internals; it enforces commitments.

---

## 4) Behavior Definition

For this spec, **behavior** means observable boundary semantics across:

1. Input acceptance/rejection
2. Output shape and meaning
3. Error codes and retryability
4. Side-effect set (what external systems may be touched)
5. State transitions (for stateful components)
6. Timing/resource guarantees (only if declared)
7. Determinism scope (only if declared)

Anything not declared in the contract is non-normative.

---

## 5) Release Gate (No-Claim Rule)

A component MUST NOT be marked releasable unless:

1. Contract exists and validates
2. Boundary conformance tests pass
3. Projection validity checks pass
4. All verifiable guarantees have linked passing tests
5. All aspirational guarantees declare enforcement mechanism

This is the quality gate.

---

## 6) Contract Schema (Normative)

The authoritative machine-parseable schema is:

`schemas/component-contract.schema.json`

Validation command (reference):

```bash
cddc validate <contract-file> --schema schemas/component-contract.schema.json
```

The YAML snippets below are explanatory only. The JSON Schema artifact is authoritative.

### 6.1 Required top-level fields

```yaml
spec_version: "1.0.0"
component: string
version: semver
kind: stateless | stateful | async | streaming

description: string
instructions: string

input: object
output: object
errors: object
policies: object
sideEffects: object
guarantees: object
annotations: object
```

### 6.2 Conditional requirements by kind

- `kind: stateful` → `state` block **MUST** exist
- `kind: async` → `async` block **MUST** exist
- `kind: streaming` → `stream` block **MUST** exist

---

## 7) Contract Authoring Paths

Both paths are valid and MUST satisfy the same release gate.

### 7.1 Contract-first path
1. Write contract
2. Implement component
3. Run conformance
4. Iterate

### 7.2 Contract-after (extraction) path
1. Implement component
2. Extract contract from observed boundary behavior
3. Run conformance
4. Fill uncovered commitments

Spec conformance is outcome-based, not process-based.

---

## 8) Component Granularity Rule

A component is the smallest unit that owns:

- its state lifecycle
- its error boundary

If operations share state and failures can influence each other, they MUST be in the same component.

Implementations MUST NOT:

- use one mega-contract for an entire service
- create one contract per trivial function

---

## 9) Guarantees Model

### 9.1 Verifiable guarantees
- MUST be mechanically testable
- MUST include linked test case (`test:`)

### 9.2 Aspirational guarantees
- MAY not be exhaustively provable
- MUST include explicit enforcement mechanism (`enforcement:`)

### 9.3 Error determinism
Undeclared error codes MUST NOT cross the boundary.

---

## 10) Lifecycle

Contracts MAY declare lifecycle:

```yaml
lifecycle:
  status: draft | stable | deprecated
```

Rules:

- `draft`: compatibility is not guaranteed
- `stable`: SemVer compatibility rules MUST be enforced
- `deprecated`: sunset/migration path SHOULD be declared

---

## 11) Composition

Contracts MAY declare dependencies with `requires`:

```yaml
requires:
  - component: SSHConnectionPool
    version: ">=1.0.0"
    guarantees_assumed:
      - "connection authenticated before use"
      - "connection timeout enforced"
    failurePolicy:
      mode: fail-closed | fail-open | degraded
      timeoutMs: 3000
      mapErrors:
        DEP_TIMEOUT: UPSTREAM_TIMEOUT
```

Rules:

- `guarantees_assumed` defines trust boundary between components
- Dependency failures observable at boundary MUST map to locally declared error codes
- Raw dependency/internal error codes MUST NOT cross boundary undeclared
- If `mode: degraded`, degraded behavior MUST be declared and tested

---

## 12) Projection Model

A projection is a deterministic transform from contract to protocol interface.

Supported targets MAY include MCP, OpenAPI, gRPC, CLI, SDK.

Projection implementation MUST declare whether mapping is:

- **lossless** (all semantics preserved), or
- **lossy** (some semantics externalized/dropped)

If projection is lossy, implementation MUST document:

1. dropped contract fields
2. fallback encoding strategy (resource metadata, docs, wrappers, etc.)

MCP is a reference projection in this repository, not a required protocol.

---

## 13) Drift Prevention

Contract drift prevention is mandatory.

Boundary conformance tests MUST:

1. Programmatically load the YAML contract
2. Assert operation parity
3. Assert output/error conformance
4. Assert guarantee linkage

Tests that pass without reading the contract are NOT conformance tests.

---

## 14) Versioning

Stable contracts MUST use SemVer.

Breaking changes include (non-exhaustive):

- removing/renaming required input fields
- changing output semantics
- changing error meaning/retryability
- widening side effects
- removing operations
- narrowing assumed dependency guarantees

CI SHOULD block merges when version bump does not match change type.

---

## 15) Cost Discipline

Contract quality MUST balance precision and readability:

- SHOULD be readable in under ~2 minutes
- SHOULD be shorter than implementation it describes
- MUST remain machine-parseable in one pass

This preserves low contract reading cost while enforcing boundary guarantees.

---

## Appendix A — Normative Examples

### A.1 Minimal conformant stateful contract

```yaml
spec_version: "1.0.0"
component: CounterComponent
version: 1.0.0
kind: stateful

lifecycle:
  status: stable
  since: "2026-03-29"

description: "Bounded integer counter"
instructions: "Use get before increment/decrement"

input:
  increment:
    type: object
    additionalProperties: false
    properties:
      amount:
        type: integer
        minimum: 1
        default: 1
    required: []

output:
  type: object
  additionalProperties: false
  properties:
    value:
      type: integer
  required: [value]

state:
  type: object
  properties:
    value: { type: integer, default: 0 }
    min: { type: integer, default: -2147483648 }
    max: { type: integer, default: 2147483647 }

errors:
  COUNTER_OVERFLOW: { retryable: false, description: "max exceeded" }

policies:
  idempotency: not-required
  timeoutMs: 100

sideEffects:
  allowed: []
  forbidden: [network, filesystem, database]

guarantees:
  verifiable:
    - operation: increment
      assertion: value_increases_by_amount
      test: counter.test.ts#increments_by_specified_amount
  aspirational:
    - statement: "only declared error codes cross boundary"
      enforcement: catch-all error wrapper

annotations:
  increment: { readOnly: false, destructive: false, idempotent: false, openWorld: false }
```

### A.2 Async contract fragment

```yaml
kind: async
async:
  completion: required
  delivery: at-least-once
  ordering: per-key
  timeoutMs: 30000
  cancellation:
    supported: true
    semantics: best-effort
```

### A.3 Streaming contract fragment

```yaml
kind: streaming
stream:
  messageSchema:
    type: object
    additionalProperties: false
    properties:
      line: { type: string }
      stream: { type: string }
    required: [line, stream]
  terminalEvents: [completed, failed, cancelled]
  ordering: per-key
  backpressure: buffer
  replay: from-offset
```

### A.4 Composition with failure mapping

```yaml
requires:
  - component: SSHConnectionPool
    version: ">=1.0.0"
    guarantees_assumed:
      - "connection authenticated before use"
    failurePolicy:
      mode: fail-closed
      timeoutMs: 3000
      mapErrors:
        DEP_TIMEOUT: UPSTREAM_TIMEOUT
        DEP_UNAVAILABLE: DEPENDENCY_UNAVAILABLE
```
