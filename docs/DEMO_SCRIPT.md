# 🎬 Loom Demo Script

**Target Length:** 2.5 - 3 minutes
**Goal:** Show the pain of unstructured AI coding and how SpecForge forces clarity, resulting in perfect execution handoffs.

---

### Setup (Pre-recording)
1. Run `npm run seed:demo`
2. Start the dev server `npm run dev`
3. Log in as `demo@specforge.com`
4. Have the "Candidate Portal" workflow ready on the dashboard.
5. Have Cursor or Windsurf open in a split screen or separate window.

---

### 0:00 - Introduction & The Problem
*Screen: SpecForge Dashboard showing the active "Candidate Portal" workflow.*

**Voiceover:**
"If you're building software with AI tools like Cursor or Windsurf, you've probably noticed something: LLMs are amazing at writing code, but they are terrible at figuring out *what* to build."

"Without a solid spec, AI agents hallucinate features, lose track of constraints, and ultimately build the wrong thing. I built SpecForge to solve exactly this problem. Let me show you how it works."

### 0:30 - The Workflow & Spec Phase
*Screen: Click into the "Candidate Portal" workflow. Go to the "Spec" tab.*

**Voiceover:**
"SpecForge forces you to clarify your intent *before* the AI starts typing. 
Instead of dumping a messy idea directly into Cursor, you dump it into SpecForge. We use AI to restructure your raw thoughts into a clean, 12-section Product Requirements Document."

*Action: Scroll through the generated spec showing Goals, Non-Goals, and Constraints.*

"Notice how it explicitly calls out what's out of scope and locks in our technical constraints, like using Next.js and strict PII handling. This prevents the AI from going down the wrong path later."

### 1:15 - Decomposition (Plan & Tasks)
*Screen: Click on the "Plan" tab, then the "Tasks" tab.*

**Voiceover:**
"Once the spec is approved, SpecForge breaks it down into a technical architecture plan, and then decomposes that plan into a sequenced list of granular tasks."

*Action: Show the Tasks board.*

"We now have a step-by-step execution roadmap. Setting up the database, building the parser, and creating the UI."

### 1:45 - Execution Handoff
*Screen: Click on "Execute" tab.*

**Voiceover:**
"Here is where the magic happens. For any task, SpecForge generates an 'Execution Pack'."

*Action: Expand an execution pack for the first task.*

"This pack contains *only* the relevant context the AI needs for this specific task—pulling the exact requirements, constraints, and data models from the Spec and Plan. No more overflowing context windows or confusing the AI with irrelevant details."

*Action: Copy the execution pack to clipboard.*

### 2:15 - Handoff to AI Editor
*Screen: Switch to Cursor/Windsurf (or show side-by-side).*

**Voiceover:**
"I just copy this pack, drop it into Cursor Composer or Windsurf, and hit enter. The AI now has perfect, constrained context. It knows exactly what to do, what not to do, and how it fits into the broader architecture."

### 2:40 - The Drift Engine (Conclusion)
*Screen: Switch back to SpecForge. Point to the "Drift" tab (don't need to click).*

**Voiceover:**
"And if your requirements change later? SpecForge's Drift Engine automatically flags which plans and tasks are now stale, so your AI never works off outdated context."

"Stop coding in the dark. Try SpecForge today."

---
