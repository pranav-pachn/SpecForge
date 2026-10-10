/**
 * Minimal unified-diff parser with new-file line mapping (blueprint §5.2).
 *
 * Pure and dependency-free. It extracts changed files, hunks, and per-line
 * old/new line numbers so a finding can be mapped to a real line in the head
 * revision — or left unmapped when the mapping is unreliable, rather than
 * fabricating a location.
 */

export type DiffLineType = "context" | "add" | "del";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  /** 1-based line number in the old file, or null for added lines. */
  oldLine: number | null;
  /** 1-based line number in the new file, or null for deleted lines. */
  newLine: number | null;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export type FileChangeType = "added" | "deleted" | "modified" | "renamed";

export interface ParsedFile {
  oldPath: string | null;
  newPath: string | null;
  changeType: FileChangeType;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export interface ParsedDiff {
  files: ParsedFile[];
  totalAdditions: number;
  totalDeletions: number;
}

const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

function stripPrefix(path: string): string {
  // Drops the conventional a/ or b/ diff prefix; leaves /dev/null untouched.
  if (path === "/dev/null") return path;
  return path.replace(/^[ab]\//, "");
}

export function parseUnifiedDiff(diff: string): ParsedDiff {
  const lines = diff.split(/\r?\n/);
  const files: ParsedFile[] = [];
  let current: ParsedFile | null = null;
  let hunk: DiffHunk | null = null;
  let oldCursor = 0;
  let newCursor = 0;

  const closeHunk = () => {
    if (current && hunk) current.hunks.push(hunk);
    hunk = null;
  };
  const closeFile = () => {
    closeHunk();
    if (current) files.push(current);
    current = null;
  };

  for (const raw of lines) {
    if (raw.startsWith("diff --git")) {
      closeFile();
      current = { oldPath: null, newPath: null, changeType: "modified", hunks: [], additions: 0, deletions: 0 };
      continue;
    }

    // A bare "--- / +++" pair without a preceding "diff --git" still starts a file.
    if (raw.startsWith("--- ")) {
      if (!current) {
        current = { oldPath: null, newPath: null, changeType: "modified", hunks: [], additions: 0, deletions: 0 };
      }
      closeHunk();
      const p = stripPrefix(raw.slice(4).trim());
      current.oldPath = p === "/dev/null" ? null : p;
      continue;
    }
    if (raw.startsWith("+++ ")) {
      if (current) {
        const p = stripPrefix(raw.slice(4).trim());
        current.newPath = p === "/dev/null" ? null : p;
        if (current.oldPath === null && current.newPath !== null) current.changeType = "added";
        else if (current.oldPath !== null && current.newPath === null) current.changeType = "deleted";
        else if (current.oldPath !== current.newPath) current.changeType = "renamed";
        else current.changeType = "modified";
      }
      continue;
    }

    const header = HUNK_HEADER.exec(raw);
    if (header && current) {
      closeHunk();
      const oldStart = Number(header[1]);
      const oldLines = header[2] === undefined ? 1 : Number(header[2]);
      const newStart = Number(header[3]);
      const newLines = header[4] === undefined ? 1 : Number(header[4]);
      hunk = { oldStart, oldLines, newStart, newLines, lines: [] };
      oldCursor = oldStart;
      newCursor = newStart;
      continue;
    }

    if (!current || !hunk) continue; // ignore index/mode/preamble noise

    const marker = raw[0];
    const content = raw.slice(1);
    if (marker === "+") {
      hunk.lines.push({ type: "add", content, oldLine: null, newLine: newCursor });
      current.additions++;
      newCursor++;
    } else if (marker === "-") {
      hunk.lines.push({ type: "del", content, oldLine: oldCursor, newLine: null });
      current.deletions++;
      oldCursor++;
    } else if (marker === " ") {
      // A blank context line is a single space in unified diffs; a truly empty
      // string is a separator/trailing-newline artifact and is ignored.
      hunk.lines.push({ type: "context", content, oldLine: oldCursor, newLine: newCursor });
      oldCursor++;
      newCursor++;
    } else if (raw.startsWith("\\")) {
      // "\ No newline at end of file" — metadata, not a content line.
      continue;
    }
  }

  closeFile();

  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);
  return { files, totalAdditions, totalDeletions };
}

/** The set of new-file line numbers that were added or are context — i.e. exist in head. */
export function changedLineNumbers(file: ParsedFile): Set<number> {
  const set = new Set<number>();
  for (const h of file.hunks) {
    for (const l of h.lines) {
      if (l.type === "add" && l.newLine !== null) set.add(l.newLine);
    }
  }
  return set;
}

/**
 * True when (filePath,line) refers to a line actually introduced by this diff.
 * Used to reject AI findings that cite lines outside the change (blueprint §5.6).
 */
export function isLineInDiff(diff: ParsedDiff, filePath: string, line: number): boolean {
  const file = diff.files.find((f) => f.newPath === filePath);
  if (!file) return false;
  return changedLineNumbers(file).has(line);
}
