/**
 * Extract speakable plain text from Markdown.
 * Strips code blocks, HTML, images, frontmatter, and syntax markers.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

type MdastNode = {
  type: string;
  children?: MdastNode[];
  value?: string;
  depth?: number;
};

/**
 * Extract all speakable text from a Markdown string.
 */
export function extractSpeakableText(markdown: string): string {
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .parse(markdown) as unknown as MdastNode;

  const lines: string[] = [];
  visitNodes(tree.children ?? [], lines);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Extract text under a specific heading.
 */
export function extractSection(markdown: string, heading: string): string {
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .parse(markdown) as unknown as MdastNode;

  const normalized = heading.replace(/^#+\s*/, "").trim().toLowerCase();

  let capturing = false;
  let targetDepth = 0;
  const lines: string[] = [];

  for (const node of tree.children ?? []) {
    if (node.type === "heading") {
      const text = inlineText(node.children ?? []).trim().toLowerCase();
      if (!capturing && text === normalized) {
        capturing = true;
        targetDepth = node.depth ?? 1;
        lines.push(inlineText(node.children ?? []).trim() + ".");
        continue;
      }
      if (capturing && (node.depth ?? 1) <= targetDepth) {
        break;
      }
    }
    if (capturing) {
      visitNodes([node], lines);
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Split text into chunks at sentence boundaries.
 */
export function splitIntoChunks(text: string, maxChars = 500): string[] {
  if (text.length <= maxChars) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

function visitNodes(nodes: MdastNode[], lines: string[]): void {
  for (const node of nodes) {
    switch (node.type) {
      case "heading":
        lines.push(inlineText(node.children ?? []).trim() + ".");
        lines.push("");
        break;

      case "paragraph":
        lines.push(inlineText(node.children ?? []).trim());
        lines.push("");
        break;

      case "list":
        for (const item of node.children ?? []) {
          if (item.type === "listItem") {
            const itemLines: string[] = [];
            visitNodes(item.children ?? [], itemLines);
            const text = itemLines.join(" ").trim();
            if (text) lines.push(text);
          }
        }
        lines.push("");
        break;

      case "blockquote":
        visitNodes(node.children ?? [], lines);
        break;

      case "code":
      case "html":
      case "yaml":
      case "toml":
      case "thematicBreak":
      case "table":
      case "definition":
        break;

      default:
        break;
    }
  }
}

/**
 * Extract speakable text starting from a line number.
 * Optionally stop at an end line.
 */
export function extractFromLine(markdown: string, from: number, to?: number): string {
  const lines = markdown.split("\n");
  const sliced = lines.slice(Math.max(0, from - 1), to ?? lines.length).join("\n");
  return extractSpeakableText(sliced);
}

/**
 * Extract speakable text starting from the first occurrence of a pattern.
 * Optionally stop at a second pattern or line number.
 */
export function extractFromPattern(
  markdown: string,
  pattern: string,
  toPattern?: string | number,
): string {
  const lines = markdown.split("\n");
  const startIdx = lines.findIndex((l) => l.includes(pattern));
  if (startIdx === -1) return "";

  let endIdx = lines.length;
  if (typeof toPattern === "number") {
    endIdx = toPattern;
  } else if (typeof toPattern === "string") {
    const found = lines.findIndex((l, i) => i > startIdx && l.includes(toPattern));
    if (found !== -1) endIdx = found;
  }

  const sliced = lines.slice(startIdx, endIdx).join("\n");
  return extractSpeakableText(sliced);
}

function inlineText(nodes: MdastNode[]): string {
  let result = "";
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        result += node.value ?? "";
        break;
      case "emphasis":
      case "strong":
      case "delete":
      case "link":
        result += inlineText(node.children ?? []);
        break;
      case "inlineCode":
        result += node.value ?? "";
        break;
      case "image":
      case "imageReference":
      case "html":
      case "footnoteReference":
        break;
      case "break":
        result += " ";
        break;
      default:
        break;
    }
  }
  return result;
}
