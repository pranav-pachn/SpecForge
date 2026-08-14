import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

export interface RawFileDiff {
  filePath: string;
  unifiedDiff: string;
  before: string;
  after: string;
}

export class GitDiffProvider {
  /**
   * Retrieves diffs for all modified files in the given workspace path.
   * Compares the working tree against HEAD.
   */
  async getWorkspaceDiff(workspacePath: string): Promise<RawFileDiff[]> {
    try {
      // 1. Get list of modified files (unstaged + staged)
      const { stdout: nameStatusOut } = await execAsync("git diff HEAD --name-only", { cwd: workspacePath });
      const files = nameStatusOut.trim().split("\n").filter(Boolean);
      
      const diffs: RawFileDiff[] = [];
      
      for (const file of files) {
        // 2. Get the unified diff for each file
        const { stdout: diffOut } = await execAsync(`git diff HEAD -- "${file}"`, { cwd: workspacePath });
        
        // 3. Get before/after contents
        let before = "";
        let after = "";
        
        try {
          // Get 'before' content from HEAD
          const { stdout: beforeOut } = await execAsync(`git show HEAD:"${file}"`, { cwd: workspacePath });
          before = beforeOut;
        } catch (err) {
          // File might be new
          before = "";
        }
        
        try {
          // Get 'after' content from working tree
          after = await fs.readFile(path.join(workspacePath, file), 'utf-8');
        } catch (err) {
          // File might be deleted
          after = "";
        }
        
        diffs.push({
          filePath: file,
          unifiedDiff: diffOut,
          before,
          after
        });
      }
      
      return diffs;
    } catch (err) {
      console.error("Failed to get git diff:", err);
      return [];
    }
  }
}
