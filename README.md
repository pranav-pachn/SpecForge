# SpecForge

> SpecForge turns rough feature ideas into approved specs, plans, tasks, execution packs, and validation artifacts for AI-assisted software delivery.

SpecForge is a spec-to-execution workflow OS designed to structure the chaotic process of building software with AI. It acts as the central hub where product requirements are clarified, broken down, and handed off to AI coding agents, ensuring alignment and reducing drift.

## Phase 1 Scope (Current)

**Included in v1 MVP:**
- Workflow creation
- Spec generation
- Clarification questions
- Plan generation
- Task breakdown
- Execution packs
- Review findings
- Validation screen
- Drift status

**Out of scope for v1:**
- Real-time collaboration
- GitHub sync
- Full code generation (this is handled by your external AI agent)
- Team permissions
- Fancy analytics dashboards

## Core Entities

The system revolves around these core concepts:

| Entity | Description |
|--------|-------------|
| **Workflow** | The container for a feature's entire lifecycle. |
| **Artifact** | A living document (Spec, Plan, Task Breakdown, Execution Pack). |
| **ArtifactVersion** | An immutable snapshot of an Artifact, subject to review and approval. |
| **Task** | A granular piece of work derived from a Plan or Spec. |
| **ExecutionPack** | Context and prompts packaged specifically for an AI coding agent (e.g., Cursor, Claude Code). |
| **ReviewCheck** | Automated or manual checks against requirements. |
| **ValidationCheck** | Testing criteria to verify the implementation. |
| **DriftEvent** | A flag indicating that a source artifact (e.g., a Spec) has changed, potentially invalidating downstream artifacts (e.g., Tasks). |
| **ClarificationQuestion** | A thread for resolving ambiguity in a draft version. |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js (Auth.js v5) with Credentials
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Setup environment variables**: Copy `.env.example` to `.env` and configure your database.
4. **Run migrations**: `npx prisma migrate dev`
5. **Start the development server**: `npm run dev`
