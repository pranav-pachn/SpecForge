# SpecForge

**SpecForge** is an AI-powered SaaS application designed for technical leads, product managers, and engineering teams. It transforms unstructured ideas and conversations into comprehensive software specifications, implementation plans, actionable tasks, and production-ready execution code.

Built with **Next.js 14**, **Prisma**, **Tailwind CSS**, and the **Vercel AI SDK**, SpecForge acts as an intelligent engineering companion that shepherds a feature from inception to deployment while preventing specification drift.

## ✨ Key Features

1. **AI Specification Generator**: Instantly drafts technical specs from natural language inputs, breaking them down into Goals, Non-goals, Target Users, and more.
2. **Implementation Planning**: Generates step-by-step architectural plans based on the approved specification.
3. **Task Breakdown**: Converts plans into structured sub-tasks with clear acceptance criteria and dependencies.
4. **Code Execution Packs**: Generates prompt bundles and initial code scaffolds tailored for specific AI developer tools (Cursor, Claude Code, Windsurf).
5. **Engineering Review & Validation**: Automatically reviews your specifications for requirement coverage, edge cases, security, and architectural soundness.
6. **Drift Detection**: Tracks changes to the specification over time and identifies potential downstream impact on tasks and code.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: PostgreSQL (via [Prisma ORM](https://www.prisma.io/))
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **UI Components**: custom components powered by Lucide icons, Framer Motion, and CMDK.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A PostgreSQL database (e.g., local, Supabase, Neon)
- An OpenAI API Key (or other compatible LLM provider configured in Vercel AI SDK)
- A Google OAuth Client (for Google sign-in)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pranav-pachn/SpecForge.git
   cd SpecForge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/specforge"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 🎮 Demo Mode

Want to test the platform without setting up a real account? 
SpecForge includes a built-in demo seeder.

Navigate to `http://localhost:3000/login?demo=true` to automatically provision a demo account (`demo@specforge.dev`), workspace, and sample project, then log in instantly.

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
│   ├── (auth)/           # Authentication pages (login, signup)
│   ├── (dashboard)/      # Protected dashboard and workflow routes
│   └── api/              # API routes (AI generation, analytics, search)
├── components/           # Reusable UI components (Skeletons, CommandPalette, etc.)
├── features/             # Feature-based modular architecture
│   ├── specs/            # Specification artifacts and editors
│   └── workflows/        # Core workflow engine and tabs
├── lib/                  # Shared utilities (Prisma client, Auth config, AI config)
└── config/               # Platform configuration and feature flags
prisma/
└── schema.prisma         # Database schema
```

## 📄 License

This project is licensed under the MIT License.
