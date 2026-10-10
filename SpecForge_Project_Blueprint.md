# SpecForge --- AI Engineering Judge

## Product Blueprint, Architecture, UX Plan, and Build Roadmap

**Purpose:** Give Claude a source-of-truth brief for understanding the
product pivot and implementing it incrementally.

-   **Product name:** SpecForge
-   **Positioning:** AI Engineering Judge
-   **Tagline:** Evidence-driven code review for GitHub pull requests.
-   **Primary workflow:** Review GitHub pull requests automatically.
-   **Secondary workflow:** Manually submit a code snippet or unified
    diff.

------------------------------------------------------------------------

## 1. Product Overview

SpecForge reviews code changes like a careful software engineer. It
combines deterministic analysis tools with repository-aware LLM
reasoning to identify:

-   Bugs and likely runtime failures
-   Security vulnerabilities
-   Design and architecture weaknesses
-   Performance concerns
-   Maintainability/readability issues
-   Missing tests and edge cases

Each finding should include a category, severity, confidence band, file
and line reference when reliable, evidence, impact, and a concrete
remediation suggestion. The system also produces a prioritized checklist
and an overall recommendation.

**Core promise:** SpecForge does not merely generate comments. It
combines code evidence, deterministic checks, and LLM reasoning to
produce actionable engineering judgments.

### MVP scope

1.  Manual code/diff review.
2.  GitHub App integration for pull requests.
3.  Structured, evidence-backed findings.
4.  Deterministic checks (initially focus on TypeScript/JavaScript).
5.  Policy-based `PASS`, `COMMENT`, `REQUEST_CHANGES`, or `INCOMPLETE`
    outcome.
6.  Review history and persisted results.
7.  Groq primary provider, Google AI Studio/Gemini fallback.
8.  OpenRouter reserved for offline model benchmarks.
9.  A curated evaluation dataset with precision/recall/F1 and
    false-positive analysis.
10. Clear errors, retries, size limits, and incomplete-review states.

### Non-goals for the first version

Do not build a general autonomous coding agent, automatic merging,
silent code modification, a self-modifying production system, a large
multi-agent framework, a plugin marketplace, or complex infrastructure
without a concrete need. Fixes are suggestions only.

------------------------------------------------------------------------

## 2. Users and Differentiation

**Target users:** individual developers, student/hackathon teams, small
teams, and maintainers who want useful review feedback without excessive
noise.

**Differentiators:** - Findings tied to actual changed code or verified
context - Hybrid analysis: static tools plus LLM reasoning - Concrete
remediation, not vague criticism - Deduplication and false-positive
control - Transparent final decision rules - Repeatable evaluation with
documented limitations

Never claim that all bugs are detected or code is guaranteed secure.
State supported languages and checks honestly.

------------------------------------------------------------------------

## 3. Recommended Technology

Inspect the existing repository and reuse its healthy stack before
replacing anything.

-   **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS,
    existing shadcn/ui/Radix components if present, Framer Motion only
    for purposeful transitions.
-   **Backend:** Next.js Route Handlers initially; TypeScript services;
    Prisma; PostgreSQL.
-   **Background work:** Redis/BullMQ only if reviews require durable
    queues, retries, or concurrency control.
-   **AI providers:** Groq primary; Google AI Studio/Gemini fallback;
    OpenRouter for offline benchmark sweeps; NVIDIA NIM optional later.
-   **Analysis tools:** ESLint, TypeScript checks, dependency auditing,
    and optionally Semgrep based on actual language coverage.
-   **Tests:** use the current test framework; consider Vitest and
    Playwright if appropriate.

Model names, provider quotas, free tiers, and terms can change.
Configure provider/model IDs through environment variables rather than
hardcoding them.

------------------------------------------------------------------------

## 4. Architecture

``` mermaid
flowchart TD
    User[Developer] --> UI[SpecForge Web App]
    GH[GitHub PR / Webhook] --> API[Next.js API Layer]
    UI --> API
    API --> Auth[Authentication and Authorization]
    API --> Review[Review Orchestrator]
    Review --> Context[Diff and Repository Context Builder]
    Context --> Static[Static Analysis Adapters]
    Context --> AI[AI Review Pipeline]
    AI --> Gateway[Provider Gateway]
    Gateway --> Groq[Groq Primary]
    Gateway --> Gemini[Gemini Fallback]
    Static --> Normalize[Normalize and Deduplicate Findings]
    AI --> Normalize
    Normalize --> Evidence[Evidence Validation]
    Evidence --> Judge[Deterministic Policy Judge]
    Judge --> DB[(PostgreSQL / Prisma)]
    Judge --> Dashboard[Review Results UI]
    Judge --> PR[GitHub Check / Optional Comments]
    DB --> History[Review History]
    Eval[Offline Evaluation Harness] --> Gateway
    Eval --> Metrics[Precision / Recall / F1 / Latency]
```

### Core design principles

1.  **Provider independence:** provider-specific output never leaks into
    product logic.
2.  **Schema validation:** validate every model response with a runtime
    schema such as Zod.
3.  **Evidence first:** unsupported findings are rejected, downgraded,
    or explicitly marked unverified.
4.  **Deterministic judgment:** an LLM can propose findings, but
    explicit policy rules determine the final status.
5.  **Least privilege:** use minimum GitHub permissions and verify
    webhook signatures.
6.  **No unsafe execution:** never execute arbitrary PR code on the
    application server.
7.  **Auditability:** record model/provider, prompt/config version, tool
    statuses, timing, and findings.
8.  **Idempotency:** duplicate webhook deliveries must not create
    duplicate reviews/comments.
9.  **Graceful degradation:** failed analysis must not silently appear
    as a clean review.
10. **Data minimization:** retain only necessary repository content and
    avoid logging private code/secrets.

------------------------------------------------------------------------

## 5. Review Pipeline

1.  **Ingest:** accept a GitHub PR, pasted code, or uploaded diff.
    Validate size, language, authorization, and metadata.
2.  **Parse diff:** extract base/head SHAs, changed files,
    additions/deletions, line ranges, and language.
3.  **Build context:** include the diff, bounded surrounding code,
    relevant definitions/tests, and project conventions. Do not send the
    whole repository by default.
4.  **Run deterministic checks:** lint/type/security/dependency tools or
    trusted CI results. Each check must be `PASSED`, `FAILED`,
    `SKIPPED`, or `ERROR`.
5.  **AI review:** ask for actionable defects introduced by the change;
    prohibit invented APIs, fabricated lines, and unsupported claims.
    Treat repository content as untrusted input.
6.  **Validate findings:** validate schema, file paths, line ranges,
    evidence, enums, and duplicates.
7.  **Judge deterministically:** apply explicit rules to produce the
    outcome.
8.  **Persist and display:** store the review and show findings, checks,
    evidence, remediation, and decision rationale.
9.  **Publish to GitHub:** start with a Check Run; add inline comments
    only after line mapping and duplicate prevention are reliable.

### Outcomes

-   `PASS`: no blocking issues found and required checks completed.
-   `COMMENT`: useful non-blocking findings exist.
-   `REQUEST_CHANGES`: a policy-defined blocking issue exists.
-   `INCOMPLETE`: required analysis failed or could not run.

Example rules: a verified critical security issue blocks; high-severity
evidence-backed correctness defects may block; medium/low findings
generally comment; required infrastructure failures result in
`INCOMPLETE`, never `PASS`. A numeric score must never hide a critical
issue.

------------------------------------------------------------------------

## 6. Suggested Data Model

First inspect the existing Prisma schema and reuse existing models where
sensible. This is a conceptual target, not a requirement to duplicate
models.

-   **User:** authenticated account and preferences.
-   **RepositoryConnection:** GitHub installation/repository mapping and
    permission metadata.
-   **PullRequest:** repository, PR number, base/head SHAs, title, URL,
    state.
-   **ReviewRun:** source, status, SHAs, provider/model, configuration
    version, timestamps, recommendation, summary, check statuses,
    idempotency key.
-   **ReviewFinding:** category, severity, confidence band, title,
    description, file/line, evidence, impact, remediation, source,
    validation status, fingerprint.
-   **ReviewCheck:** analyzer/tool, status, summary, duration, metadata.
-   **ReviewFeedback:** finding accepted/dismissed, reason, user,
    timestamp.
-   **EvaluationCase:** dataset case, input reference, expected
    findings/labels, language/category.
-   **EvaluationRun:** dataset version, provider/model/config, metrics,
    latency, cost estimate, status.

Use enums for stable domain values, indexes for commonly queried fields,
idempotency keys for webhook processing, and migrations instead of
destructive schema resets. Never store secrets in review records.

------------------------------------------------------------------------

## 7. API Proposal

Adapt these names to existing conventions; do not create duplicate
endpoints if equivalents exist.

-   `POST /api/reviews` --- create manual review.
-   `GET /api/reviews/:id` --- fetch status and results.
-   `GET /api/reviews` --- list the user's reviews.
-   `POST /api/reviews/:id/retry` --- retry an eligible failed review.
-   `POST /api/integrations/github/webhook` --- validate/process GitHub
    webhooks.
-   `GET /api/integrations/github/install` --- start installation flow
    if needed.
-   `GET /api/integrations/github/callback` --- complete installation
    flow if needed.
-   `GET /api/github/repositories` --- list authorized repositories.
-   `POST /api/reviews/:id/findings/:findingId/feedback` --- record
    feedback.

Every endpoint needs authorization, input validation, consistent errors,
and suitable rate limits. Verify webhook signatures before trusting
payloads.

------------------------------------------------------------------------

## 8. Frontend Plan

### Visual direction

Use a premium developer-tool aesthetic: dark-first workspace, restrained
accents, clean typography, subtle borders, compact status chips,
readable code and line numbers. Motion should clarify
navigation/loading/state changes, never obscure evidence. Include
keyboard focus, sufficient contrast, responsive layouts, and
reduced-motion support.

### Pages

**A. Landing page** - Hero: "Evidence-driven AI code review for GitHub
pull requests." - CTA: Connect GitHub / Try a manual review - Example
finding - How it works: Diff → Analysis → Evidence → Judgment -
Supported checks/languages - Evaluation methodology, limitations, and
privacy

**B. Dashboard** - Recent review runs and status - Repository/PR,
recommendation, severity counts, duration, timestamp - Filters for
repository, status, and severity

**C. Review detail** - PR metadata and overall recommendation at the
top - Summary, risk, checks completed, duration - Left: filterable
findings list - Right: selected finding detail with code location,
evidence, impact, fix, source, and validation status - Diff viewer,
checklist, static checks, AI analysis, and event history - Explain which
policy rules produced the final decision - Feedback controls for
helpful/false-positive findings

**D. Manual review** - Paste code or unified diff - Language selection
if detection is uncertain - Optional context - Visible input limits -
Progress, partial failures, and results using the same review components

**E. Repositories / Integrations** - GitHub installation state and
connected repositories - Explain requested permissions - Configure
automatic review and thresholds - Disconnect safely

**F. Evaluation dashboard (later)** - Dataset/version, model/provider,
precision/recall/F1, false-positive rate, latency, cost, sample size,
and limitations - Never show fabricated metrics or claim statistical
significance from tiny samples

### Suggested frontend structure

``` text
src/
  app/
    (marketing)/page.tsx
    (dashboard)/dashboard/page.tsx
    (dashboard)/reviews/page.tsx
    (dashboard)/reviews/[id]/page.tsx
    (dashboard)/manual-review/page.tsx
    (dashboard)/repositories/page.tsx
    api/
  features/
    reviews/components/
    integrations/
    dashboard/
    evaluation/
  server/
    reviews/
    github/
    providers/
    analysis/
    policy/
    persistence/
  shared/
    schemas/
    types/
    utils/
```

This is a guide only. Map the current repository to these
responsibilities and refactor incrementally; do not move every file just
to match the example.

------------------------------------------------------------------------

## 9. Canonical Finding Schema

Every AI/tool finding should normalize into one validated shape.
Example:

``` json
{
  "category": "BUG",
  "severity": "HIGH",
  "confidence": "HIGH",
  "title": "Request data is used before validation",
  "description": "The changed code dereferences a field before checking it.",
  "filePath": "src/example.ts",
  "startLine": 42,
  "endLine": 44,
  "evidence": "The changed code accesses the nested field before validation.",
  "impact": "Malformed requests may fail at runtime.",
  "suggestedFix": "Validate the request payload before dereferencing it.",
  "source": "AI",
  "validationStatus": "VERIFIED"
}
```

This is illustrative, not a claim about any real file. Suggested enums:

-   `category`: `BUG`, `SECURITY`, `DESIGN`, `PERFORMANCE`,
    `MAINTAINABILITY`, `TESTING`
-   `severity`: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`
-   `confidence`: `HIGH`, `MEDIUM`, `LOW`
-   `source`: `AI`, `STATIC_ANALYZER`, `CI`, `MANUAL`
-   `validationStatus`: `VERIFIED`, `UNVERIFIED`, `REJECTED`

Use nullable line references if mapping is unreliable. Do not treat
model self-reported confidence as a calibrated probability; calibrate it
only against labelled evaluation data.

------------------------------------------------------------------------

## 10. Provider Gateway

Use a provider-independent adapter and a shared validated output schema.

### Routing

1.  Groq is the default interactive provider.
2.  On retryable timeout/rate-limit/transient errors, try Gemini within
    a bounded time/retry budget.
3.  Do not blindly retry malformed input or other non-retryable
    failures.
4.  Validate every response against the canonical schema.
5.  Record provider/model, attempts, duration, and sanitized failure
    category.
6.  Never log keys, authorization headers, or secrets.
7.  OpenRouter is benchmark-only unless the product decision is
    deliberately changed.

Example `.env.example` (include only variables the implementation
actually uses):

``` dotenv
DATABASE_URL=
GROQ_API_KEY=
GOOGLE_AI_STUDIO_API_KEY=
OPENROUTER_API_KEY=
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Keep secrets server-side and keep `.env` out of version control.
Provider model IDs should be configurable.

------------------------------------------------------------------------

## 11. Evaluation Plan

Create a small, curated, versioned dataset and manually inspect cases.
Include clear bugs, security issues, clean changes that should yield no
finding, ambiguous cases, false-positive traps, multi-file changes, and
line-mapping edge cases.

Track: - Precision, recall, and F1 at finding level - False-positive
rate on clean/negative cases - Severity agreement - Line localization
accuracy - Schema-valid response rate - Review completion rate - Median
and p95 latency - Provider fallback rate - Cost per review where
measurable

Define matching rules before scoring. Version the dataset and record
model/provider, prompt version, tool versions, sample size, and
limitations. Run Groq and Gemini on identical inputs; use OpenRouter for
controlled model sweeps. Inspect false positives and false negatives
manually. Do not claim significance from a tiny dataset.

------------------------------------------------------------------------

## 12. Security and Reliability Requirements

-   Verify GitHub webhook signatures.
-   Request least-privilege GitHub permissions.
-   Never expose provider/GitHub secrets to the browser.
-   Never execute arbitrary PR code on the app host.
-   Limit request size, diff size, file count, tokens, time, and output
    size.
-   Treat code, comments, READMEs, and repository files as untrusted
    prompt-injection sources.
-   Validate all LLM output.
-   Enforce repository ownership checks on every operation.
-   Make webhook processing idempotent.
-   Use bounded retries, timeouts, and concurrency limits.
-   Avoid logging private code or secrets unnecessarily.
-   Support safe disconnect/deletion where appropriate.
-   Mark failed required stages `INCOMPLETE`, never `PASS`.
-   Suggested patches are suggestions; do not write or merge code
    automatically in MVP.

------------------------------------------------------------------------

## 13. Step-by-Step Build Roadmap

Implement one phase at a time. Do not start the next phase until the
current phase's acceptance criteria pass.

### Phase 0 --- Repository audit and scope freeze

1.  Inspect git status/branch, README, package scripts, routes, Prisma
    schema, components, tests, and env template.
2.  Map reusable modules and obsolete workflow features.
3.  Run current build/tests and record failures.
4.  Create a safe migration plan; do not delete old code blindly.
5.  Create a feature branch and commit the audit.

**Done when:** current state is documented, secrets are protected,
reusable code is identified, and MVP scope is frozen.

### Phase 1 --- Domain contracts and persistence

1.  Define review/finding/check enums and runtime schemas.
2.  Define request/response contracts and fingerprints/idempotency keys.
3.  Map current Prisma models before adding anything.
4.  Create migrations and test on a disposable database.

**Done when:** types and schemas agree, invalid inputs are rejected, and
clean-database migrations work.

### Phase 2 --- Manual review vertical slice

1.  Build manual review form.
2.  Implement review creation API.
3.  Parse and validate pasted code/diff.
4.  Connect one provider through a minimal adapter.
5.  Normalize and validate findings.
6.  Persist review/results.
7.  Build review detail page with loading/error/incomplete states.

**Done when:** submit → analyze → persist → refresh → inspect works end
to end, and secrets never reach the browser.

### Phase 3 --- Provider gateway and resilience

1.  Extract provider interface.
2.  Implement Groq adapter.
3.  Implement Gemini fallback.
4.  Add timeout/retry classification.
5.  Validate all responses.
6.  Add sanitized telemetry and mocked tests.

**Done when:** adapters are swappable, fallback works under tested
retryable failures, and tests require no live API keys.

### Phase 4 --- Deterministic analysis

1.  Choose initial language coverage.
2.  Integrate relevant lint/type/dependency/security tools.
3.  Normalize outputs and track check statuses.
4.  Deduplicate overlapping findings.
5.  Add safe execution boundaries and limits.

**Done when:** checks report real outcomes; missing tools never appear
as passing; arbitrary PR code is not executed on the application server.

### Phase 5 --- Evidence validation and policy judge

1.  Validate paths, line references, and evidence.
2.  Reject/downgrade unsupported findings.
3.  Add stable finding fingerprints.
4.  Implement deterministic recommendation rules.
5.  Explain which rules triggered the outcome.
6.  Test critical, high, medium, clean, and incomplete cases.

**Done when:** identical findings/config produce the same decision;
critical issues cannot be hidden by averages; failed required analysis
never returns `PASS`.

### Phase 6 --- GitHub integration

1.  Create/configure GitHub App with minimal permissions.
2.  Implement installation flow if required.
3.  Verify webhook signatures.
4.  Handle PR open/synchronize/reopen events idempotently.
5.  Fetch diff/context with authorized access.
6.  Run reviews asynchronously if needed.
7.  Publish Check Runs.
8.  Add inline comments only after line mapping and deduplication work.
9.  Add permission/error handling and rate limits.

**Done when:** a test PR triggers one review; duplicate webhooks do not
duplicate results; unauthorized access is rejected; check status matches
actual review state.

### Phase 7 --- Product-quality frontend

1.  Polish dashboard/history.
2.  Finish finding list/detail and diff view.
3.  Add filters and repository settings.
4.  Add feedback controls.
5.  Improve empty/loading/error/retry/partial states.
6.  Test responsive behavior, keyboard access, contrast, and reduced
    motion.

**Done when:** findings and judgment are easy to inspect and no fake
metrics/statuses appear.

### Phase 8 --- Evaluation harness

1.  Version curated dataset.
2.  Build repeatable evaluation script.
3.  Evaluate Groq and Gemini on identical cases.
4.  Add OpenRouter benchmark adapter.
5.  Compute metrics from explicit matching rules.
6.  Compare with a recorded baseline.
7.  Inspect representative false positives/negatives.

**Done when:** benchmark runs are repeatable and results include dataset
version, sample size, provider/model, prompt version, and limitations.

### Phase 9 --- E2E, security, deployment

1.  Test manual flow end to end.
2.  Test webhook signature and duplicate delivery.
3.  Test provider fallback and malformed output.
4.  Test authorization boundaries.
5.  Test oversized diffs and timeouts.
6.  Verify migrations and environment configuration.
7.  Add sanitized logs and basic observability.
8.  Write setup, architecture, threat model, evaluation, and limitation
    docs.
9.  Deploy a demo using a safe test repository.

**Done when:** build/tests pass, critical safety paths are covered,
failure modes are visible, and setup works from the README.

### Phase 10 --- Portfolio packaging

1.  Record a demo of PR ingestion, findings, and final judgment.
2.  Publish architecture and trade-offs.
3.  Publish honest benchmark results.
4.  Document provider fallback.
5.  Add real product screenshots.
6.  Write resume bullets only from verified, measurable outcomes.

**Done when:** the demo is real, reproducible, and supported by
evidence.

------------------------------------------------------------------------

## 14. Test Matrix

### Unit tests

-   Diff parser and line mapping
-   Finding schema validation
-   Provider error classification and fallback
-   Deduplication/fingerprints
-   Evidence validation
-   Deterministic decision rules
-   Webhook signature verification
-   Idempotency

### Integration tests

-   Provider adapters with mocked responses
-   Prisma persistence
-   GitHub client behavior
-   Static analyzer normalization
-   Retry and partial failure handling

### End-to-end tests

1.  Manual diff → findings → persisted results after refresh.
2.  Malformed model response → safe rejection/retry.
3.  Groq failure → Gemini fallback recorded.
4.  Verified critical finding → `REQUEST_CHANGES`.
5.  Required analyzer failure → `INCOMPLETE`.
6.  Duplicate webhook → one review run.
7.  Unauthorized repository → rejected.
8.  Clean code → no invented findings.
9.  Oversized diff → clear error.
10. Feedback submission → persisted.

------------------------------------------------------------------------

## 15. MVP Definition of Done

-   Manual review works end to end.
-   At least one GitHub PR can trigger a real review.
-   Findings are structured, actionable, and evidence-backed.
-   At least one deterministic analyzer is integrated.
-   Final recommendation uses explicit policy rules.
-   Groq primary and Gemini fallback work through a gateway.
-   OpenRouter is isolated to benchmarking.
-   Review history persists.
-   Duplicate webhooks are safe.
-   Critical failures cannot be reported as a clean pass.
-   Tests cover important safety paths.
-   A repeatable evaluation dataset/report exists.
-   README, architecture, setup, limitations, and demo are complete.

------------------------------------------------------------------------

## 16. Instructions for Claude

Treat this document as product intent and a target architecture---not
permission to rewrite the repository blindly.

### Before changing code

1.  Inspect the real repository tree, `package.json`, Prisma schema,
    routes, components, tests, and environment configuration.
2.  Summarize what exists and what can be reused.
3.  Identify conflicts between the current implementation and this plan.
4.  Propose the smallest safe next implementation slice.
5.  List exact files to change and why.
6.  Do not assume a described feature exists until verified.

### During implementation

-   Work phase by phase.
-   Preserve working functionality unless a deliberate migration
    replaces it.
-   Do not use `any` casts to hide type errors.
-   Do not introduce fake data or fake success states.
-   Do not add dependencies without a concrete need.
-   Validate external and LLM input at runtime.
-   Add tests with important behavior.
-   Use migrations, not destructive schema resets.
-   Never print or commit secrets.
-   Do not run destructive database commands without explicit approval.
-   If the actual repository conflicts with this blueprint, explain the
    trade-off before broad changes.

### Required response after audit

Return: 1. Current state summary 2. Reusable modules 3. Conflicts and
obsolete components 4. Recommended migration plan 5. Phase 0 checklist
6. Exact next implementation task 7. Blocking risks/questions

Do not begin a broad refactor until the audit and migration plan are
reviewed.

------------------------------------------------------------------------

## 17. Final Decisions

  -----------------------------------------------------------------------
  Decision                            Current direction
  ----------------------------------- -----------------------------------
  Name                                SpecForge

  Positioning                         AI Engineering Judge

  Tagline                             Evidence-driven code review for
                                      GitHub pull requests

  Primary use case                    GitHub PR review

  Secondary use case                  Manual code/diff review

  Primary provider                    Groq

  Fallback provider                   Google AI Studio / Gemini

  Benchmark provider                  OpenRouter

  Optional future provider            NVIDIA NIM

  Differentiator                      Evidence-backed findings +
                                      deterministic analysis +
                                      transparent judgment

  MVP priority                        Reliable end-to-end behavior over
                                      feature count

  Safety boundary                     Suggest fixes; never silently
                                      apply, merge, or deploy code

  Build strategy                      Audit first, then one tested
                                      vertical slice at a time
  -----------------------------------------------------------------------
