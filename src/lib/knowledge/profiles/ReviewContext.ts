import { ContextProfile } from "../ContextBuilder";
import { RetrievedNode } from "../Node";

export class ReviewContext implements ContextProfile {
  capability = "review";

  getTypes(): string[] {
    return ["architecture", "requirement", "review", "validation"];
  }

  format(nodes: RetrievedNode[]): string {
    let output = "## Engineering Memory\n\n";

    const requirements = nodes.filter(n => n.type === "requirement");
    if (requirements.length > 0) {
      output += "### Core Requirements\n";
      requirements.forEach(r => output += `${r.content}\n\n`);
    }

    const architecture = nodes.filter(n => n.type === "architecture" || n.type === "api");
    if (architecture.length > 0) {
      output += "### Architecture Context\n";
      architecture.forEach(a => output += `${a.content}\n\n`);
    }

    const reviews = nodes.filter(n => n.type === "review");
    if (reviews.length > 0) {
      output += "### Previous Review Findings\n";
      reviews.forEach(p => output += `${p.content}\n\n`);
    }

    return output;
  }
}
