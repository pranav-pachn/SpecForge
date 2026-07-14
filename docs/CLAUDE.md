# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`  
  Starts the Next.js development server at http://localhost:3000.

- **Build for production**: `npm run build`  
  Builds the application for production.

- **Start production server**: `npm run start`  
  Starts the Next.js production server.

- **Lint code**: `npm run lint`  
  Runs ESLint on the source code.

- **Run Prisma commands**:
  - Generate Prisma client: `npx prisma generate`
  - Push database schema: `npx prisma db push`
  - Seed demo data: `npm run seed:demo`

- **Run linter**: `npm run lint`

## Project Structure

### Root Directories
- `src/` - Main source code
  - `app/` - Next.js App Router pages and route handlers
  - `components/` - Reusable React components
  - `features/` - Feature-specific components and logic
  - `lib/` - Utility functions, database, AI providers, and configuration
  - `ai/` - AI chains, prompts, and providers for AI features
  - `types/` - TypeScript type definitions
- `prisma/` - Prisma schema and migrations
- `public/` - Static assets

### Key Areas

#### AI Features (`src/ai/`)
- `chains/` - AI workflow chains (spec generation, planning, task breakdown, validation)
- `prompts/` - Prompt templates for AI models
- `providers/` - AI provider implementations (OpenAI, Gemini, etc.)

#### Features (`src/features/`)
- `approvals/` - Approval workflow components
- `artifacts/` - Artifact viewing and editing components
- `drift/` - Detector and visualization for drift
- `execution/` - Execution pack generation and compiler
- `review/` - Review gate and validation checks
- `workflows/` - Workflow management and UI components

#### App Router (`src/app/`)
- Routes organized by feature areas:
  - `/` - Home page
  - `/(auth)/` - Authentication routes (login, signup)
  - `/(dashboard)/` - Protected dashboard routes
  - `/api/` - API routes (AI endpoints, artifact management, workflows, etc.)

#### Components
- Reusable UI components in `src/components/` organized by feature:
  - `artifacts/` - Artifact viewer and editor components
  - `workflows/` - Workflow UI components (tabs, cards, steppers)
  - `editors/` - Monaco editor wrapper for markdown
  - `layout/` - Navbar, sidebar, providers

### Database
- Uses PostgreSQL with Prisma ORM
- Schema defined in `prisma/schema.prisma`
- Key models: User, Workflow, Artifact, Task, ExecutionPack, etc.
- Run `npx prisma db push` to apply schema changes

### Environment Variables
Required `.env` variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Base URL for authentication
- `NEXTAUTH_SECRET` - Secret for NextAuth
- `OPENAI_API_KEY` - OpenAI API key