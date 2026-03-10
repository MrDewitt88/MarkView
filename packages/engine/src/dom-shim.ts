let installed = false;

/**
 * Install a minimal DOM shim via linkedom so that libraries like Mermaid
 * (which depend on DOMPurify, d3, etc.) can run in Node.js.
 * Safe to call multiple times — only installs once.
 * In browser/Electron environments (where window already exists), this is a no-op.
 *
 * linkedom is imported dynamically to avoid pulling Node.js-only code into
 * browser bundles (e.g. the Electron renderer built by Vite).
 */
export async function ensureDomShim(): Promise<void> {
  if (installed) return;
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    installed = true;
    return;
  }

  const { parseHTML } = await import("linkedom");
  const {
    window,
    document,
    navigator,
    DOMParser,
    XMLSerializer,
    HTMLElement,
    SVGElement,
  } = parseHTML("<!DOCTYPE html><html><body></body></html>");

  const g = globalThis as Record<string, unknown>;
  g.window = window;
  g.document = document;
  g.navigator = navigator;
  g.DOMParser = DOMParser;
  g.XMLSerializer = XMLSerializer;
  g.HTMLElement = HTMLElement;
  g.SVGElement = SVGElement ?? class SVGElement {};

  // linkedom does not provide requestAnimationFrame (jsdom did via
  // pretendToBeVisual). Mermaid / d3 may need it, so add a simple shim.
  if (typeof globalThis.requestAnimationFrame === "undefined") {
    g.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(cb, 0) as unknown as number;
    g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }

  installed = true;
}
