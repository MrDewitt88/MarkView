import type { FrontmatterConfig } from "../types.js";

/**
 * Resolve {{variable}} placeholders in markdown content.
 * User-defined vars from frontmatter override built-in vars.
 */
export function resolveVariables(
  content: string,
  frontmatter: FrontmatterConfig,
  filePath?: string,
): string {
  // Skip code blocks to avoid replacing inside them
  const codeBlocks: string[] = [];
  const withoutCode = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
  });

  const now = new Date();
  const wordCount = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^---[\s\S]*?---/m, "")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const builtins: Record<string, string> = {
    date: now.toISOString().slice(0, 10),
    "date:long": now.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    filename: filePath ? filePath.split("/").pop() ?? "" : "",
    title: frontmatter.title ?? "",
    author: frontmatter.author ?? "",
    wordcount: wordCount.toLocaleString("de-DE"),
    readtime: `${readTime} min`,
  };

  const vars = { ...builtins, ...(frontmatter.vars ?? {}) };

  const resolved = withoutCode.replace(/\{\{(\S+?)\}\}/g, (_match, key: string) => {
    return vars[key] ?? _match;
  });

  // Restore code blocks
  return resolved.replace(/%%CODEBLOCK_(\d+)%%/g, (_match, idx: string) => {
    return codeBlocks[parseInt(idx, 10)] ?? "";
  });
}
