# SpecForge

SpecForge is a spec-to-execution workflow OS for AI-assisted software development.[1] It turns rough feature ideas into approved specifications, technical plans, dependency-aware tasks, tool-specific execution packs, review findings, validation artifacts, and drift-aware workflow history.[2][3]

## Why SpecForge

AI coding is fast, but output quality drops when teams skip structured requirements, review checkpoints, and validation against an approved source of truth.[4][5][6] SpecForge is designed around the spec-driven development model, where the specification guides downstream planning and execution instead of treating code generation as the starting point.[7][8]

The product focuses on three common workflow failures:

- Ambiguity before coding, when rough prompts force the model to guess on scope and requirements.[2][9]
- Artifact drift after planning, when updated specs leave tasks and prompt packs outdated.[10][11][3]
- Weak review discipline, where generated outputs move forward without meaningful validation.[12][6][13]

## Core workflow

SpecForge follows an eight-stage workflow built for controlled AI-assisted delivery.[1][3]

1. **Specify** — create a structured specification draft from a raw feature request.[4][14]
2. **Clarify** — ask targeted questions to remove ambiguity before planning starts.[9][15]
3. **Plan** — generate architecture notes, implementation sequencing, and technical approach.[14][16]
4. **Tasks** — break the plan into dependency-aware tasks with acceptance criteria.[16][15]
5. **Execute** — generate task-level execution packs for tools like Cursor and Claude Code.[2][16]
6. **Review** — inspect requirement coverage, missing tests, and risky assumptions.[12][17]
7. **Validate** — compare downstream artifacts against the approved specification.[5][15]
8. **Track Drift** — detect stale artifacts when upstream specs change.[10][3]

## Key features

- Versioned spec, plan, and task artifacts with approval states.[10][3]
- Clarification engine for underspecified requirements and missing assumptions.[9][15]
- Task-level execution packs rather than one oversized implementation prompt.[2][16]
- Review and validation layers tied to accepted requirements.[5][15]
- Drift detection for downstream artifacts after upstream changes.[10][11]
- Markdown export for reusable engineering artifacts.[16][10]

## Product principles

SpecForge is built around a few non-negotiable rules.[3][1]

- The approved spec is the source of truth for downstream artifacts.[7][8]
- Every major stage should be editable, reviewable, and approvable.[15][3]
- Validation should be requirement-aware, not generic quality scoring.[5][15]
- Prompt generation should be task-scoped, not monolithic.[2][16]
- Artifact lineage must stay visible so stale work can be identified quickly.[10][3]

## MVP scope

The first version focuses on a clear, usable core workflow instead of trying to replace IDEs or project management tools.[2][18]

### Included in v1

- Workflow creation from a raw feature request.[4]
- Versioned spec generation and editing.[10][3]
- Clarification questions before planning.[9]
- Spec review gate and approval flow.[19][15]
- Plan generation and editing.[14]
- Dependency-aware task generation.[16][15]
- Execution packs for Cursor and Claude Code.[2][16]
- Review and validation screens.[12][5]
- Drift detection for changed specs.[10][3]
- Markdown export.[16][10]

### Not included in v1

- Real-time collaboration.[3]
- Deep repository ingestion.[10]
- Fully autonomous implementation.[5][6]
- Enterprise permissions and governance.[3]
- Full project management replacement features.[11][18]

## Tech stack

The current implementation direction uses a full-stack web architecture optimized for document workflows and artifact lineage.[20][21]

- **Frontend:** Next.js, TypeScript, Tailwind CSS.[20]
- **Backend:** Next.js server actions or API routes, modular workflow services.[20][21]
- **Database:** PostgreSQL with Prisma or Drizzle for versioned relational data.[20][10]
- **AI layer:** model adapters for generation, review, and validation workflows.[1]
- **Storage format:** markdown-backed artifacts with structured metadata.[10][3]

## High-level architecture

The product is organized around versioned artifacts and workflow stages instead of around chat messages.[14][1]

| Module | Responsibility |
|---|---|
| Workflow Engine | Orchestrates stage transitions and approval states.[3] |
| Artifact Store | Persists specs, plans, tasks, versions, and lineage metadata.[10][3] |
| Clarification Engine | Detects ambiguity and generates targeted questions.[9][15] |
| Prompt Compiler | Builds task-level execution packs for selected coding tools.[2][16] |
| Review Engine | Surfaces requirement gaps, missing tests, and risky assumptions.[12][6] |
| Validation Engine | Compares outputs against approved requirements and acceptance criteria.[5][15] |
| Drift Tracker | Flags stale downstream artifacts after spec changes.[10][11] |

## Data model

Core entities in the product include:[10][3]

- User
- Workspace
- Project
- Workflow
- Artifact
- ArtifactVersion
- ClarificationQuestion
- ClarificationAnswer
- Task
- TaskDependency
- ExecutionPack
- ReviewCheck
- ValidationCheck
- DriftEvent
- ToolProfile

## Example use case

A builder starts with a rough request such as “build a student marketplace with payments, moderation, and analytics.”[1] SpecForge converts that request into a structured spec, asks clarification questions, creates an implementation plan, breaks the work into dependency-aware tasks, packages task-level prompts for Cursor or Claude Code, and then validates whether downstream outputs still align when the spec changes later.[2][15][3]

## Success criteria

SpecForge is successful when it helps users move from rough intent to controlled execution with stronger traceability and less rework.[19][3] The most important signals are approved specs, useful task decomposition, execution pack usage, review issue resolution, and reliable stale-artifact detection after source changes.[12][10][15]

## Roadmap

### Phase 1

- Workflow creation
- Spec editor
- Clarification engine
- Plan generation
- Task board
- Execution packs [4][16]

### Phase 2

- Review mode
- Validation mode
- Version history improvements
- Better artifact comparisons [12][5][10]

### Phase 3

- Drift center
- More tool profiles
- Governance rules
- Team collaboration features [3][1]

## Positioning

SpecForge should be described as an engineering workflow product, not as a prompt optimizer.[2][1] The strongest positioning is: a spec-governed execution layer for AI-assisted software delivery that improves clarity, review quality, and artifact traceability.[16][3]

## Local development

```bash
# install dependencies
npm install

# run development server
npm run dev

# run database migrations
npx prisma migrate dev
```

## Project status

SpecForge is currently defined as a productized MVP focused on spec generation, reviewable planning, task-level execution packs, validation, and drift control for AI-assisted engineering workflows.[3][1]
EOF && ls -l /home/user/output/specforge_README.md