import { ArtifactAdapter, ArtifactSection } from "./ArtifactAdapter";

export class MarkdownArtifactAdapter implements ArtifactAdapter {
  split(artifact: string): ArtifactSection[] {
    const sections: ArtifactSection[] = [];
    
    // Simple regex to match markdown headers (h1, h2, h3)
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    let previousMatch: RegExpExecArray | null = null;
    
    while ((match = headerRegex.exec(artifact)) !== null) {
      if (previousMatch) {
        sections.push(this.createSection(artifact, previousMatch, match.index));
      }
      previousMatch = match;
    }
    
    // Add the final section
    if (previousMatch) {
      sections.push(this.createSection(artifact, previousMatch, artifact.length));
    } else {
      // If no headers found, treat the whole document as one section
      sections.push({
        id: 'root',
        title: 'Document',
        content: artifact,
        startIndex: 0,
        endIndex: artifact.length
      });
    }
    
    return sections;
  }

  private createSection(artifact: string, headerMatch: RegExpExecArray, endIndex: number): ArtifactSection {
    // Generate a simple ID from the title
    const title = headerMatch[2].trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    return {
      id,
      title,
      content: artifact.substring(headerMatch.index, endIndex),
      startIndex: headerMatch.index,
      endIndex
    };
  }

  patch(artifact: string, sectionId: string, replacement: string): string {
    const sections = this.split(artifact);
    const targetSection = sections.find(s => s.id === sectionId);
    
    if (!targetSection) {
      throw new Error(`[MarkdownArtifactAdapter] Section ID '${sectionId}' not found in artifact.`);
    }

    const before = artifact.substring(0, targetSection.startIndex);
    const after = artifact.substring(targetSection.endIndex);
    
    // Ensure proper spacing around the replacement
    return before + replacement.trim() + "\n\n" + after.trim();
  }
}
