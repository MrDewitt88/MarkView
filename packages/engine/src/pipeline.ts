import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import type { Root } from "hast";

import type { RenderResult, FrontmatterConfig } from "./types.js";
import { parseFrontmatter } from "./plugins/frontmatter.js";
import { highlightCodeBlocks } from "./plugins/highlight.js";
import { extractToc } from "./plugins/toc.js";
import { processMermaidBlocks } from "./plugins/mermaid.js";
import { buildStyles } from "./templates/index.js";
import { resolveVariables } from "./plugins/variables.js";
// Lazy-imported to avoid pulling fs/path into browser bundles.
// The variable indirection prevents bundlers from statically resolving the import.
const _includesPath = "./plugins/includes.js";
const loadIncludes = () => import(/* @vite-ignore */ _includesPath) as Promise<typeof import("./plugins/includes.js")>;

/**
 * Render Markdown to HTML with full plugin pipeline:
 * remark-parse -> remark-gfm -> remark-frontmatter -> remark-rehype -> rehype-raw -> rehype-stringify
 *
 * Integrates: frontmatter parsing, code highlighting (shiki), TOC extraction, mermaid diagrams.
 * Includes template CSS based on frontmatter "template" field.
 */
export async function render(
  markdown: string,
  options?: { basePath?: string },
): Promise<RenderResult> {
  // 1. Parse frontmatter separately (gray-matter)
  let { content: rawContent, frontmatter } = parseFrontmatter(markdown);

  // 1a. Resolve includes if present and basePath is provided
  if (frontmatter.include?.length && options?.basePath) {
    const { resolveIncludes } = await loadIncludes();
    rawContent = await resolveIncludes(markdown, options.basePath);
  }

  // 1b. Resolve {{variables}} in content
  const content = frontmatter.vars
    ? resolveVariables(rawContent, frontmatter)
    : rawContent;

  // 2. Build the unified pipeline
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeRaw)
    .use(rehypeStringify, { allowDangerousHtml: true });

  // 3. Process markdown to hast (intermediate) so we can run custom plugins
  const mdast = processor.parse(content);
  const hastResult = await processor.run(mdast);
  const hast = hastResult as Root;

  // 4. Run custom hast plugins
  // Extract TOC (and add ids to headings)
  const toc = extractToc(hast);

  // Process mermaid blocks
  await processMermaidBlocks(hast);

  // Highlight code blocks with shiki
  await highlightCodeBlocks(hast);

  // 5. Stringify to HTML
  const html = processor.stringify(hast) as string;

  // 6. Build template CSS (from frontmatter or default)
  let css = buildStyles(
    frontmatter.template,
    frontmatter.font,
    frontmatter.fontSize,
  );

  // 7. Append custom CSS from frontmatter style field
  if (frontmatter.style) {
    css += `\n/* Custom frontmatter styles */\n${frontmatter.style}`;
  }

  return {
    html,
    css,
    frontmatter,
    toc,
  };
}

/**
 * Replace template variables in header/footer strings.
 * Supported variables: {{title}}, {{author}}, {{date}}, {{page}}, {{pages}}
 */
export function replaceTemplateVariables(
  template: string,
  frontmatter: FrontmatterConfig,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return template
    .replace(/\{\{title\}\}/g, frontmatter.title ?? "")
    .replace(/\{\{author\}\}/g, frontmatter.author ?? "")
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{page\}\}/g, '<span class="pageNumber"></span>')
    .replace(/\{\{pages\}\}/g, '<span class="totalPages"></span>');
}

/**
 * Generate header HTML element from frontmatter header template.
 */
export function generateHeaderHtml(frontmatter: FrontmatterConfig): string {
  if (!frontmatter.header) {
    return "";
  }
  const content = replaceTemplateVariables(frontmatter.header, frontmatter);
  return `<div class="markview-header">${content}</div>`;
}

/**
 * Generate footer HTML element from frontmatter footer template.
 */
export function generateFooterHtml(frontmatter: FrontmatterConfig): string {
  if (!frontmatter.footer) {
    return "";
  }
  const content = replaceTemplateVariables(frontmatter.footer, frontmatter);
  return `<div class="markview-footer">${content}</div>`;
}
