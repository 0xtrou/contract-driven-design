# SPEC.md — Contract-Driven Design Specification

**Spec Version:** `1.0.0`

This document is normative. `README.md` is philosophical context only.

---

## 1) Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** are to be interpreted as described in RFC 2119.

---

## 2) Conformance Statement

A component is **conformant** to this spec only if all of the following are true:

1. A contract file named `<component>.component.yml` exists.
2. That file validates against the contract schema defined in this spec.
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

A component MUST NOT be marked complete/releasable unless:

1. Contract exists and validates
2. Boundary conformance tests pass
3. Projection validity checks pass
4. All verifiable guarantees have linked passing tests
5. All aspirational guarantees declare enforcement mechanism

This is the quality gate.

---

## 6) Contract Schema (Normative)

Every contract MUST include:

```yaml
spec_version: "1.0.0"
component: string
version: semver
kind: stateless | stateful | async | streaming

description: string
instructions: string

input:
  <operation>:
    type: object
    additionalProperties: boolean
    properties: object
    required: string[]

output:
  type: object
  additionalProperties: boolean
  properties: object
  required: string[]

errors:
  <ERROR_CODE>:
    retryable: boolean
    description: string

policies:
  idempotency: required | not-required
  timeoutMs: number

sideEffects:
  allowed: string[]
  forbidden: string[]

guarantees:
  verifiable:
    - operation: string
      assertion: string
      test: "path/to/test#case"
  aspirational:
    - statement: string
      enforcement: string

annotations:
  <operation>:
    readOnly: boolean
    destructive: boolean
    idempotent: boolean
    openWorld: boolean
```

Optional:

```yaml
lifecycle:
  status: draft | stable | deprecated
  since: YYYY-MM-DD
  replaces: string

requires:
  - component: string
    version: semver-range
    guarantees_assumed: string[]

state: object   # required for kind: stateful
cancellation:   # relevant for streaming/async
  supported: boolean
```

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
- MUST include a linked test case (`test:`)

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
```

Rules:

- `guarantees_assumed` defines trust boundary between components
- Consumers MUST treat those guarantees as preconditions for dependent guarantees
- Circular dependency chains SHOULD be avoided

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
