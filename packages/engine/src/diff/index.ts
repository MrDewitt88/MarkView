export interface DiffChunk {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface DiffResult {
  chunks: DiffChunk[];
  additions: number;
  deletions: number;
}

/**
 * Compute a line-level diff between two markdown strings.
 * Uses a simple LCS-based diff algorithm (no external dependencies).
 */
export function diffMarkdown(oldMd: string, newMd: string): DiffResult {
  const oldLines = oldMd.split("\n");
  const newLines = newMd.split("\n");

  // Simple LCS-based diff
  const lcs = computeLCS(oldLines, newLines);
  const chunks: DiffChunk[] = [];
  let additions = 0;
  let deletions = 0;

  let oi = 0, ni = 0, li = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (li < lcs.length && oi < oldLines.length && ni < newLines.length && oldLines[oi] === lcs[li] && newLines[ni] === lcs[li]) {
      chunks.push({ type: "unchanged", content: oldLines[oi], oldLine: oi + 1, newLine: ni + 1 });
      oi++; ni++; li++;
    } else if (li < lcs.length && oi < oldLines.length && oldLines[oi] !== lcs[li]) {
      chunks.push({ type: "removed", content: oldLines[oi], oldLine: oi + 1 });
      deletions++;
      oi++;
    } else if (li < lcs.length && ni < newLines.length && newLines[ni] !== lcs[li]) {
      chunks.push({ type: "added", content: newLines[ni], newLine: ni + 1 });
      additions++;
      ni++;
    } else if (oi < oldLines.length) {
      chunks.push({ type: "removed", content: oldLines[oi], oldLine: oi + 1 });
      deletions++;
      oi++;
    } else if (ni < newLines.length) {
      chunks.push({ type: "added", content: newLines[ni], newLine: ni + 1 });
      additions++;
      ni++;
    }
  }

  return { chunks, additions, deletions };
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length, n = b.length;
  // Use DP table (optimized for memory with two rows)
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const result: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}
