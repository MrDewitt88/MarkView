import { describe, it, expect } from "vitest";
import { extractTocFromMarkdown } from "../src/plugins/toc.js";

describe("extractTocFromMarkdown", () => {
  it("should extract headings from markdown", () => {
    const md = "# Title\n\nSome text.\n\n## Section One\n\n### Sub Section\n\n## Section Two";
    const toc = extractTocFromMarkdown(md);

    expect(toc).toHaveLength(4);
    expect(toc[0]).toEqual({ level: 1, text: "Title", id: "title" });
    expect(toc[1]).toEqual({ level: 2, text: "Section One", id: "section-one" });
    expect(toc[2]).toEqual({ level: 3, text: "Sub Section", id: "sub-section" });
    expect(toc[3]).toEqual({ level: 2, text: "Section Two", id: "section-two" });
  });

  it("should skip headings inside code blocks", () => {
    const md = "# Real Heading\n\n```\n# Not a heading\n## Also not\n```\n\n## Another Real Heading";
    const toc = extractTocFromMarkdown(md);

    expect(toc).toHaveLength(2);
    expect(toc[0].text).toBe("Real Heading");
    expect(toc[1].text).toBe("Another Real Heading");
  });

  it("should skip frontmatter", () => {
    const md = "---\ntitle: My Doc\nauthor: Test\n---\n\n# Introduction\n\n## Details";
    const toc = extractTocFromMarkdown(md);

    expect(toc).toHaveLength(2);
    expect(toc[0]).toEqual({ level: 1, text: "Introduction", id: "introduction" });
    expect(toc[1]).toEqual({ level: 2, text: "Details", id: "details" });
  });

  it("should generate correct slugified IDs", () => {
    const md = "# Hello World!\n\n## Über Spëcial Chars\n\n### kebab-case-title";
    const toc = extractTocFromMarkdown(md);

    expect(toc[0].id).toBe("hello-world");
    expect(toc[2].id).toBe("kebab-case-title");
  });

  it("should only extract h1 through h4", () => {
    const md = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
    const toc = extractTocFromMarkdown(md);

    expect(toc).toHaveLength(4);
    expect(toc.map((t) => t.level)).toEqual([1, 2, 3, 4]);
  });

  it("should strip inline markdown formatting from heading text", () => {
    const md = "# **Bold** Title\n\n## `code` and *italic*\n\n### [Link Text](url)";
    const toc = extractTocFromMarkdown(md);

    expect(toc[0].text).toBe("Bold Title");
    expect(toc[1].text).toBe("code and italic");
    expect(toc[2].text).toBe("Link Text(url)");
  });

  it("should handle empty markdown", () => {
    const toc = extractTocFromMarkdown("");
    expect(toc).toHaveLength(0);
  });

  it("should handle markdown with no headings", () => {
    const md = "Just some text.\n\nAnother paragraph.";
    const toc = extractTocFromMarkdown(md);
    expect(toc).toHaveLength(0);
  });
});
