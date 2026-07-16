const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts', { absolute: true });

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace agent imports
  if (content.match(/import\s+\{\s*([a-zA-Z]+Agent)\s*\}\s+from\s+["']@\/lib\/ai\/agents\/[a-zA-Z]+["'];?/)) {
    content = content.replace(/import\s+\{\s*([a-zA-Z]+Agent)\s*\}\s+from\s+["']@\/lib\/ai\/agents\/[a-zA-Z]+["'];?/g, 'import { gateway } from "@/lib/ai/gateway/gateway";');
    changed = true;
  }

  // Replace prompt imports
  if (content.match(/import\s+\{\s*([A-Z_]+_PROMPT)\s*\}\s+from\s+["']@\/lib\/ai\/[a-zA-Z-]+prompts["'];?/)) {
    content = content.replace(/import\s+\{\s*([A-Z_]+_PROMPT)\s*\}\s+from\s+["']@\/lib\/ai\/[a-zA-Z-]+prompts["'];?/g, 'import { PromptRegistry } from "@/lib/ai/prompts/registry";');
    changed = true;
  }

  // Replace plannerAgent({ system: PROMPT, ... })
  // We'll use a regex that captures the agent call and options
  const agentCallRegex = /(?:planner|recovery|impact|execution)Agent\s*\(\s*\{\s*system:\s*([A-Z_]+_PROMPT)\s*,([^}]*)\}\s*\)/g;
  
  content = content.replace(agentCallRegex, (match, promptName, rest) => {
    changed = true;
    let capability = "spec"; // default
    let registryMethod = "spec";
    
    if (promptName === "SPEC_GENERATION_SYSTEM_PROMPT") { capability = "spec"; registryMethod = "spec"; }
    else if (promptName === "PLAN_GENERATION_SYSTEM_PROMPT") { capability = "planning"; registryMethod = "plan"; }
    else if (promptName === "TASK_DECOMPOSITION_SYSTEM_PROMPT") { capability = "tasks"; registryMethod = "tasks"; }
    else if (promptName === "FULL_REVIEW_SYSTEM_PROMPT") { capability = "review"; registryMethod = "review"; }
    else if (promptName === "VALIDATION_SYSTEM_PROMPT") { capability = "validation"; registryMethod = "validation"; }
    else if (promptName === "DRIFT_DIFF_PROMPT") { capability = "drift"; registryMethod = "drift"; }
    else if (promptName === "EXECUTION_PACK_PROMPT") { capability = "execution"; registryMethod = "execution"; }
    else if (promptName === "CLARIFICATION_PROMPT") { capability = "clarify"; registryMethod = "clarify"; }
    else if (promptName === "VALIDATION_REMEDIATION_PROMPT") { capability = "auto_fix"; registryMethod = "autoFix"; }
    else if (promptName === "SPEC_REGENERATE_SYSTEM_PROMPT") { capability = "spec"; registryMethod = "specRegenerate"; }
    else if (promptName === "ENGINEERING_REVIEW_SYSTEM_PROMPT") { capability = "review"; registryMethod = "engineeringReview"; }
    
    return `gateway.execute({\n      capability: "${capability}",\n      system: PromptRegistry.${registryMethod}(),${rest}})`
  });

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
