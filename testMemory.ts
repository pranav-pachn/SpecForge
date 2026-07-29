import { db } from "./src/lib/db";
import { persistPipelineArtifacts } from "./src/lib/ai/engine/persistArtifacts";
import { WorkflowContext } from "./src/lib/ai/engine/WorkflowContext";
import { MemoryEngine } from "./src/lib/memory/MemoryEngine";

async function main() {
  console.log("Creating test workflow...");
  const user = await db.user.findFirst();
  if (!user) {
    console.log("No user found");
    process.exit(1);
  }

  const project = await db.project.findFirst();
  if (!project) {
    console.log("No project found");
    process.exit(1);
  }

  const workflow = await db.workflow.create({
    data: {
      name: "Test Memory Workflow",
      projectId: project.id,
      creatorId: user.id,
      status: "DRAFT",
    }
  });

  console.log("Created workflow:", workflow.id);

  const ctx: WorkflowContext = {
    input: {
      workflowId: workflow.id,
      userId: user.id,
      rawIdea: "Build a cool app",
      instruction: "Build a cool app",
      designConstraints: [],
      architecturalPatterns: [],
      technologyPreferences: [],
    },

    artifacts: {
      specification: {
        markdown: "# Test Spec\nThis is a test spec.",
        requirements: [],
        actors: [],
        systemCapabilities: []
      },
      planning: {
        architecture: { frontend: "React", backend: "Node", database: "Postgres" },
        dataModels: [],
        apiEndpoints: [],
        dependencies: { packages: [], externalServices: [] },
        deployment: { infrastructure: [], considerations: [] }
      },
      tasks: {
        tasks: [
          {
            title: "Setup DB",
            description: "Setup the postgres database",
            acceptanceCriteria: ["DB is up"],
            verificationNotes: [],
            priority: 1,
            order: 1,
            complexity: "low",
            requirements: [],
            dependencies: []
          },
          {
            title: "Build API",
            description: "Build the API endpoints",
            acceptanceCriteria: ["API responds"],
            verificationNotes: [],
            priority: 2,
            order: 2,
            complexity: "medium",
            requirements: [],
            dependencies: ["Setup DB"]
          }
        ]
      }
    },
    execution: { startedAt: new Date(), stages: [] }
  };

  console.log("Persisting artifacts...");
  await persistPipelineArtifacts(ctx);

  // Wait a few seconds for async memory jobs to finish
  console.log("Waiting 5s for async MemoryEngine jobs...");
  await new Promise(r => setTimeout(r, 5000));

  const memories = await db.engineeringMemory.findMany({
    where: { workflowId: workflow.id }
  });

  console.log("Memories created:", memories.length);
  memories.forEach(m => {
    console.log(`- [${m.decisionId}] ${m.title} (${m.memoryType}, ${m.severity}): ${m.reason}`);
  });

  const relationships = await db.memoryRelationship.findMany({
    where: { sourceType: "MEMORY" }
  });
  console.log("Relationships created:", relationships.length);

  console.log("Done.");
}

main().catch(console.error).finally(() => process.exit(0));
