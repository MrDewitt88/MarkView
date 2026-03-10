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
  if (typeof data.style === "string") frontmatter.style = data.style;
  if (Array.isArray(data.include)) {
    frontmatter.include = data.include.filter(
      (item: unknown): item is string => typeof item === "string",
    );
  }
  if (data.vars && typeof data.vars === "object" && !Array.isArray(data.vars)) {
    const vars: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.vars as Record<string, unknown>)) {
      vars[k] = String(v);
    }
    frontmatter.vars = vars;
  }

  if (typeof data.qr === "string") frontmatter.qr = data.qr;
  if (
    data.qrPosition === "footer-right" ||
    data.qrPosition === "footer-left" ||
    data.qrPosition === "footer-center"
  ) {
    frontmatter.qrPosition = data.qrPosition;
  }

  if (data.collab && typeof data.collab === "object") {
    const c = data.collab as Record<string, unknown>;
    frontmatter.collab = {
      channel: typeof c.channel === "string" ? c.channel : undefined,
      sync: typeof c.sync === "boolean" ? c.sync : undefined,
    };
  }

  return {
    content: result.content,
    frontmatter,
  };
}
