let installed = false;

/**
 * Install a minimal DOM shim via jsdom so that libraries like Mermaid
 * (which depend on DOMPurify, d3, etc.) can run in Node.js.
 * Safe to call multiple times — only installs once.
 * In browser/Electron environments (where window already exists), this is a no-op.
 *
 * jsdom is imported dynamically to avoid pulling Node.js-only code into
 * browser bundles (e.g. the Electron renderer built by Vite).
 */
export async function ensureDomShim(): Promise<void> {
  if (installed) return;
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    installed = true;
    return;
  }

  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    pretendToBeVisual: true,
  });
  const g = globalThis as Record<string, unknown>;
  g.window = dom.window;
  g.document = dom.window.document;
  g.navigator = dom.window.navigator;
  g.DOMParser = dom.window.DOMParser;
  g.XMLSerializer = dom.window.XMLSerializer;
  g.HTMLElement = dom.window.HTMLElement;
  g.SVGElement =
    (dom.window as Record<string, unknown>).SVGElement ?? class SVGElement {};
  installed = true;
}
