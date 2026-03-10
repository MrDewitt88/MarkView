import matter from "gray-matter";
import type { LintResult, LintIssue, LintOptions } from "../types.js";
import { getAvailableTemplates } from "../templates/index.js";
import { ensureDomShim } from "../dom-shim.js";

const KNOWN_FRONTMATTER_FIELDS = new Set([
  "title",
  "author",
  "template",
  "header",
  "footer",
  "font",
  "fontSize",
  "font-size",
  "lineHeight",
  "line-height",
  "toc",
  "signature",
  "date",
  "version",
  "tags",
]);

/**
 * Lint a Markdown string for common issues:
 * - Frontmatter: YAML valid, known fields, template exists
 * - Mermaid: Syntax correct (validate mode via mermaid.parse)
 * - Links: Internal links ([text](#heading)) refer to existing headings
 * - Images: Paths reachable (only in strict mode)
 *
 * Returns a LintResult with all discovered issues.
 */
export async function lint(
  markdown: string,
  options?: LintOptions,
): Promise<LintResult> {
  const issues: LintIssue[] = [];
  const lines = markdown.split("\n");
  const strict = options?.strict ?? false;

  // 1. Frontmatter checks
  lintFrontmatter(markdown, lines, issues);

  // 2. Mermaid checks
  await lintMermaid(lines, issues);

  // 3. Internal link checks
  lintInternalLinks(lines, issues);

  // 4. Image path checks (strict mode only)
  if (strict) {
    lintImagePaths(lines, issues);
  }

  return { file: "", issues };
}

/**
 * Lint frontmatter: YAML valid, known fields, template exists.
 */
function lintFrontmatter(
  markdown: string,
  lines: string[],
  issues: LintIssue[],
): void {
  if (!markdown.startsWith("---")) {
    return;
  }

  // Find closing ---
  const closingIndex = findFrontmatterEnd(lines);
  if (closingIndex === -1) {
    issues.push({
      line: 1,
      message: "Unclosed frontmatter block",
      severity: "error",
    });
    return;
  }

  // Try parsing YAML
  try {
    const parsed = matter(markdown);
    const data = parsed.data as Record<string, unknown>;

    // Check for unknown fields
    for (const key of Object.keys(data)) {
      if (!KNOWN_FRONTMATTER_FIELDS.has(key)) {
        issues.push({
          line: 1,
          message: `Unknown frontmatter field: "${key}"`,
          severity: "warning",
        });
      }
    }

    // Check if template exists
    if (typeof data.template === "string") {
      const templates = getAvailableTemplates();
      if (!templates.includes(data.template)) {
        issues.push({
          line: 1,
          message: `Unknown template: "${data.template}". Available: ${templates.join(", ")}`,
          severity: "error",
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    issues.push({
      line: 1,
      message: `Invalid YAML in frontmatter: ${msg}`,
      severity: "error",
    });
  }
}

/**
 * Find the line index of the closing --- for frontmatter.
 * Returns -1 if not found.
 */
function findFrontmatterEnd(lines: string[]): number {
  if (lines[0]?.trim() !== "---") return -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      return i;
    }
  }
  return -1;
}

/**
 * Lint mermaid code blocks by attempting to parse them.
 */
async function lintMermaid(
  lines: string[],
  issues: LintIssue[],
): Promise<void> {
  const mermaidBlocks = extractCodeBlocks(lines, "mermaid");

  if (mermaidBlocks.length === 0) {
    return;
  }

  let mermaidApi: { parse: (text: string) => Promise<unknown>; initialize: (config: Record<string, unknown>) => void } | null = null;
  try {
    await ensureDomShim();
    const mermaid = await import("mermaid");
    mermaidApi = mermaid.default as unknown as { parse: (text: string) => Promise<unknown>; initialize: (config: Record<string, unknown>) => void };
    mermaidApi.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
    });
  } catch {
    // Mermaid not available, skip validation
    return;
  }

  for (const block of mermaidBlocks) {
    try {
      await mermaidApi.parse(block.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      issues.push({
        line: block.startLine,
        message: `Invalid Mermaid syntax: ${msg}`,
        severity: "error",
      });
    }
  }
}

interface CodeBlock {
  startLine: number;
  content: string;
}

/**
 * Extract fenced code blocks for a given language from the lines.
 */
function extractCodeBlocks(lines: string[], language: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  let inBlock = false;
  let blockStart = 0;
  let blockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (!inBlock) {
      const fenceMatch = /^```(\w+)/.exec(line);
      if (fenceMatch && fenceMatch[1] === language) {
        inBlock = true;
        blockStart = i + 1; // 1-indexed
        blockLines = [];
      }
    } else {
      if (line.trim() === "```") {
        blocks.push({
          startLine: blockStart,
          content: blockLines.join("\n"),
        });
        inBlock = false;
        blockLines = [];
      } else {
        blockLines.push(line);
      }
    }
  }

  // Unclosed block
  if (inBlock) {
    blocks.push({
      startLine: blockStart,
      content: blockLines.join("\n"),
    });
  }

  return blocks;
}

/**
 * Lint internal links: [text](#heading) should point to an existing heading.
 */
function lintInternalLinks(lines: string[], issues: LintIssue[]): void {
  // Collect heading IDs
  const headingIds = new Set<string>();
  for (const line of lines) {
    const headingMatch = /^#{1,6}\s+(.+)$/.exec(line ?? "");
    if (headingMatch?.[1]) {
      const id = headingMatch[1]
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      headingIds.add(id);
    }
  }

  // Check internal links
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const linkRegex = /\[([^\]]*)\]\(#([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(line)) !== null) {
      const anchor = match[2];
      if (anchor && !headingIds.has(anchor)) {
        issues.push({
          line: i + 1,
          message: `Broken internal link: #${anchor}`,
          severity: "warning",
        });
      }
    }
  }
}

/**
 * Lint image paths: check if image references look valid.
 * Only runs in strict mode.
 */
function lintImagePaths(lines: string[], issues: LintIssue[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(line)) !== null) {
      const imgPath = match[2];
      if (imgPath) {
        // Skip URLs
        if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
          continue;
        }
        // For local paths, we flag them as needing verification
        // (actual file system check would need a base path)
        issues.push({
          line: i + 1,
          message: `Image path should be verified: ${imgPath}`,
          severity: "warning",
        });
      }
    }
  }
}
