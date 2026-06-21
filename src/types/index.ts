import { Prisma } from "@prisma/client";

// Prisma-generated types
export type {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Workflow,
  Artifact,
  ArtifactVersion,
  ClarificationQuestion,
  ClarificationAnswer,
  Task,
  TaskDependency,
  ExecutionPack,
  ReviewCheck,
  ValidationCheck,
  DriftEvent,
  ToolProfile,
} from "@prisma/client";

// Enums
export {
  WorkflowStatus,
  ArtifactType,
  ArtifactVersionStatus,
  TaskStatus,
  ClarificationStatus,
  ReviewCheckType,
  CheckStatus,
  DriftEntityType,
  ToolName,
} from "@prisma/client";

// Compound types (with relations)
const workflowWithRelations = Prisma.validator<Prisma.WorkflowDefaultArgs>()({
  include: {
    artifacts: true,
    tasks: true,
  },
});
export type WorkflowWithRelations = Prisma.WorkflowGetPayload<typeof workflowWithRelations>;

const artifactWithVersions = Prisma.validator<Prisma.ArtifactDefaultArgs>()({
  include: {
    versions: {
      orderBy: { version: 'desc' },
    },
  },
});
export type ArtifactWithVersions = Prisma.ArtifactGetPayload<typeof artifactWithVersions>;

const taskWithDependencies = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    dependencies: { include: { dependsOn: true } },
    dependsOn: { include: { task: true } },
  },
});
export type TaskWithDependencies = Prisma.TaskGetPayload<typeof taskWithDependencies>;

// UI specific types
export type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

export type BreadcrumbItem = {
  title: string;
  href?: string;
};

export type StatusBadgeProps = {
  status: string;
  className?: string;
};