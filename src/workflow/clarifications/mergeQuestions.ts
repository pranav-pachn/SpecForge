export function questionFingerprint(question: string): string {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

export interface ExistingQuestion {
  id: string;
  question: string;
  status: string;
}

export interface IncomingQuestion {
  question: string;
  category?: string;
  kind?: string;
  options?: unknown;
  rationale?: string;
  impact?: unknown;
}

export interface QuestionMergePlan {
  keepIds: string[];
  deleteIds: string[];
  create: IncomingQuestion[];
}

/** Answered questions are kept even if the model stops asking them. Identical open questions are not recreated. */
export function planQuestionMerge(existing: ExistingQuestion[], incoming: IncomingQuestion[]): QuestionMergePlan {
  const incomingFp = new Set(incoming.map((q) => questionFingerprint(q.question)));
  const existingFp = new Set(existing.map((q) => questionFingerprint(q.question)));

  const keepIds = existing
    .filter((q) => q.status === "ANSWERED" || incomingFp.has(questionFingerprint(q.question)))
    .map((q) => q.id);

  const deleteIds = existing
    .filter((q) => q.status !== "ANSWERED" && !incomingFp.has(questionFingerprint(q.question)))
    .map((q) => q.id);

  const create = incoming.filter((q) => !existingFp.has(questionFingerprint(q.question)));

  return { keepIds, deleteIds, create };
}

export function isBlockingQuestion(question: {
  status: string;
  category?: string | null;
  impact?: unknown;
}): boolean {
  if (question.status !== "OPEN") return false;
  const kind = (question.category ?? "").toUpperCase();
  if (kind === "CONFLICT" || kind === "MISSING_DECISION") return true;
  if (impactIsRequired(question.impact)) return true;
  return false;
}

function impactIsRequired(impact: unknown): boolean {
  if (!impact || typeof impact !== "object") return false;
  return (impact as { isRequired?: boolean }).isRequired === true;
}
