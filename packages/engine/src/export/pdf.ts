import { render, replaceTemplateVariables } from "../pipeline.js";
import type { ExportOptions, FrontmatterConfig } from "../types.js";
import { buildStyles } from "../templates/index.js";
import { launchBrowser } from "./browser.js";
import { generateQrSvg } from "../plugins/qrcode.js";

/**
 * Export Markdown to PDF using Playwright's headless Chromium.
 * Workflow: render() -> wrap HTML + CSS -> Playwright -> PDF Buffer
 *
 * This is the headless mode for CLI usage.
 * For Electron app, use webContents.printToPDF() instead.
 */
export async function exportPdf(
  markdown: string,
  options?: ExportOptions,
): Promise<Buffer> {
  const result = await render(markdown, { basePath: options?.basePath });

  const title = result.frontmatter.title ?? "Document";
  const css = options?.template
    ? buildStyles(options.template, result.frontmatter.font, result.frontmatter.fontSize)
    : result.css;

  // QR code: option override > frontmatter
  const qrUrl = options?.qr ?? result.frontmatter.qr;
  const qrPosition = options?.qrPosition ?? result.frontmatter.qrPosition ?? "footer-right";
  let qrHtml = "";
  if (qrUrl) {
    const qrSvg = await generateQrSvg(qrUrl);
    const alignment =
      qrPosition === "footer-left" ? "flex-start" :
      qrPosition === "footer-center" ? "center" : "flex-end";
    qrHtml = `<div class="markview-qr" style="display:flex;justify-content:${alignment};padding:12px 0;">${qrSvg}</div>`;
  }

  const fullHtml = buildPdfHtml(result.html, css, title, qrHtml);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle" });

    const pdfOptions = buildPdfOptions(result.frontmatter, options);
    const pdfBuffer = await page.pdf(pdfOptions);

    if (options?.password) {
      throw new Error(
        "Password-protected PDF export is not yet supported.\n" +
        "This feature requires pdf-lib for PDF encryption.\n" +
        "Install it with: npm install pdf-lib"
      );
    }

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

interface PlaywrightPdfOptions {
  format?: "Letter" | "Legal" | "Tabloid" | "Ledger" | "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6";
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

function buildPdfOptions(
  frontmatter: FrontmatterConfig,
  options?: ExportOptions,
): PlaywrightPdfOptions {
  const validFormats = ["Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3", "A4", "A5", "A6"] as const;
  type PaperFormat = (typeof validFormats)[number];

  const paperFormat = options?.paperFormat ?? "A4";
  const format = validFormats.includes(paperFormat as PaperFormat)
    ? (paperFormat as PaperFormat)
    : "A4";

  const pdfOpts: PlaywrightPdfOptions = {
    format,
    printBackground: true,
    margin: {
      top: options?.margins?.top ?? "2cm",
      bottom: options?.margins?.bottom ?? "2cm",
      left: options?.margins?.left ?? "1.5cm",
      right: options?.margins?.right ?? "1.5cm",
    },
  };

  // Header/footer from frontmatter or options
  const headerTpl = options?.headerTemplate ?? frontmatter.header;
  const footerTpl = options?.footerTemplate ?? frontmatter.footer;

  if (headerTpl || footerTpl) {
    pdfOpts.displayHeaderFooter = true;

    const headerStyle = 'style="font-size: 9px; width: 100%; padding: 0 1cm; color: #888;"';
    const footerStyle = 'style="font-size: 9px; width: 100%; padding: 0 1cm; color: #888; text-align: center;"';

    if (headerTpl) {
      const headerContent = replaceTemplateVariables(headerTpl, frontmatter);
      pdfOpts.headerTemplate = `<div ${headerStyle}>${headerContent}</div>`;
    } else {
      pdfOpts.headerTemplate = '<div></div>';
    }

    if (footerTpl) {
      const footerContent = replaceTemplateVariables(footerTpl, frontmatter);
      pdfOpts.footerTemplate = `<div ${footerStyle}>${footerContent}</div>`;
    } else {
      pdfOpts.footerTemplate = '<div></div>';
    }
  }

  return pdfOpts;
}

function buildPdfHtml(body: string, css: string, title: string, qrHtml?: string): string {
  const escapedTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
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
    <article class="markview-content">
${body}
    </article>
    ${qrHtml ?? ""}
  </div>
</body>
</html>`;
}
