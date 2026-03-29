# SPECS.md — Contract-Driven Design Philosophy

## 1. Purpose

This repository defines a software philosophy where components are built for **agents first** and **humans second**.

The central problem:

> AI agents currently need to read large portions of a codebase to infer behavior.

The central solution:

> Every component must publish an explicit, machine-readable contract that provides blackbox guarantees.

This document is the normative specification for that philosophy.

---

## 2. Core Thesis

A system is not agent-friendly because it has good code.
A system is agent-friendly because behavior is explicit at the boundary.

If behavior is implicit in implementation details, agents will crawl source code.
If behavior is explicit in contracts, agents can reason at the interface layer.

### Equation

`Need-to-read-whole-repo = hidden behavior + boundary leaks + undefined failures`

Design goal: drive all three terms toward zero.

---

## 3. Two-Layer Model

### 3.1 Agent-First Driven Design (AFDD)

AFDD is the architecture principle:

- The primary consumer of system capabilities is an autonomous agent.
- Capability boundaries must be discoverable and machine-readable.
- Runtime behavior must be auditable and policy-governed.
- Human readability is important, but not the integration bottleneck.

### 3.2 Contract-Driven Components (CDC)

CDC is the implementation mechanism:

- Each component has one canonical contract artifact (`*.component.yml`).
- Source code implements the contract; it does not define the contract.
- Tests verify conformance against the contract.
- Generated interfaces (MCP/OpenAPI/SDK stubs) are projections of the contract.

AFDD without CDC is ideology.
CDC without AFDD is overhead.
Both are required.

---

## 4. Contract Artifact Requirements

Each component MUST ship:

1. **Definition**: `component-name.component.yml`
2. **Implementation**: source code
3. **Conformance Tests**: contract tests + behavior tests
4. **Examples**: golden input/output (or error) cases

Optional but recommended:

- machine-readable changelog
- provider stubs for external dependencies

### 4.1 Canonical Fields (Minimum)

A valid contract MUST declare:

- `component`, `version`, `kind`
- `description`, `instructions`
- `input` schema per operation
- `output` schema
- `errors` taxonomy
- `policies` (timeouts, idempotency, etc.)
- `sideEffects.allowed` and `sideEffects.forbidden`
- `guarantees.success` and `guarantees.failure`
- operation `annotations` (readOnly/destructive/idempotent/openWorld)

### 4.2 Contract Authority Rule

`*.component.yml` is the source of truth.

If code and contract diverge, code is wrong until proven conformant.

---

## 5. MCP-Native by Default

Every contract-driven component MUST be projectable into an MCP server surface.

### 5.1 Projection Rule

- Contract operations → MCP tools
- Contract examples/instructions → MCP prompts
- Contract/state artifacts → MCP resources
- Contract errors → structured MCP error payloads

### 5.2 Layering Rule

MCP is a runtime projection, not the authority.

Authority: `*.component.yml`
Projection: MCP tool/resource/prompt definitions

This prevents lock-in to protocol-specific limitations.

---

## 6. Behavioral Guarantees

Schema-only contracts are insufficient.

A contract MUST define behavior beyond shape:

- invariants that always hold on success
- explicit failure semantics and retryability
- state transition constraints for stateful components
- side-effect boundaries

### 6.1 Failure Determinism

All expected failures MUST be represented by declared error codes.

Undeclared errors crossing boundaries are contract violations.

### 6.2 State Safety

For stateful components:

- invalid transitions MUST fail explicitly
- failure paths MUST not mutate state unless explicitly declared

---

## 7. Versioning and Compatibility

### 7.1 SemVer Rule

Contracts MUST use semantic versioning.

- Patch: non-behavioral fixes
- Minor: backward-compatible additions
- Major: breaking changes

### 7.2 Breaking Change Examples

- removing or renaming required input fields
- changing output semantics for existing operations
- altering declared error meaning
- widening side effects (new external writes)

### 7.3 CI Gate

Contract diffs MUST be classified automatically.
Merges are blocked when version bump and change type are inconsistent.

---

## 8. Verification Model

### 8.1 Required Test Types

1. **Contract conformance tests**
2. **Behavior/invariant tests**
3. **Error taxonomy tests**
4. **Boundary tests** (side effects, idempotency, state transitions)

### 8.2 No-Claim Rule

A component is not “done” unless:

- contract exists
- tests pass
- generated interface is valid
- implementation matches declared guarantees

---

## 9. Governance and Security

### 9.1 Capability Minimization

Agents receive the minimum capability set required for task completion.

### 9.2 Side-Effect Transparency

Every external side effect must be declared up front.

Hidden writes are a policy violation.

### 9.3 Auditability

Agent actions must be reconstructible from:

- selected capability
- contract version
- inputs
- output/error
- policy decisions

---

## 10. Complexity Discipline

Contract-driven design must remain operationally lightweight.

This philosophy should feel as simple as linting:

- one config
- one contract file per component
- one conformance command
- one CI gate

If adoption requires framework-heavy ceremony, the model has failed.

---

## 11. Reference Implementation in This Repo

`counter-component/` is the seed reference.

It demonstrates:

- contract-first component definition
- explicit error taxonomy
- state bounds + failure safety
- MCP tool/resource exposure
- conformance tests

Future components should copy the same contract-first flow.

---

## 12. Non-Negotiable Rules

1. No component without a contract.
2. No contract without tests.
3. No hidden side effects.
4. No undeclared error codes.
5. No breaking changes without major version bump.
6. No MCP surface that contradicts the contract.
7. No “done” status without conformance evidence.

---

## 13. Terminology

- **Agent-first**: architecture optimized for autonomous consumers.
- **Blackbox guarantee**: behavior inferable from contract alone.
- **Contract drift**: divergence between declared and actual behavior.
- **Projection**: generated interface from canonical contract.
- **Conformance**: implementation proves all declared guarantees.

---

## 14. Final Principle

Readable code is valuable.
Readable contracts are mandatory.

For humans, code explains how.
For agents, contracts define what is guaranteed.

In contract-driven design, guarantees win.
