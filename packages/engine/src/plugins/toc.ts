import type { TocEntry } from "../types.js";
import type { Root, Element, Text } from "hast";

/**
 * Extract h1-h4 headings from a hast tree and return TocEntry[].
 * Also adds `id` attributes to heading elements for anchor linking.
 */
export function extractToc(tree: Root): TocEntry[] {
  const toc: TocEntry[] = [];
  const headingTags = new Set(["h1", "h2", "h3", "h4"]);

  visit(tree, (node) => {
    if (node.type === "element") {
      const el = node as Element;
      if (headingTags.has(el.tagName)) {
        const level = parseInt(el.tagName.charAt(1), 10);
        const text = getTextContent(el);
        const id = slugify(text);

        // Add id attribute to the heading element
        if (!el.properties) {
          el.properties = {};
        }
        el.properties.id = id;

        toc.push({ level, text, id });
      }
    }
  });

  return toc;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function visit(
  node: Root | Element | Text,
  callback: (node: Root | Element | Text) => void,
): void {
  callback(node);
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      visit(child as Element, callback);
    }
  }
}

function getTextContent(node: Element | Text): string {
  if (node.type === "text") return (node as Text).value;
  if ("children" in node) {
    return (node.children as (Element | Text)[]).map(getTextContent).join("");
  }
  return "";
}
