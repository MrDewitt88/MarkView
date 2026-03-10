/**
 * Separate entry point for PDF export.
 * This avoids pulling Playwright into browser/renderer bundles.
 * Import via: import { exportPdf } from "@markview/engine/pdf"
 */
export { exportPdf } from "./export/pdf.js";
