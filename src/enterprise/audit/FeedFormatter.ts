import { AuditLog, User } from "@prisma/client";
import { ActivityItem } from "./ActivityItem";
import { PlatformEventType } from "../events/PlatformEventBus";

export class FeedFormatter {
  static format(log: AuditLog & { user?: Pick<User, "name" | "id"> | null }): ActivityItem {
    const actorName = log.user?.name || log.userId || "System";
    const type = log.eventType as PlatformEventType | string;

    let icon = "Activity";
    let title = type.replace(/_/g, " ");
    let description = `${actorName} performed ${title} on ${log.entityType}`;
    let link = undefined;

    switch (type) {
      case "WORKFLOW_CREATED":
        icon = "FolderPlus";
        title = "Workflow Created";
        description = `${actorName} created a new Workflow`;
        link = `/workflow/${log.entityId}`;
        break;
      case "APPROVAL_REQUESTED":
        icon = "ShieldAlert";
        title = "Approval Requested";
        description = `${actorName} requested approval for ${log.entityType}`;
        break;
      case "APPROVAL_COMPLETED":
        icon = "CheckCircle";
        title = "Approval Granted";
        description = `Approval was fully granted for ${log.entityType}`;
        break;
      case "DRIFT_DETECTED":
        icon = "AlertTriangle";
        title = "Architecture Drift";
        description = `System detected a drift in architecture`;
        break;
      case "SPEC_APPROVED":
        icon = "FileCheck";
        title = "Specification Approved";
        description = `${actorName} approved the specifications`;
        break;
      case "REVIEW_COMPLETED":
        icon = "ClipboardCheck";
        title = "Engineering Review Completed";
        description = `System completed an automated engineering review`;
        break;
      // Map other events as needed
    }

    return {
      id: log.id,
      icon,
      title,
      description,
      timestamp: log.createdAt,
      actor: actorName,
      actorId: log.user?.id,
      correlationId: log.correlationId,
      link
    };
  }
}
