import type { Root, Element, Text } from "hast";

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

async function createHighlighter() {
  const { createHighlighter: create } = await import("shiki");
  return create({
    themes: ["github-dark", "github-light"],
    langs: ["javascript", "typescript", "python", "bash", "json", "html", "css", "markdown", "yaml", "sql"],
  });
}

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter();
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();

  const loadedLangs = highlighter.getLoadedLanguages();
  if (!loadedLangs.includes(lang as never)) {
    try {
      await highlighter.loadLanguage(lang as never);
    } catch {
      // Language not available, return escaped code
      return `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>`;
    }
  }

  return highlighter.codeToHtml(code, {
    lang,
    theme: "github-dark",
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Walk a hast tree and highlight all code blocks with shiki.
 */
export async function highlightCodeBlocks(tree: Root): Promise<void> {
  const nodesToProcess: { parent: Element; index: number; code: string; lang: string }[] = [];

  // Collect all <pre><code> nodes
  visit(tree, (node, parent, index) => {
    if (
      node.type === "element" &&
      node.tagName === "pre" &&
      parent &&
      typeof index === "number"
    ) {
      const preNode = node as Element;
      const codeChild = preNode.children[0];
      if (
        codeChild &&
        codeChild.type === "element" &&
        codeChild.tagName === "code"
      ) {
        const codeElement = codeChild as Element;
        const className = (codeElement.properties?.className as string[] | undefined) ?? [];
        const langClass = className.find((c) => c.startsWith("language-"));
        const lang = langClass ? langClass.replace("language-", "") : "";

        if (lang && lang !== "mermaid") {
          const textContent = getTextContent(codeElement);
          nodesToProcess.push({
            parent: parent as Element,
            index,
            code: textContent,
            lang,
          });
        }
      }
    }
  });

  // Process all collected nodes
  for (const { parent, index, code, lang } of nodesToProcess) {
    const highlighted = await highlightCode(code, lang);
    const rawNode: Element = {
      type: "element",
      tagName: "div",
      properties: { className: ["shiki-container"] },
      children: [{ type: "raw" as never, value: highlighted } as unknown as Text],
    };
    parent.children[index] = rawNode;
  }
}

function visit(
  node: Root | Element | Text,
  callback: (node: Root | Element | Text, parent: Root | Element | null, index: number | null) => void,
  parent: Root | Element | null = null,
  index: number | null = null,
): void {
  callback(node, parent, index);
  if ("children" in node && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      visit(node.children[i] as Element, callback, node, i);
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
