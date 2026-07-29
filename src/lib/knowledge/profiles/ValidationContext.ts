import { ContextProfile } from "../ContextBuilder";
import { RetrievedNode } from "../Node";

export class ValidationContext implements ContextProfile {
  capability = "validation";

  getTypes(): string[] {
    return ["requirement", "specification", "review", "task"];
  }

  format(nodes: RetrievedNode[]): string {
    let output = "## Engineering Memory\n\n";

    const requirements = nodes.filter(n => n.type === "requirement");
    if (requirements.length > 0) {
      output += "### Core Requirements\n";
      requirements.forEach(r => output += `${r.content}\n\n`);
    }

    const reviews = nodes.filter(n => n.type === "review");
    if (reviews.length > 0) {
      output += "### Previous Review Findings\n";
      reviews.forEach(p => output += `${p.content}\n\n`);
    }

    const tasks = nodes.filter(n => n.type === "task");
    if (tasks.length > 0) {
      output += "### Contextual Tasks\n";
      tasks.forEach(t => output += `${t.content}\n\n`);
    }

    return output;
  }
}
