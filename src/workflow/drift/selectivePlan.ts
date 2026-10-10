export interface DriftEventRef {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
}

export interface RegenerationSelection {
  taskIds?: string[];
  eventIds?: string[];
}

export type SelectivePlan =
  | { ok: false; reason: string }
  | {
      ok: true;
      updateTaskIds: string[];
      resolveEventIds: string[];
      remainingOpen: number;
    };

export function planSelectiveRegeneration(
  openEvents: DriftEventRef[],
  selections: RegenerationSelection | undefined
): SelectivePlan {
  const taskIds = selections?.taskIds ?? [];
  const eventIds = selections?.eventIds ?? [];
  if (taskIds.length === 0 && eventIds.length === 0) {
    return {
      ok: false,
      reason: "selections are required. Refusing to mark every drift event resolved.",
    };
  }

  const selected = openEvents.filter(
    (event) => eventIds.includes(event.id) || (event.entityType === "TASK" && taskIds.includes(event.entityId))
  );

  return {
    ok: true,
    updateTaskIds: selected.filter((event) => event.entityType === "TASK").map((event) => event.entityId),
    resolveEventIds: selected.map((event) => event.id),
    remainingOpen: openEvents.length - selected.length,
  };
}
