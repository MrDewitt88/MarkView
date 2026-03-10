import { describe, it, expect } from "vitest";
import { generateQrSvg } from "../src/plugins/qrcode.js";

describe("generateQrSvg", () => {
  it("should return an SVG string", async () => {
    const result = await generateQrSvg("https://example.com");

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should contain an svg element", async () => {
    const result = await generateQrSvg("https://example.com");

    expect(result).toContain("<svg");
    expect(result).toContain("</svg>");
  });

  it("should handle URL input", async () => {
    const result = await generateQrSvg("https://markview.dev/docs/getting-started");

    expect(result).toContain("<svg");
    expect(result).toContain("</svg>");
  });

  it("should handle plain text input", async () => {
    const result = await generateQrSvg("Hello, World!");

    expect(result).toContain("<svg");
  });

  it("should produce valid SVG with viewBox or width", async () => {
    const result = await generateQrSvg("https://example.com");

    // QRCode library produces SVG with viewBox or width/height attributes
    const hasViewBox = result.includes("viewBox");
    const hasWidth = result.includes("width");
    expect(hasViewBox || hasWidth).toBe(true);
  });
});
