export interface ActivityItem {
  id: string;
  icon: string;         // E.g. Lucide icon name like "CheckCircle", "GitCommit", "FileText"
  title: string;        // E.g. "Workflow Created", "Review Approved"
  description: string;  // E.g. "Pranav created Workflow Authentication"
  timestamp: Date;
  actor?: string;       // User name or "System"
  actorId?: string;
  link?: string;        // Optional deep link into the entity
  correlationId: string;
}
