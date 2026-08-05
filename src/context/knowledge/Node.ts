export interface KnowledgeNode {
  id: string;
  workflowId: string;
  type: string;
  artifactId?: string | null;
  version: number;
  status: string;
  title: string;
  content: string;
  embedding?: number[] | null;
  importanceScore: number;
  metadata: any;
  createdAt: Date;
}

export interface KnowledgeRelationship {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
}

export interface NodeWithRelations extends KnowledgeNode {
  sourceRelations?: KnowledgeRelationship[];
  targetRelations?: KnowledgeRelationship[];
}

export interface RetrievedNode extends KnowledgeNode {
  similarity: number;
  finalScore: number;
}
