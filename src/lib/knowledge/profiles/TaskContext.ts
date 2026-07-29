import { ContextProfile } from "../ContextBuilder";
import { RetrievedNode } from "../Node";

export class TaskContext implements ContextProfile {
  capability = "task_planning";

  getTypes(): string[] {
    return ["requirement", "architecture", "planning"];
  }

  format(nodes: RetrievedNode[]): string {
    let output = "## Engineering Memory\n\n";

    const architecture = nodes.filter(n => n.type === "architecture" || n.type === "api");
    if (architecture.length > 0) {
      output += "### Architecture Decisions\n";
      architecture.forEach(a => output += `${a.content}\n\n`);
    }

    const requirements = nodes.filter(n => n.type === "requirement");
    if (requirements.length > 0) {
      output += "### Core Requirements\n";
      requirements.forEach(r => output += `${r.content}\n\n`);
    }

    return output;
  }
}
