import fs from "fs";
import path from "path";
import { ScenarioSchema } from "./scenarioSchema";

const scenarioRoot = path.join(process.cwd(), "src", "testing", "scenarios");

function loadScenarios() {
  const dirs = fs.readdirSync(scenarioRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const loaded = [];
  const skipped: string[] = [];
  for (const dir of dirs) {
    const file = path.join(scenarioRoot, dir.name, "scenario.json");
    if (!fs.existsSync(file)) continue;
    const parsed = ScenarioSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
    if (parsed.success) loaded.push(parsed.data);
    else skipped.push(dir.name);
  }
  return { loaded, skipped };
}

const { loaded: scenarios, skipped } = loadScenarios();
console.log(`Loaded ${scenarios.length} scenario contracts.`);
if (skipped.length > 0) {
  console.log(`Ignored ${skipped.length} placeholder scenarios with no contract: ${skipped.join(", ")}`);
}

if (process.env.RUN_AI_EVAL !== "true") {
  console.log("Live provider evaluation skipped. Set RUN_AI_EVAL=true to run it. No scores were produced.");
  process.exit(0);
}

console.error("RUN_AI_EVAL is set, but this command does not call a provider and will not invent scores.");
process.exit(2);
