import { readFile, readdir, stat } from "fs/promises";
import { resolve, join, extname } from "path";

export interface SearchOptions {
  headingsOnly?: boolean;
  context?: number;
}

export interface SearchResult {
  file: string;
  line: number;
  matchText: string;
  contextBefore: string[];
  contextAfter: string[];
  heading: string;
}

/**
 * Search for a query string across multiple markdown files.
 */
export async function searchMarkdown(
  query: string,
  files: string[],
  options?: SearchOptions,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const ctx = options?.context ?? 0;
  const queryLower = query.toLowerCase();

  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");
      let currentHeading = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;

        // Track current heading
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
          currentHeading = headingMatch[2]!.trim();
        }

        // Check if line matches
        if (options?.headingsOnly && !headingMatch) continue;

        if (line.toLowerCase().includes(queryLower)) {
          results.push({
            file,
            line: i + 1,
            matchText: line.trim(),
            contextBefore: lines.slice(Math.max(0, i - ctx), i).map((l) => l.trimEnd()),
            contextAfter: lines.slice(i + 1, i + 1 + ctx).map((l) => l.trimEnd()),
            heading: currentHeading,
          });
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return results;
}

/**
 * Recursively find all .md files in a directory.
 */
export async function resolveMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath);
    for (const entry of entries) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const fullPath = join(dirPath, entry);
      const s = await stat(fullPath);
      if (s.isDirectory()) {
        await walk(fullPath);
      } else if (extname(entry) === ".md") {
        files.push(fullPath);
      }
    }
  }

  await walk(resolve(dir));
  return files.sort();
}
