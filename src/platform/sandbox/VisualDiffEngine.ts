export interface FileStory {
  filePath: string;
  before: string;
  after: string;
  unifiedDiff: string;
  
  // Rich context explaining *why* the file looks like this
  executionActions: string[];
  knowledgeUsed: string[]; // IDs of KnowledgeArtifacts
  promptVersion: string;
  
  // Post-execution quality metrics
  evaluationScore?: number;
  repairHistory: string[];
  confidence: number;
}

import { GitDiffProvider } from "./GitDiffProvider";
import { ReasoningEnricher } from "./ReasoningEnricher";

export class VisualDiffEngine {
  private gitDiffProvider: GitDiffProvider;
  private reasoningEnricher: ReasoningEnricher;

  constructor() {
    this.gitDiffProvider = new GitDiffProvider();
    this.reasoningEnricher = new ReasoningEnricher();
  }
  /**
   * Generates a "story" for every modified file, mapping raw diffs 
   * to the AI decisions and evaluations that produced them.
   */
  async generateDiff(workspaceId: string, workspacePath: string): Promise<FileStory[]> {
    // 1. Pull raw diffs from Workspace/Git
    const rawDiffs = await this.gitDiffProvider.getWorkspaceDiff(workspacePath);
    
    // 2. Enrich with AI Reasoning (via ReasoningEnricher)
    const enrichedDiffs = await this.reasoningEnricher.enrich(workspaceId, rawDiffs);
    
    return enrichedDiffs;
  }
}
