# 🔨 SpecForge

> **Stop coding in the dark.** The spec-to-execution workflow OS for AI-assisted software development.

SpecForge is an open-source workflow tool designed specifically for developers building software with AI coding agents like Cursor, Windsurf, or Copilot. 

LLMs are incredible at writing code, but terrible at figuring out *what* to build. SpecForge forces you to clarify your intent before the AI starts typing. It turns messy ideas into structured specs, decomposes them into technical plans, and generates highly contextualized "Execution Packs" ready for handoff.

## 🌟 Why SpecForge?

The hardest part of AI-assisted coding isn't generating the code—it's managing the context. Without a solid specification and a step-by-step plan, AI agents hallucinate, lose track of requirements, and build the wrong thing.

SpecForge solves this by providing a pipeline:
1. **Specification Intake**: Dump raw ideas. We use an LLM to organize them into a clean PRD.
2. **Clarification**: Get asked targeted questions to resolve ambiguities before coding begins.
3. **Decomposition**: Turn the spec into an architecture plan and a sequenced list of execution tasks.
4. **Execution Handoff**: Export an "Execution Pack" for your AI agent that contains just the right amount of context for a specific task.
5. **Drift Detection**: If you change the spec later, SpecForge automatically flags the tasks and plans that are now stale.

## 🚀 Features

- **Hybrid Intake:** One large text area for raw thoughts, plus structured fields for goals and constraints.
- **Spec & Plan Generation:** Automated AI generation of detailed PRDs and implementation plans.
- **Task Breakdown:** Decompose plans into granular tasks with dependencies and acceptance criteria.
- **Execution Packs:** Generate optimized prompts for Cursor/Windsurf that include exact requirements and context.
- **Version Control & Drift Tracking:** Keep artifacts in sync. Know exactly what parts of your plan are stale when requirements change.
- **Beautiful UI:** A modern, premium interface built with Next.js App Router and TailwindCSS.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS + Lucide Icons
- **Database:** PostgreSQL + Prisma ORM
- **AI Integration:** Vercel AI SDK + OpenAI
- **Authentication:** Auth.js (NextAuth v5) + Credentials

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (e.g., Neon, Supabase, or local Docker)
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranav-pachn/SpecForge.git
   cd SpecForge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/specforge"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   OPENAI_API_KEY="sk-..."
   ```

4. **Initialize database**
   ```bash
   npx prisma db push
   ```

5. **Seed the demo data**
   ```bash
   npm run seed:demo
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Log in to the Demo Account**
   - **Email:** demo@specforge.com
   - **Password:** password123

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request if you'd like to help improve SpecForge.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
