export enum NodeType {
  REQUIREMENT = "REQUIREMENT",
  ARCHITECTURE = "ARCHITECTURE",
  TASK = "TASK",
  FILE = "FILE",
  TEST = "TEST",
  API = "API",
  DATABASE = "DATABASE",
  REVIEW = "REVIEW",
  VALIDATION = "VALIDATION",
  DEPLOYMENT = "DEPLOYMENT",
  DECISION = "DECISION",
  PR = "PR",
  COMMIT = "COMMIT",
  EXECUTION_PACK = "EXECUTION_PACK",
}

export enum EdgeType {
  IMPLEMENTS = "IMPLEMENTS",
  DEPENDS_ON = "DEPENDS_ON",
  VALIDATES = "VALIDATES",
  TESTS = "TESTS",
  CREATES = "CREATES",
  SUPERSEDES = "SUPERSEDES",
  RELATES_TO = "RELATES_TO",
  REVIEWED_BY = "REVIEWED_BY",
  DEPLOYED_BY = "DEPLOYED_BY",
  DERIVED_FROM = "DERIVED_FROM",
  CONTAINS = "CONTAINS",
}

export enum NodeStatus {
  ACTIVE = "ACTIVE",
  STALE = "STALE",
  SUPERSEDED = "SUPERSEDED",
  PENDING = "PENDING",
  ARCHIVED = "ARCHIVED",
}

export interface GraphNode {
  id: string; // The underlying entity ID (e.g., Task.id, KnowledgeNode.id)
  workflowId: string;
  type: NodeType;
  title: string;
  status: string | NodeStatus;
  metadata: Record<string, any>;
  embedding?: number[] | null;
  createdAt: Date;
}

export interface GraphEdge {
  id: string; // Usually a combination of source-target-type or a database ID
  sourceId: string;
  targetId: string;
  type: EdgeType;
  weight: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}
