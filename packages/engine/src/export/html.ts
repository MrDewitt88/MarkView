import { render, generateHeaderHtml, generateFooterHtml } from "../pipeline.js";
import type { ExportOptions } from "../types.js";
import { buildStyles } from "../templates/index.js";

/**
 * Export Markdown to a standalone HTML file with inlined CSS.
 * Mermaid diagrams are already rendered as SVG by the pipeline.
 * Returns a single self-contained HTML string.
 */
export async function exportHtml(
  markdown: string,
  options?: ExportOptions,
): Promise<string> {
  const result = await render(markdown, { basePath: options?.basePath });

  const title = result.frontmatter.title ?? "Document";
  const headerHtml = generateHeaderHtml(result.frontmatter);
  const footerHtml = generateFooterHtml(result.frontmatter);

  // Use template override from options if provided, otherwise use from render result
  const css = options?.template
    ? buildStyles(options.template, result.frontmatter.font, result.frontmatter.fontSize)
    : result.css;

  const escapedTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
${css}
  </style>
</head>
<body>
  <div class="markview-document">
    ${headerHtml}
    <article class="markview-content">
${result.html}
    </article>
    ${footerHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
