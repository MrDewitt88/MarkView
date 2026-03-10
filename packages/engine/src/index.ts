export { render, replaceTemplateVariables, generateHeaderHtml, generateFooterHtml } from "./pipeline.js";
export { resolveIncludes } from "./plugins/includes.js";
export { exportHtml } from "./export/html.js";
export { exportEmail } from "./export/email.js";
export { exportPng } from "./export/png.js";
export { loadTemplate, buildStyles, getAvailableTemplates } from "./templates/index.js";
export { lint } from "./lint/index.js";
export { signPdf, verifySig } from "./signature/index.js";
export {
  speak,
  isAvailable,
  getVoices,
  extractSpeakableText,
  extractSection,
  extractFromLine,
  extractFromPattern,
  splitIntoChunks,
  type SpeakloneConfig,
  type SpeakloneVoice,
  type SpeakResult,
} from "./tts/index.js";
export { generateQrSvg } from "./plugins/qrcode.js";
export { searchMarkdown, resolveMarkdownFiles } from "./search/index.js";
export type { SearchOptions, SearchResult } from "./search/index.js";
export { diffMarkdown } from "./diff/index.js";
export type { DiffResult, DiffChunk } from "./diff/index.js";
export { CollabSession } from "./collab/index.js";
export type { CollabConfig, CollabUser, CollabState, CollabEvent } from "./collab/index.js";
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
