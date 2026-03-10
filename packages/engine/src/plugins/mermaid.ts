import type { Root, Element, Text } from "hast";

// Dynamic import to prevent bundlers from inlining dom-shim (and its linkedom
// references) into browser bundles where they cause TDZ errors.
const _domShimPath = "../dom-shim.js";
const loadDomShim = () => import(/* @vite-ignore */ _domShimPath) as Promise<{ ensureDomShim: () => Promise<void> }>;

/**
 * Detect ```mermaid code blocks in the hast tree,
 * render them to SVG using mermaid, and replace the code block with SVG.
 *
 * Rendering strategy (Node.js):
 *   1. jsdom shim + mermaid.render()  — fast, handles simple diagrams
 *   2. Playwright headless Chromium    — full DOM, handles all diagram types
 * In Electron the real DOM is available so step 1 always succeeds.
 */
export async function processMermaidBlocks(tree: Root): Promise<void> {
  const nodesToProcess: { parent: Element; index: number; code: string }[] = [];

  // Collect all mermaid code blocks
  visit(tree, (node, parent, index) => {
    if (
      node.type === "element" &&
      (node as Element).tagName === "pre" &&
      parent &&
      typeof index === "number"
    ) {
      const preNode = node as Element;
      const codeChild = preNode.children[0];
      if (
        codeChild &&
        codeChild.type === "element" &&
        (codeChild as Element).tagName === "code"
      ) {
        const codeElement = codeChild as Element;
        const className =
          (codeElement.properties?.className as string[] | undefined) ?? [];
        if (className.some((c) => c === "language-mermaid")) {
          const textContent = getTextContent(codeElement);
          nodesToProcess.push({
            parent: parent as Element,
            index,
            code: textContent,
          });
        }
      }
    }
  });

  if (nodesToProcess.length === 0) return;

  // Phase 1: Try jsdom + mermaid.render() for each block
  const results: (string | null)[] = [];
  for (let i = 0; i < nodesToProcess.length; i++) {
    results.push(await tryJsdomRender(nodesToProcess[i].code, `mermaid-${i}`));
  }

  // Collect indices that failed jsdom rendering
  const failedIndices = results
    .map((r, i) => (r === null ? i : -1))
    .filter((i) => i >= 0);

  // Phase 2: Use Playwright for failed diagrams (batch them in one browser)
  if (failedIndices.length > 0) {
    const failedCodes = failedIndices.map((i) => nodesToProcess[i].code);
    const playwrightResults = await tryPlaywrightRender(failedCodes);
    for (let j = 0; j < failedIndices.length; j++) {
      results[failedIndices[j]] = playwrightResults[j];
    }
  }

  // Replace nodes in the tree
  for (let i = 0; i < nodesToProcess.length; i++) {
    const { parent, index, code } = nodesToProcess[i];
    const svgContent =
      results[i] ??
      `<div class="mermaid-error"><pre><code>${escapeHtml(code)}</code></pre><p>Mermaid rendering failed</p></div>`;

    const mermaidNode: Element = {
      type: "element",
      tagName: "div",
      properties: { className: ["mermaid-diagram"] },
      children: [
        { type: "raw" as never, value: svgContent } as unknown as Text,
      ],
    };

    parent.children[index] = mermaidNode;
  }
}

// ---------------------------------------------------------------------------
// Phase 1: jsdom-based rendering (fast, but limited SVG layout support)
// ---------------------------------------------------------------------------

let mermaidInitialized = false;
let renderCounter = 0;

async function tryJsdomRender(
  code: string,
  id: string,
): Promise<string | null> {
  try {
    // In browser/Electron the real DOM is available — skip the shim.
    // Only load dom-shim in Node.js (CLI, tests) where window is absent.
    if (typeof window === "undefined" || typeof document === "undefined") {
      const { ensureDomShim } = await loadDomShim();
      await ensureDomShim();
    }

    const mermaid = await import("mermaid");
    const mermaidApi = mermaid.default;

    if (!mermaidInitialized) {
      mermaidApi.initialize({
        startOnLoad: false,
        theme: "default",
        suppressErrorRendering: true,
        securityLevel: "loose",
      });
      mermaidInitialized = true;
    }

    // Use a unique ID per render call to avoid duplicate element ID clashes in the DOM
    const uniqueId = `${id}-${renderCounter++}`;

    const result = await Promise.race([
      mermaidApi.render(uniqueId, code),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Mermaid render timeout")), 10000),
      ),
    ]);
    return result.svg;
  } catch (err) {
    console.warn("[mermaid] render failed:", err instanceof Error ? err.message : String(err));
    return null; // Signal that this diagram needs Playwright
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Playwright-based rendering (full Chromium DOM, handles everything)
// ---------------------------------------------------------------------------

async function tryPlaywrightRender(codes: string[]): Promise<(string | null)[]> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Load a minimal page with mermaid from CDN
    await page.setContent(`<!DOCTYPE html>
<html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
</head><body>
<script>mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });</script>
</body></html>`);

    // Wait for mermaid to be available
    await page.waitForFunction(() => typeof (window as Record<string, unknown>).mermaid !== "undefined", null, { timeout: 10000 });

    // Render all diagrams in the browser context
    const svgs = await page.evaluate(async (diagramCodes: string[]) => {
      const results: (string | null)[] = [];
      const m = (window as Record<string, unknown>).mermaid as {
        render: (id: string, code: string) => Promise<{ svg: string }>;
      };
      for (let i = 0; i < diagramCodes.length; i++) {
        try {
          const { svg } = await m.render(`pw-mermaid-${i}`, diagramCodes[i]);
          results.push(svg);
        } catch {
          results.push(null);
        }
      }
      return results;
    }, codes);

    await browser.close();
    return svgs;
  } catch {
    // Playwright not available or failed entirely — return all nulls
    return codes.map(() => null);
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function visit(
  node: Root | Element | Text,
  callback: (
    node: Root | Element | Text,
    parent: Root | Element | null,
    index: number | null,
  ) => void,
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
