/**
 * Browser-safe subset of the engine.
 * Does NOT import modules that depend on Node built-ins (fs, path, etc.).
 * Used by the Electron renderer.
 */
export { render, replaceTemplateVariables, generateHeaderHtml, generateFooterHtml } from "./pipeline.js";
export { loadTemplate, buildStyles, getAvailableTemplates } from "./templates/index.js";
export { extractSpeakableText, extractSection, splitIntoChunks } from "./tts/extract.js";
export { diffMarkdown } from "./diff/index.js";
export type { DiffResult, DiffChunk } from "./diff/index.js";
export type {
  RenderResult,
  FrontmatterConfig,
  TocEntry,
  ExportOptions,
  PdfMargins,
  LintResult,
  LintIssue,
  LintOptions,
  SignatureInfo,
} from "./types.js";
