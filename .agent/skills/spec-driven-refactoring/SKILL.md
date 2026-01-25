---
name: spec-driven-refactoring
description: Applies a predictable, spec-driven workflow to refactor or evolve production codebases safely. Trigger when the user mentions vibe coding, messy or fragile code, refactoring in production, PRD.md, SPEC.md, duplicated logic, overengineering, modularization, or requests a repeatable change process.
---

# Spec-Driven Refactoring (Anti-Vibe Coding)

## When to use this skill

- The user mentions:
  - “vibe coding”
  - código bagunçado / difícil de manter
  - medo de mexer em partes do sistema
- The user asks for:
  - PRD.md, SPEC.md
  - planejamento antes de codar
  - processo previsível de mudança
- The system is:
  - em produção
  - com regressões frequentes
  - com duplicação ou overengineering

## Operating principles

- The agent is an **executor**, not an architect.
- No code is written unless explicitly in **Phase 3**.
- Each phase produces a concrete artifact.
- Context must be kept minimal and reset between phases.
- Prefer reuse over creation.
- Changes must be scoped and explicit.

---

## State checklist (copy/paste)

- [ ] Phase selected: 1 (Research) / 2 (SPEC) / 3 (Implement)
- [ ] Goal defined (1–3 sentences)
- [ ] Constraints captured (production, backward compatibility, etc.)
- [ ] PRD.md produced (Phase 1)
- [ ] Context reset
- [ ] SPEC.md produced (Phase 2)
- [ ] Context reset
- [ ] Implementation executed strictly per SPEC
- [ ] Validation completed

---

# Workflow (Plan → Validate → Execute)

## Phase 0 — Intake (always)

Capture the minimum:

- Goal (1–3 sentences)
- Constraints (production, migrations, deadlines)
- Stack (or declare assumptions)
- Definition of done

Output:

- Goal
- Constraints
- Assumptions
- Next phase (default: Phase 1)

---

## Phase 1 — Research → PRD.md (NO CODE)

### What to do

- Identify impacted areas:
  - candidate files/modules
  - data, API, UI touchpoints
- Search for reuse:
  - existing components, services, hooks, utilities
- Collect external references:
  - only relevant sections of official docs
  - proven patterns from mature sources
- Identify risks:
  - migrations, auth, billing, email delivery, rate limits
- Filter aggressively:
  - exclude unrelated files
  - exclude verbose dumps and logs

### Output: PRD.md (required format)

```md
# Context
- Change request:
- Expected outcome:
- Constraints:
- Assumptions:

# Impacted Areas
## Candidate files/modules (with reason)
- path/to/file.ext — reason
- path/to/file.ext — reason

## Data / API / UI touchpoints
- Data:
- API:
- UI:

# Reuse Opportunities
- Existing code to reuse:
  - name/path — usage
- Must not be duplicated:
  - item

# External References (relevant excerpts only)
- Technology/Library:
  - What matters:
  - Reference:

# Risks & Mitigations
- Risk:
  - Mitigation:

# Acceptance Criteria (high-level)
- Must:
- Must not:
```

---

## Phase 2 — Specification → SPEC.md (NO CODE)

*Trigger: User approved PRD.md*

### What to do

- Translate PRD into technical specs.
- Write pseudo-code or signatures for all changes.
- Define explicit test cases.
- Plan rollback strategy.

### Output: SPEC.md (required format)

```md
# Technical Specification

## Data Models (if any)
```ts
interface User { ... }
```

## API Changes

- Endpoint: POST /api/...
- Payload: { ... }

## Core Logic (Pseudo-code)

```ts
function calculate() {
  // steps
}
```

## Security & Performance

- Auth scopes:
- Rate limits:

## Migration Plan (if any)

1. Step 1
2. Step 2

## Test Plan

- [ ] Test case 1
- [ ] Test case 2

```

---

## Phase 3 — Implementation → Code
*Trigger: User approved SPEC.md*

### What to do
- Execute strictly what is in SPEC.md.
- If you find a blocker, STOP and ask.
- Do not "improve" outside the spec.
- Generate tests first (TDD) if possible.

---
