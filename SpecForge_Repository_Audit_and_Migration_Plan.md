# SpecForge — Repository Audit and Migration Plan

**Scope:** Phase 0 of the "AI Engineering Judge" pivot (`SpecForge_Project_Blueprint.md`).
**Nature:** Read-only audit. No code deleted, no schema reset, no secrets printed.
**Date:** 2026-10-10
**Branch at audit time:** `phase-17-2-pattern-detection` (working tree has uncommitted changes)
**Toolchain verified this session:** `tsc --noEmit` → 0 errors · `vitest run` → 31 passed · `next build` → exit 0 · Prisma connected to Neon `neondb`, schema in sync.

This document follows the response structure required by blueprint §16.

---

## 1. Current state summary

SpecForge today is **not** a code-review product. It is a mature **AI spec-generation workflow engine**: `idea → plan → clarify → spec → spec_review → architect → tasks → review → validation → drift`, plus large supporting subsystems (learning loop, engineering memory, approvals, notifications, observability admin).

| Area | Current reality (evidence) |
|---|---|
| Framework | Next.js `14.1.3` App Router, React 18, TypeScript 5 (strict), Tailwind 3.4 |
| Auth | NextAuth `5.0.0-beta.31` + `@auth/prisma-adapter`, Google OAuth + credentials |
| ORM / DB | Prisma `5.22` + PostgreSQL (Neon). **65 models** in `prisma/schema.prisma` |
| AI SDK | Vercel `ai@7`, structured `generateObject` + Zod `4.4` validation |
| Provider gateway | `src/ai/gateway/` — router, retry, health tracker, metrics, cache. Providers already wired: **cerebras, groq, mistral, openrouter, gemini** |
| API surface | 50+ route handlers across ~30 feature areas under `src/app/api/` |
| Background infra | `bullmq` + `ioredis` (Redis), MinIO config present |
| Editor UI | `@monaco-editor/react`, `@xyflow/react` graph, framer-motion, react-markdown |
| Tests | Vitest unit/integration (`tests/`, 31 passing), Playwright e2e, scenario harness `src/testing/` |

**Capabilities routed through the gateway** (`src/ai/gateway/router.ts`): `spec, planning, tasks, execution, review, validation, drift, clarify, auto_fix, review_gate, architect, spec_review`. None are PR/diff-oriented.

**Bottom line:** The *infrastructure* the blueprint wants (provider gateway, Zod validation, deterministic veto, auth, persistence, testing) already exists and is healthy. The *domain* (PR ingestion, diff parsing, static analyzers, evidence-backed findings, GitHub integration, policy judge, evaluation harness) does **not** exist yet.

---

## 2. Reusable modules (keep and build on)

High-confidence reuse — these map directly onto blueprint components:

| Blueprint need (§4, §10) | Reuse from current repo | Fit |
|---|---|---|
| Provider Gateway (Groq primary, Gemini fallback, OpenRouter benchmark) | `src/ai/gateway/{gateway,router,retry,health,metrics,cache}.ts` | **Strong.** All five providers already adapted; add a `review` capability route. |
| Schema-validated LLM output | `src/ai/schemas/*` + `generateObject` discipline | **Strong.** Same pattern; add a canonical `ReviewFinding` Zod schema. |
| Deterministic policy judge / "score can't hide critical" | `decideValidationStatus`, `engineeringReviewStatus` in `src/infrastructure/services/analysis-engine.ts` | **Strong pattern reuse.** Already encodes veto semantics → adapt to `PASS/COMMENT/REQUEST_CHANGES/INCOMPLETE`. |
| Auth + ownership checks | `src/platform/auth`, `getAuthenticatedUser` (`api-helpers.ts`), `PermissionGuard` RBAC | **Strong.** |
| Persistence patterns | `src/platform/storage/db`, Prisma client singleton | **Strong.** |
| Auditability (§4.7) | `EventLog`, `AuditLog`, `StoredEvent` models | **Good.** Reuse for review-run audit trail. |
| Code/diff input UI | `@monaco-editor/react`, `VisualDiffViewer.tsx` | **Good.** Repurpose for manual-review paste + diff view. |
| App shell / dashboard / design system | `src/app/(dashboard)`, Tailwind, status-chip components | **Good.** |
| Test harness | `vitest.config.ts`, `src/testing/evaluation/*` scenario contracts, mocked-gateway integration tests (`tests/integration/`) | **Strong.** Evaluation-dataset pattern already proven. |
| Resilience / queues | `bullmq` + `ioredis` | **Conditional** — only if async PR review needs durable queues (§3). |

Partial-reuse models already in schema (names overlap but shape is spec-workflow, not PR):
- `ReviewCheck`, `ReviewFinding`, `EngineeringReview`, `ValidationReport`, `ValidationIssue` — **reusable concepts, wrong columns.** Treat as reference, add new PR-shaped models rather than overloading these.

---

## 3. Conflicts and obsolete components (for the pivot)

**Important strategic note:** In the prior session you chose **`qa_first`** — harden the existing workflow product and *shelf* the code-review pivot. Nothing below has been deleted. This section lists what *conflicts with* or is *unused by* the PR-review blueprint, so a future migration is informed — not a demolition order.

### 3.1 Missing entirely (net-new work, not conflicts)
- **GitHub integration** — no `@octokit/*` dependency, no `api/integrations/github/*` routes, no webhook signature verification. (Blueprint §6, §7, §12, Phase 6.)
- **Diff parser & line mapping** — nothing extracts base/head SHAs, hunks, or line ranges. (§5.2, §14.)
- **Static analysis adapters** over submitted code — no ESLint/tsc/Semgrep runner-as-analyzer. (§5.4, Phase 4.)
- **Canonical finding schema** (`category/severity/confidence/evidence/validationStatus`) — not present. (§9.)
- **PR-shaped data model** — `RepositoryConnection`, `PullRequest`, `ReviewRun`, `ReviewFeedback`, `EvaluationCase`, `EvaluationRun`. (§6.)
- **Evidence validation** (reject/downgrade unsupported findings, fingerprints). (§5.6, Phase 5.)

### 3.2 Conflicts to resolve before a pivot
- **Provider default mismatch:** blueprint §10 wants **Groq primary / Gemini fallback**; current `review`/`validation` default to **Mistral primary**, and `spec`/`planning` to **Gemini primary**. Reconcile per-capability routes (config-only change).
- **Model-name hardcoding risk:** `router.ts` hardcodes model IDs (`gemini-2.5-pro`, `llama-3.3-70b-versatile`, etc.). Blueprint §3/§10 require env-configurable model IDs. Low effort, worth doing during the pivot.
- **Schema weight:** 65 models is heavy for the blueprint's ~9-model MVP. Not obsolete, but the review vertical should add a *small, isolated* model set rather than entangle with learning/approval/notification tables.

### 3.3 Unused-by-pivot subsystems (safe to leave dormant; do NOT delete)
- Learning loop (`LearningPattern/Recommendation/Experiment/Benchmark/Decision/Adaptation/Execution`, `src/learning/*`, 9 npm scripts).
- Engineering memory (`EngineeringMemory`, `MemoryRevision/Relationship`).
- Approvals & notifications (`ApprovalChain/Step/Request/Vote`, `Notification*`).
- Spec-workflow agents/pipeline (`src/agents/*`, `src/workflow/*`).

These are the current product. Under `qa_first` they stay primary. Under a full pivot they become dormant — keep them behind the existing routes, don't rip them out in Phase 0.

---

## 4. Recommended migration plan (safe, incremental, non-destructive)

Guiding rule (blueprint §16): *preserve working functionality; migrate deliberately; no blind deletion.*

**Strategy: parallel vertical, not rewrite.** Build the review product as a new, isolated slice alongside the existing workflow app, reusing infrastructure. Decide consolidation only after the review vertical works end to end.

1. **Isolate, don't fork the repo.** New domain lives under clear namespaces:
   - `src/server/reviews/`, `src/server/github/`, `src/server/analysis/`, `src/server/policy/`
   - `src/shared/schemas/review*` (canonical finding + enums)
   - `src/app/api/reviews/*`, `src/app/api/integrations/github/*`
   - `src/app/(dashboard)/reviews/*`, `src/app/(dashboard)/manual-review/*`
2. **Additive schema only.** New Prisma models (`RepositoryConnection, PullRequest, ReviewRun, ReviewFinding2 or ReviewFindingV2, ReviewCheckV2, ReviewFeedback, EvaluationCase, EvaluationRun`) with **migrations**, never `db push --force` / reset on the shared Neon DB. Test migrations on a disposable database first.
3. **Reuse the gateway as-is.** Add a `review` capability to `ROUTER_CONFIG` (Groq primary, Gemini fallback, OpenRouter benchmark-only). Make model IDs env-configurable in the same change.
4. **Port the veto judge.** Generalize `decideValidationStatus` into a `reviewPolicyJudge` producing `PASS/COMMENT/REQUEST_CHANGES/INCOMPLETE`, keeping the "critical cannot be hidden by a score" invariant already tested.
5. **Vertical slice first (manual review), GitHub later.** Ship paste-diff → analyze → persist → inspect before any webhook work, exactly per blueprint Phase 2 → 3 → 4 → 5, then Phase 6.
6. **Tests travel with each slice.** Mirror the existing mocked-gateway integration pattern (`tests/integration/pipeline-dataflow.test.ts`, `generate-route.test.ts`) so no slice needs live keys.
7. **Branch + commit the audit** before touching code (blueprint Phase 0 "done when").

**Reversibility:** every step is additive. If the pivot is paused again, the new namespaces/routes/models sit unused with zero impact on the workflow product.

---

## 5. Phase 0 checklist (blueprint §13, Phase 0)

- [x] Inspect git status/branch, package scripts, routes, Prisma schema, components, tests, env template — **done (this document).**
- [x] Map reusable modules and obsolete/unused features — **§2, §3.**
- [x] Run current build/tests and record results — **`tsc` 0 · `vitest` 31 passed · `next build` exit 0 · Neon reachable, schema in sync.**
- [x] Create a safe migration plan; no blind deletion — **§4.**
- [ ] Create a feature branch for the pivot and commit this audit — **pending your approval** (working tree currently dirty; see §7).
- [x] Secrets protected — Cerebras token already removed from `get_models.js`; `.env` git-ignored. **Action still open:** rotate the previously-committed Cerebras key.
- [ ] MVP scope frozen — **pending the strategic decision in §7.**

**Done when:** current state documented ✓, secrets protected ✓ (rotation pending), reusable code identified ✓, MVP scope frozen ✗ (needs §7 decision).

---

## 6. Exact next implementation task

**If the pivot is approved:** implement blueprint **Phase 1, step 1–2** as the first code slice — the *canonical finding contract*, with zero infra risk:

- Add `src/shared/schemas/reviewFinding.ts`: Zod schema + enums (`category: BUG|SECURITY|DESIGN|PERFORMANCE|MAINTAINABILITY|TESTING`, `severity: CRITICAL|HIGH|MEDIUM|LOW|INFO`, `confidence: HIGH|MEDIUM|LOW`, `source: AI|STATIC_ANALYZER|CI|MANUAL`, `validationStatus: VERIFIED|UNVERIFIED|REJECTED`), nullable line refs, fingerprint helper.
- Add `src/server/policy/reviewJudge.ts`: deterministic `PASS/COMMENT/REQUEST_CHANGES/INCOMPLETE` rules adapted from `decideValidationStatus`.
- Add `tests/unit/reviewFinding.test.ts` + `tests/unit/reviewJudge.test.ts`: invalid findings rejected; critical can't be hidden; failed required check → `INCOMPLETE` not `PASS`.

This slice adds no models, no routes, no provider calls — pure contracts + tests, fully reversible, and it unblocks Phase 2.

**If `qa_first` still holds:** the next task is unchanged from the prior plan — a mocked-gateway integration test for the `review`/`validation` capability path and scenario-contract human review. Say which track you want.

---

## 7. Blocking risks and questions

1. **Strategic (blocking scope freeze):** You previously chose **`qa_first`** (harden the workflow product, shelf the pivot). "Build the audit and migration plan" is now done — but should I **begin the code-review pivot build**, or keep hardening the existing workflow product? These lead to different "next tasks" (see §6).
2. **Shared production database:** The pivot's new tables must be added via **migrations on a disposable DB first**. The repo currently has **no `prisma/migrations/` history** (`migrate status`: "No migration found") and has been using `db push` against live Neon. Introducing migrations cleanly needs a baseline. Approve before any schema change.
3. **Secret rotation (open security action):** the Cerebras API key that was previously hardcoded in `get_models.js` should be **rotated** in the Cerebras console — removing it from the file does not invalidate the leaked value.
4. **Dirty working tree:** branch `phase-17-2-pattern-detection` has many uncommitted changes plus tracked `.next/` build artifacts. I recommend committing/ignoring these before cutting a pivot branch. I did **not** run any git write commands — awaiting your go-ahead.
5. **GitHub App provisioning (future Phase 6):** requires you to create a GitHub App (App ID, private key, webhook secret) — external credentials I cannot generate.

---

### Appendix A — Capability routing today (`src/ai/gateway/router.ts`)

| Capability | Primary | Fallbacks |
|---|---|---|
| spec | gemini `2.5-pro` | cerebras, openrouter |
| planning | gemini `2.5-pro` | groq, openrouter |
| tasks | groq `3.3-70b` | mistral, openrouter |
| execution | cerebras `3.1-70b` | groq, mistral |
| review | mistral `large` | groq, openrouter |
| validation | mistral `large` | groq, openrouter |
| drift | mistral `large` | groq |
| clarify | groq `3.3-70b` | mistral, openrouter |
| auto_fix | openrouter `claude-3.5-sonnet` | groq, mistral |
| review_gate | groq `3.3-70b` | mistral |
| architect | cerebras `3.1-70b` | groq, mistral |
| spec_review | groq `3.3-70b` | mistral |

Blueprint target for the new `review` capability: **Groq primary → Gemini fallback**, OpenRouter benchmark-only, model IDs via env.

### Appendix B — Prisma models (65) grouped

- **Identity/org:** User, Account, Session, VerificationToken, Organization, OrgMember, Team, TeamMember, Invitation, CapabilityFlag, Project, ProjectMember, Policy, Comment
- **Workflow core:** Workflow, Artifact, ArtifactVersion, ClarificationQuestion, ClarificationAnswer, Task, TaskDependency, ExecutionPack, ReviewCheck, DriftEvent, ToolProfile, EventLog
- **Review/validation (spec-shaped):** EngineeringReview, ReviewFinding, ValidationReport, ValidationIssue, DriftAnalysis
- **Knowledge/learning:** KnowledgeNode, KnowledgeRelationship, LearningPattern/Recommendation/Experiment/Benchmark/Decision/Adaptation/Execution, SystemConfig, EvaluationRun, PromptVariant, PromptEvaluation, BenchmarkResult, ProjectBaseline
- **Memory:** EngineeringMemory, MemoryRevision, MemoryRelationship
- **Approvals/notifications:** ApprovalChain/Step/Request/Vote, NotificationChannel, Notification, NotificationDelivery, NotificationPreference
- **Ops/audit:** AuditLog, MetricRollup, UsageRecord, Template, StoredEvent, AgentCheckpoint, AgentExecution

> None of the 65 match the blueprint's PR-review shape (`RepositoryConnection`, `PullRequest`, `ReviewRun`, `ReviewFeedback`, `EvaluationCase`). These are net-new, additive models.
