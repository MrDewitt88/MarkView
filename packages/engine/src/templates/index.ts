import defaultCss from "./default.css.js";
import reportCss from "./report.css.js";
import minimalCss from "./minimal.css.js";

const VALID_TEMPLATES = ["default", "report", "minimal"] as const;
export type TemplateName = (typeof VALID_TEMPLATES)[number];

const templates: Record<TemplateName, string> = {
  default: defaultCss,
  report: reportCss,
  minimal: minimalCss,
};

/**
 * Load a CSS template by name. Returns the CSS string.
 * Falls back to "default" if the template name is not recognized.
 */
export function loadTemplate(name?: string): string {
  const templateName = isValidTemplate(name) ? name : "default";
  return templates[templateName];
}

/**
 * Build a complete CSS string from template + frontmatter overrides.
 */
export function buildStyles(
  templateName?: string,
  font?: string,
  fontSize?: string,
): string {
  const templateCss = loadTemplate(templateName);
  const overrides: string[] = [];

  if (font) {
    overrides.push(`  font-family: ${font};`);
  }
  if (fontSize) {
    overrides.push(`  font-size: ${fontSize};`);
  }

  if (overrides.length > 0) {
    return `${templateCss}\n\n/* Frontmatter overrides */\n.markview-document {\n${overrides.join("\n")}\n}`;
  }

  return templateCss;
}

function isValidTemplate(name: string | undefined): name is TemplateName {
  return (
    typeof name === "string" &&
    VALID_TEMPLATES.includes(name as TemplateName)
  );
}

/**
 * Get the list of available template names.
 */
export function getAvailableTemplates(): readonly string[] {
  return VALID_TEMPLATES;
}
