import { render, generateHeaderHtml, generateFooterHtml } from "../pipeline.js";
import type { ExportOptions } from "../types.js";
import { buildStyles } from "../templates/index.js";
import juice from "juice";

/**
 * Export Markdown to an email-safe HTML string with all CSS inlined.
 * Uses `juice` to inline styles into element `style` attributes,
 * strips <script> tags, and avoids external resources.
 */
export async function exportEmail(
  markdown: string,
  options?: ExportOptions,
): Promise<string> {
  const result = await render(markdown, { basePath: options?.basePath });

  const title = result.frontmatter.title ?? "Document";
  const headerHtml = generateHeaderHtml(result.frontmatter);
  const footerHtml = generateFooterHtml(result.frontmatter);

  const css = options?.template
    ? buildStyles(options.template, result.frontmatter.font, result.frontmatter.fontSize)
    : result.css;

  const escapedTitle = escapeHtml(title);

  // Build a full HTML document so juice can resolve selectors
  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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

  // Inline all CSS into style attributes
  const inlined = juice(rawHtml, {
    removeStyleTags: true,
    preserveMediaQueries: false,
    preserveFontFaces: false,
  });

  // Strip any <script> tags for email safety
  const sanitized = inlined.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  return sanitized;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
