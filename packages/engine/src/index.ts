export { render, replaceTemplateVariables, generateHeaderHtml, generateFooterHtml } from "./pipeline.js";
export { exportHtml } from "./export/html.js";
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
  splitIntoChunks,
  type SpeakloneConfig,
  type SpeakloneVoice,
  type SpeakResult,
} from "./tts/index.js";
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
