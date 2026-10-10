import { describe, expect, it } from "vitest";
import {
  parseUnifiedDiff,
  changedLineNumbers,
  isLineInDiff,
} from "@/server/analysis/diffParser";

const modifyDiff = `diff --git a/src/example.ts b/src/example.ts
index 1111111..2222222 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -1,4 +1,5 @@
 const a = 1;
-const b = 2;
+const b = 3;
+const c = 4;
 const d = 5;
`;

const addDiff = `diff --git a/src/new.ts b/src/new.ts
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/src/new.ts
@@ -0,0 +1,2 @@
+export const x = 1;
+export const y = 2;
`;

const deleteDiff = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index 4444444..0000000
--- a/src/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-export const gone = true;
-export const alsoGone = false;
`;

describe("parseUnifiedDiff", () => {
  it("parses a modified file with correct new-line numbers", () => {
    const parsed = parseUnifiedDiff(modifyDiff);
    expect(parsed.files).toHaveLength(1);
    const file = parsed.files[0];
    expect(file.changeType).toBe("modified");
    expect(file.newPath).toBe("src/example.ts");
    expect(file.additions).toBe(2);
    expect(file.deletions).toBe(1);

    const added = file.hunks[0].lines.filter((l) => l.type === "add");
    expect(added.map((l) => ({ content: l.content, newLine: l.newLine }))).toEqual([
      { content: "const b = 3;", newLine: 2 },
      { content: "const c = 4;", newLine: 3 },
    ]);

    const lastContext = file.hunks[0].lines.at(-1)!;
    expect(lastContext.type).toBe("context");
    expect(lastContext.newLine).toBe(4);
    expect(lastContext.oldLine).toBe(3);
  });

  it("detects an added file (old side is /dev/null)", () => {
    const parsed = parseUnifiedDiff(addDiff);
    const file = parsed.files[0];
    expect(file.changeType).toBe("added");
    expect(file.oldPath).toBeNull();
    expect(file.newPath).toBe("src/new.ts");
    expect(Array.from(changedLineNumbers(file))).toEqual([1, 2]);
  });

  it("detects a deleted file (new side is /dev/null)", () => {
    const parsed = parseUnifiedDiff(deleteDiff);
    const file = parsed.files[0];
    expect(file.changeType).toBe("deleted");
    expect(file.newPath).toBeNull();
    expect(file.deletions).toBe(2);
    expect(changedLineNumbers(file).size).toBe(0);
  });

  it("aggregates totals across multiple files", () => {
    const parsed = parseUnifiedDiff(`${modifyDiff}\n${addDiff}`);
    expect(parsed.files).toHaveLength(2);
    expect(parsed.totalAdditions).toBe(4);
    expect(parsed.totalDeletions).toBe(1);
  });

  it("handles a single-line hunk header without a count", () => {
    const diff = `--- a/f.ts
+++ b/f.ts
@@ -1 +1 @@
-old
+new
`;
    const parsed = parseUnifiedDiff(diff);
    const add = parsed.files[0].hunks[0].lines.find((l) => l.type === "add")!;
    expect(add.newLine).toBe(1);
  });

  it("returns no files for empty or non-diff input", () => {
    expect(parseUnifiedDiff("").files).toHaveLength(0);
    expect(parseUnifiedDiff("just some text\nnot a diff").files).toHaveLength(0);
  });
});

describe("isLineInDiff", () => {
  const parsed = parseUnifiedDiff(modifyDiff);

  it("is true for an added line in the change", () => {
    expect(isLineInDiff(parsed, "src/example.ts", 2)).toBe(true);
    expect(isLineInDiff(parsed, "src/example.ts", 3)).toBe(true);
  });

  it("is false for a context line that was not added", () => {
    expect(isLineInDiff(parsed, "src/example.ts", 1)).toBe(false);
    expect(isLineInDiff(parsed, "src/example.ts", 4)).toBe(false);
  });

  it("is false for an unknown file or out-of-range line", () => {
    expect(isLineInDiff(parsed, "src/other.ts", 2)).toBe(false);
    expect(isLineInDiff(parsed, "src/example.ts", 999)).toBe(false);
  });
});
