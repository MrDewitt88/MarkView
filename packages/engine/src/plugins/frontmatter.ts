import matter from "gray-matter";
import type { FrontmatterConfig } from "../types.js";

export function parseFrontmatter(markdown: string): {
  content: string;
  frontmatter: FrontmatterConfig;
} {
  const result = matter(markdown);

  const frontmatter: FrontmatterConfig = {};
  const data = result.data as Record<string, unknown>;

  if (typeof data.title === "string") frontmatter.title = data.title;
  if (typeof data.author === "string") frontmatter.author = data.author;
  if (typeof data.template === "string") frontmatter.template = data.template;
  if (typeof data.header === "string") frontmatter.header = data.header;
  if (typeof data.footer === "string") frontmatter.footer = data.footer;
  if (typeof data.font === "string") frontmatter.font = data.font;
  if (typeof data.fontSize === "string") frontmatter.fontSize = data.fontSize;
  if (typeof data.lineHeight === "string")
    frontmatter.lineHeight = data.lineHeight;
  if (typeof data.toc === "boolean") frontmatter.toc = data.toc;
  if (typeof data.signature === "boolean")
    frontmatter.signature = data.signature;

  return {
    content: result.content,
    frontmatter,
  };
}
