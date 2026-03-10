import type { LintIssue } from "../types.js";

const GENERIC_LINK_TEXTS = new Set([
  "click here",
  "here",
  "link",
  "read more",
]);

/**
 * Lint a Markdown document for accessibility issues.
 *
 * Rules:
 *  - a11y/img-alt:       Images without alt text
 *  - a11y/heading-order: Heading levels that skip (e.g. h1 -> h3)
 *  - a11y/link-text:     Links with generic text
 *  - a11y/table-header:  Tables without a header row separator
 *  - a11y/lang:          Missing `lang` frontmatter field (strict only)
 */
export function lintA11y(
  lines: string[],
  issues: LintIssue[],
  strict?: boolean,
): void {
  checkImgAlt(lines, issues);
  checkHeadingOrder(lines, issues);
  checkLinkText(lines, issues);
  checkTableHeader(lines, issues);

  if (strict) {
    checkLangFrontmatter(lines, issues);
  }
}

/**
 * a11y/img-alt: Flag images with empty alt text — `![](url)`.
 */
function checkImgAlt(lines: string[], issues: LintIssue[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const imgRegex = /!\[([^\]]*)\]\([^)]+\)/g;
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(line)) !== null) {
      const alt = match[1];
      if (alt !== undefined && alt.trim() === "") {
        issues.push({
          line: i + 1,
          message: "a11y/img-alt: Image is missing alt text",
          severity: "warning",
        });
      }
    }
  }
}

/**
 * a11y/heading-order: Heading levels should not skip (e.g. h1 -> h3 without h2).
 */
function checkHeadingOrder(lines: string[], issues: LintIssue[]): void {
  let lastLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const headingMatch = /^(#{1,6})\s+/.exec(line);
    if (headingMatch?.[1]) {
      const level = headingMatch[1].length;
      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push({
          line: i + 1,
          message: `a11y/heading-order: Heading level skipped from h${lastLevel} to h${level}`,
          severity: "warning",
        });
      }
      lastLevel = level;
    }
  }
}

/**
 * a11y/link-text: Flag links whose visible text is generic
 * ("click here", "here", "link", "read more").
 */
function checkLinkText(lines: string[], issues: LintIssue[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(line)) !== null) {
      const text = (match[1] ?? "").trim().toLowerCase();
      if (GENERIC_LINK_TEXTS.has(text)) {
        issues.push({
          line: i + 1,
          message: `a11y/link-text: Avoid generic link text "${match[1]?.trim()}"`,
          severity: "warning",
        });
      }
    }
  }
}

/**
 * a11y/table-header: A table (consecutive lines starting with `|`) must
 * contain a separator row (`| --- |`-style) to define a proper header.
 */
function checkTableHeader(lines: string[], issues: LintIssue[]): void {
  let tableStartLine = -1;
  let inTable = false;
  let hasSeparator = false;

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? "").trim();
    const isTableRow = line.startsWith("|") && line.endsWith("|");

    if (isTableRow) {
      if (!inTable) {
        inTable = true;
        tableStartLine = i;
        hasSeparator = false;
      }
      // Check if this row is a separator row (e.g. | --- | --- |)
      if (/^\|[\s:-]+(\|[\s:-]+)*\|$/.test(line)) {
        hasSeparator = true;
      }
    } else {
      if (inTable && !hasSeparator) {
        issues.push({
          line: tableStartLine + 1,
          message: "a11y/table-header: Table is missing a header row separator",
          severity: "warning",
        });
      }
      inTable = false;
    }
  }

  // Handle table at end of file
  if (inTable && !hasSeparator) {
    issues.push({
      line: tableStartLine + 1,
      message: "a11y/table-header: Table is missing a header row separator",
      severity: "warning",
    });
  }
}

/**
 * a11y/lang: Document should have a `lang` field in frontmatter (strict only).
 */
function checkLangFrontmatter(lines: string[], issues: LintIssue[]): void {
  if (lines.length === 0 || (lines[0] ?? "").trim() !== "---") {
    issues.push({
      line: 1,
      message: "a11y/lang: Document is missing a lang field in frontmatter",
      severity: "warning",
    });
    return;
  }

  // Look through frontmatter for a `lang` field
  for (let i = 1; i < lines.length; i++) {
    const line = (lines[i] ?? "").trim();
    if (line === "---") {
      // Reached end of frontmatter without finding lang
      issues.push({
        line: 1,
        message: "a11y/lang: Document is missing a lang field in frontmatter",
        severity: "warning",
      });
      return;
    }
    if (/^lang\s*:/.test(line)) {
      return; // Found it
    }
  }

  // No closing --- found, but still no lang
  issues.push({
    line: 1,
    message: "a11y/lang: Document is missing a lang field in frontmatter",
    severity: "warning",
  });
}
