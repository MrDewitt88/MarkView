export interface RenderResult {
  html: string;
  css: string;
  frontmatter: FrontmatterConfig;
  toc: TocEntry[];
}

export interface FrontmatterConfig {
  title?: string;
  author?: string;
  template?: string;
  header?: string;
  footer?: string;
  font?: string;
  fontSize?: string;
  lineHeight?: string;
  toc?: boolean;
  signature?: boolean;
}

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

export interface ExportOptions {
  template?: string;
  format?: "pdf" | "html" | "pptx";
  outPath?: string;
  paperFormat?: string;
  landscape?: boolean;
  margins?: PdfMargins;
  headerTemplate?: string;
  footerTemplate?: string;
}

export interface PdfMargins {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
}

export interface LintIssue {
  line: number;
  message: string;
  severity: "error" | "warning";
}

export interface LintOptions {
  strict?: boolean;
}

export interface SignatureInfo {
  signed: boolean;
  signerName: string | null;
  issuer: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  isValid: boolean;
  timestamp: Date | null;
}
