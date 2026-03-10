import { describe, it, expect } from "vitest";
import {
  extractSpeakableText,
  extractFromLine,
  extractFromPattern,
  splitIntoChunks,
} from "../src/tts/extract.js";

describe("extractSpeakableText", () => {
  it("should strip markdown heading syntax", () => {
    const md = "# Hello World\n\nSome text.";
    const result = extractSpeakableText(md);

    expect(result).toContain("Hello World");
    expect(result).not.toContain("#");
  });

  it("should strip bold and italic markers", () => {
    const md = "This is **bold** and *italic* text.";
    const result = extractSpeakableText(md);

    expect(result).toContain("bold");
    expect(result).toContain("italic");
    expect(result).not.toContain("**");
    expect(result).not.toContain("*italic*");
  });

  it("should strip code blocks entirely", () => {
    const md = "Before.\n\n```js\nconst x = 1;\n```\n\nAfter.";
    const result = extractSpeakableText(md);

    expect(result).toContain("Before.");
    expect(result).toContain("After.");
    expect(result).not.toContain("const x");
  });

  it("should strip frontmatter", () => {
    const md = "---\ntitle: Test\n---\n\n# Hello";
    const result = extractSpeakableText(md);

    expect(result).toContain("Hello");
    expect(result).not.toContain("title: Test");
  });

  it("should strip link syntax but keep text", () => {
    const md = "Click [here](https://example.com) for info.";
    const result = extractSpeakableText(md);

    expect(result).toContain("here");
    expect(result).not.toContain("https://example.com");
  });

  it("should handle lists as speakable text", () => {
    const md = "- Item one\n- Item two\n- Item three";
    const result = extractSpeakableText(md);

    expect(result).toContain("Item one");
    expect(result).toContain("Item two");
    expect(result).toContain("Item three");
  });

  it("should strip images", () => {
    const md = "Text before ![alt text](image.png) text after.";
    const result = extractSpeakableText(md);

    expect(result).not.toContain("image.png");
    expect(result).not.toContain("alt text");
  });
});

describe("extractFromLine", () => {
  it("should extract text starting from a specific line", () => {
    const md = "# Title\n\nLine two.\n\nLine four.";
    const result = extractFromLine(md, 3);

    expect(result).toContain("Line two.");
    expect(result).toContain("Line four.");
  });

  it("should extract text within a line range", () => {
    const md = "Line one.\n\nLine three.\n\nLine five.\n\nLine seven.";
    const result = extractFromLine(md, 1, 4);

    expect(result).toContain("Line one.");
    expect(result).toContain("Line three.");
    expect(result).not.toContain("Line seven.");
  });

  it("should handle out-of-range start gracefully", () => {
    const md = "Only line.";
    const result = extractFromLine(md, 100);

    expect(result).toBe("");
  });
});

describe("extractFromPattern", () => {
  it("should find text starting from a pattern", () => {
    const md = "# Intro\n\nSome intro.\n\n# Details\n\nDetail text.";
    const result = extractFromPattern(md, "# Details");

    expect(result).toContain("Details");
    expect(result).toContain("Detail text.");
  });

  it("should return empty string if pattern is not found", () => {
    const md = "# Hello\n\nWorld.";
    const result = extractFromPattern(md, "nonexistent");

    expect(result).toBe("");
  });

  it("should stop at a second pattern when provided", () => {
    const md = "# A\n\nText A.\n\n# B\n\nText B.\n\n# C\n\nText C.";
    const result = extractFromPattern(md, "# B", "# C");

    expect(result).toContain("Text B.");
    expect(result).not.toContain("Text C.");
  });
});

describe("splitIntoChunks", () => {
  it("should return single chunk for short text", () => {
    const text = "Short sentence.";
    const result = splitIntoChunks(text, 500);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Short sentence.");
  });

  it("should split long text into multiple chunks", () => {
    const sentences = Array(20)
      .fill("This is a test sentence.")
      .join(" ");
    const result = splitIntoChunks(sentences, 100);

    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      // Each chunk should be at or near the max length
      // (could exceed slightly due to sentence boundary)
      expect(chunk.length).toBeLessThanOrEqual(200);
    }
  });

  it("should respect max length parameter", () => {
    const text = "First sentence. Second sentence. Third sentence. Fourth sentence.";
    const result = splitIntoChunks(text, 40);

    expect(result.length).toBeGreaterThan(1);
  });

  it("should not split on non-sentence boundaries", () => {
    const text = "Hello world. Goodbye world.";
    const result = splitIntoChunks(text, 500);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it("should handle text without sentence endings", () => {
    const text = "A".repeat(600);
    const result = splitIntoChunks(text, 500);

    // No sentence boundaries, so falls back to single chunk
    expect(result).toHaveLength(1);
  });
});
