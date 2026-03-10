import type { ExportOptions } from "../types.js";
import { exportHtml } from "./html.js";

/**
 * Export Markdown to PNG images — one per A4 page.
 * Returns an array of PNG buffers (one per page).
 * Uses Playwright headless Chromium for rendering.
 */
export async function exportPng(
  markdown: string,
  options?: ExportOptions,
): Promise<Buffer[]> {
  const htmlContent = await exportHtml(markdown, options);
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle" });

    // A4 dimensions at 96dpi
    const pageWidth = 794;
    const pageHeight = 1123;

    const fullHeight = await page.evaluate(() => document.body.scrollHeight);
    const totalPages = Math.max(1, Math.ceil(fullHeight / pageHeight));

    const pages: Buffer[] = [];

    if (totalPages === 1) {
      await page.setViewportSize({ width: pageWidth, height: fullHeight });
      const screenshot = await page.screenshot({ fullPage: true, type: "png" });
      pages.push(Buffer.from(screenshot));
    } else {
      await page.setViewportSize({ width: pageWidth, height: fullHeight });
      for (let i = 0; i < totalPages; i++) {
        const y = i * pageHeight;
        const h = Math.min(pageHeight, fullHeight - y);
        const screenshot = await page.screenshot({
          type: "png",
          clip: { x: 0, y, width: pageWidth, height: h },
        });
        pages.push(Buffer.from(screenshot));
      }
    }

    return pages;
  } finally {
    await browser.close();
  }
}
