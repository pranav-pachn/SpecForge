export interface AnalysisCategory {
  id: string;
  title: string;
  emoji: string;
  weight: number;
  score: number;
  items: AnalysisCheckItem[];
}

export interface AnalysisCheckItem {
  status: 'pass' | 'warn' | 'fail';
  label: string;
  detail?: string;
}

export interface AnalysisIssue {
  severity: 'warning' | 'critical' | 'info';
  category: string;
  title: string;
  description: string;
  linkedRequirementId?: string;
  linkedTaskId?: string;
  recommendation?: string;
}

export interface AnalysisResult {
  categories: AnalysisCategory[];
  overallScore: number;
  issues: AnalysisIssue[];
  generatedAt: Date;
}

export interface Analyzer<TContext> {
  analyze(context: TContext): Promise<AnalysisResult>;
}

export function computeWeightedScore(categories: { weight: number; score: number }[]): number {
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  if (totalWeight === 0) return 0;
  
  const rawScore = categories.reduce((sum, cat) => sum + (cat.score * cat.weight), 0);
  return Math.round(rawScore / totalWeight);
}
