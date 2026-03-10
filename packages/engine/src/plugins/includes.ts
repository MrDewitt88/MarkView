import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { parseFrontmatter } from "./frontmatter.js";

/**
 * Resolve include directives in frontmatter.
 * Reads referenced files and concatenates their content.
 * Supports recursive includes up to maxDepth levels.
 */
export async function resolveIncludes(
  markdown: string,
  basePath: string,
  maxDepth = 5,
  visited = new Set<string>(),
): Promise<string> {
  // Parse frontmatter to check for include field
  const { content, frontmatter } = parseFrontmatter(markdown);

  if (!frontmatter.include?.length || maxDepth <= 0) {
    return content;
  }

  const parts: string[] = [content];

  for (const includePath of frontmatter.include) {
    const absPath = resolve(basePath, includePath);

    // Circular reference protection
    if (visited.has(absPath)) continue;
    visited.add(absPath);

    try {
      const includeContent = await readFile(absPath, "utf-8");
      // Recursively resolve includes in the included file
      const resolved = await resolveIncludes(
        includeContent,
        dirname(absPath),
        maxDepth - 1,
        visited,
      );
      parts.push(resolved);
    } catch {
      parts.push(`\n> **Warning:** Could not include file: ${includePath}\n`);
    }
  }

  return parts.join("\n\n");
}
