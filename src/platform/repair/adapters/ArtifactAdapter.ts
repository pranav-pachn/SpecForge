export interface ArtifactSection {
  id: string;
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface ArtifactAdapter {
  /**
   * Splits an artifact into logical sections.
   */
  split(artifact: string): ArtifactSection[];

  /**
   * Patches a specific section of the artifact with replacement content.
   */
  patch(artifact: string, sectionId: string, replacement: string): string;
}
