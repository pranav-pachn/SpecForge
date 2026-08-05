export type DomainEventType =
  // Workflow Domain
  | "WorkflowCreated"
  | "WorkflowStarted"
  | "WorkflowCompleted"
  | "WorkflowFailed"
  // Specification Domain
  | "SpecificationCreated"
  | "SpecificationApproved"
  // Architecture Domain
  | "ArchitectureGenerated"
  // Task Domain
  | "TasksGenerated"
  // Graph Domain
  | "NodeCreated"
  | "NodeUpdated"
  | "EdgeCreated"
  // Execution Domain
  | "ExecutionPackGenerated"
  | "ResourceUtilized"
  // Review Domain
  | "ReviewCompleted"
  // Validation Domain
  | "ValidationCompleted"
  // Drift Domain
  | "DriftDetected"
  | "DriftResolved"
  // Governance Domain
  | "ApprovalRequested"
  | "ApprovalStepCompleted"
  | "PolicyCreated"
  // Organization Domain
  | "MemberInvited"
  | "MemberJoined"
  // Wildcard for debugging
  | "*";
