# Technical Specification

## Directory Structure

```
content-pipeline/
  ├── 1-inputs/         # Place .md files here (from NotebookLM)
  ├── 2-drafts/         # [NEW] Generated JSONs land here first
  ├── 2-drafts/rejected # [NEW] Rejection bin
  ├── 3-review/         # [MODIFIED] Only AI-approved cases reach here
  ├── 4-approved/       # User moves valid JSONs here for deploy
  └── 5-archived/       # Backup of processed inputs
```

## Data Models

### Review Logic

Cases must earn an `approval_score >= 8` to move to `3-review`.

```ts
interface ReviewFeedback {
  approved: boolean; // score >= 8
  scientific_audit: {
    theoretical_model: "Correctly identifies Beck's Triad?",
    citation_check: "Are references plausible?",
    clinical_risk: "Any harmful intervention?"
  };
  score: number; // 0-10
  feedback_notes: string;
}
```

## Scripts

### 1. `scripts/pipeline-generate.js` (Update)

- Output target changed logic:
  - **Old:** Save to `3-review`.
  - **New:** Save to `2-drafts`.

### 2. `scripts/pipeline-review.js` (New)

**Logic:**

1. List `.json` files in `content-pipeline/2-drafts/` (ignore `rejected` subdir).
2. For each file:
   - Read JSON `case_content`.
   - Call OpenAI (GPT-4o) Persona: **"Scientific Supervisor"**.
   - **System Prompt:** "You are a rigid Scientific Supervisor. Audit this clinical case against Cognitive Behavioral Therapy (CBT) gold standards (Beck/Judith Beck/David Clark). Check for theoretical drift, hallucinations, or clinical risk. Rate 0-10."
   - **Validation:**
     - If Score >= 8: Move to `3-review/`.
     - If Score < 8: Move to `2-drafts/rejected/`.
   - **Append Metadata:** Add `ai_peer_review` object to the JSON file.

### 3. `scripts/pipeline-deploy.js` (No Change)

- Reads from `4-approved` as before.

## Test Plan

- [ ] **Test Generation:** Input creates file in `2-drafts`.
- [ ] **Test Review (Pass):** High quality case moves to `3-review`.
- [ ] **Test Review (Fail):** "Bad" case (nonsense input) moves to `2-drafts/rejected`.
