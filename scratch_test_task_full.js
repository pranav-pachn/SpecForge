const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createOpenAI } = require('@ai-sdk/openai');
const { generateText } = require('ai');

// Ensure env is loaded
require('dotenv').config();

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

async function main() {
  const workflowId = 'cmrnmwc250002102djgfcero8';
  
  // Find the PLAN artifact
  const planArtifact = await prisma.artifact.findFirst({
    where: { workflowId, type: 'PLAN' },
    include: { versions: { orderBy: { version: 'desc' } } }
  });
  
  const planContent = planArtifact.versions[0].content;
  const planVersionId = planArtifact.versions[0].id;
  
  const prompt = "Please decompose the following Implementation Plan into tasks:\n\n### Implementation Plan\n" + planContent;
  const system = "You are an expert Technical Project Manager and Lead Engineer.\nYour goal is to take an approved Implementation Plan and generate a structured list of development tasks.\nThese tasks will be handed to AI coding assistants (like Cursor or Claude Code) or human developers.\n\nBreak down the work into logical, incremental tasks. Each task should be small enough to be tackled in one PR, but large enough to deliver a cohesive piece of value. Maximum 1 feature per task.\n\nGenerate a JSON object containing an array of 'tasks'. Each task must have:\n- \"title\": A clear, action-oriented title (e.g., \"Implement User Authentication API\").\n- \"description\": A concise paragraph explaining what needs to be built and why.\n- \"acceptanceCriteria\": Testable conditions that must be met for this task to be considered DONE.\n- \"verificationNotes\": Notes on how a developer should manually test or verify this task.\n- \"priority\": An integer where 1=Critical (do first), 2=High, 3=Medium, 4=Low.\n- \"order\": The sequential order in which this should be executed (1, 2, 3...).\n- \"complexity\": The estimated complexity, must be one of: \"XS\", \"S\", \"M\", \"L\", \"XL\".\n- \"dependencies\": An array of strings representing the titles of other tasks that must be completed before this one. Use the exact titles.\n- \"requirements\": An array of strings mapping this task to requirements (e.g., [\"REQ-001\", \"REQ-002\"]).\n\nRespond ONLY with valid JSON. Do not include markdown blocks around the JSON.";

  console.log('Generating tasks...');
  
  try {
    const result = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system,
      prompt
    });
    
    let parsedResult;
    try {
      const text = result.text;
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      parsedResult = JSON.parse(jsonStr);
      console.log('Parsed JSON correctly');
    } catch (e) {
      console.error('JSON Parse Error:', e);
      console.error('Raw Text:', result.text);
      return;
    }
    
    console.log('Saving to DB...');
    const createdTasks = await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { workflowId } });

      const tasksMap = new Map();
      const tasks = [];

      for (const t of parsedResult.tasks) {
        const created = await tx.task.create({
          data: {
            workflowId,
            versionId: planVersionId,
            title: t.title,
            description: t.description,
            acceptanceCriteria: t.acceptanceCriteria,
            verificationNotes: t.verificationNotes,
            priority: t.priority || 2,
            order: t.order || 0,
            status: "TODO",
            complexity: t.complexity,
            requirements: t.requirements || [],
          },
        });
        tasksMap.set(t.title, created);
        tasks.push(created);
      }
      return tasks;
    });
    console.log('Success! Created', createdTasks.length, 'tasks');
    
  } catch (error) {
    console.error('Task Decomposition Error:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
