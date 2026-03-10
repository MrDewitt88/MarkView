import { describe, it, expect } from "vitest";
import { render } from "../src/pipeline.js";

describe("render pipeline", () => {
  it("should render basic markdown to HTML", async () => {
    const md = "# Hello World\n\nThis is a paragraph.";
    const result = await render(md);

    expect(result.html).toContain("<h1");
    expect(result.html).toContain("Hello World");
    expect(result.html).toContain("<p>");
    expect(result.html).toContain("This is a paragraph.");
  });

  it("should parse YAML frontmatter", async () => {
    const md = `---
title: My Document
author: John Doe
template: report
toc: true
---

# Content here
`;
    const result = await render(md);

    expect(result.frontmatter.title).toBe("My Document");
    expect(result.frontmatter.author).toBe("John Doe");
    expect(result.frontmatter.template).toBe("report");
    expect(result.frontmatter.toc).toBe(true);
  });

  it("should return empty frontmatter for markdown without frontmatter", async () => {
    const md = "# No Frontmatter\n\nJust content.";
    const result = await render(md);

    expect(result.frontmatter).toEqual({});
  });

  it("should extract TOC entries from headings", async () => {
    const md = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
`;
    const result = await render(md);

    expect(result.toc).toHaveLength(4); // h1-h4 only
    expect(result.toc[0]).toEqual({
      level: 1,
      text: "Heading 1",
      id: "heading-1",
    });
    expect(result.toc[1]).toEqual({
      level: 2,
      text: "Heading 2",
      id: "heading-2",
    });
    expect(result.toc[2]).toEqual({
      level: 3,
      text: "Heading 3",
      id: "heading-3",
    });
    expect(result.toc[3]).toEqual({
      level: 4,
      text: "Heading 4",
      id: "heading-4",
    });
  });

  it("should add id attributes to headings", async () => {
    const md = "# My Title\n## Sub Section";
    const result = await render(md);

    expect(result.html).toContain('id="my-title"');
    expect(result.html).toContain('id="sub-section"');
  });

  it("should render GFM tables", async () => {
    const md = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
`;
    const result = await render(md);

    expect(result.html).toContain("<table>");
    expect(result.html).toContain("<th>");
    expect(result.html).toContain("Alice");
    expect(result.html).toContain("Bob");
  });

  it("should render GFM strikethrough", async () => {
    const md = "This is ~~deleted~~ text.";
    const result = await render(md);

    expect(result.html).toContain("<del>");
    expect(result.html).toContain("deleted");
  });

  it("should render GFM task lists", async () => {
    const md = `
- [x] Done
- [ ] Not done
`;
    const result = await render(md);

    expect(result.html).toContain('type="checkbox"');
  });

  it("should highlight code blocks with shiki", async () => {
    const md = '```javascript\nconst x = 42;\nconsole.log(x);\n```';
    const result = await render(md);

    // Shiki produces styled HTML with <pre class="shiki ...">
    expect(result.html).toContain("shiki");
    expect(result.html).toContain("42");
  });

  it("should handle code blocks with unknown languages gracefully", async () => {
    const md = '```unknownlang\nsome code\n```';
    const result = await render(md);

    expect(result.html).toContain("some code");
  });

  it("should handle mermaid code blocks", async () => {
    const md = '```mermaid\ngraph TD\n    A-->B\n```';
    const result = await render(md);

    // Mermaid blocks should be wrapped in a mermaid-diagram div
    // In Node.js without DOM, it may fall back to a pre.mermaid container
    expect(result.html).toContain("mermaid");
  });

  it("should combine frontmatter, TOC, and rendered HTML", async () => {
    const md = `---
title: Full Test
author: Test Author
---

# Introduction

Some intro text.

## Details

| Key | Value |
|-----|-------|
| A   | 1     |

### Code Example

\`\`\`typescript
function hello(): string {
  return "world";
}
\`\`\`

## Conclusion

Final thoughts.
`;
    const result = await render(md);

    // Frontmatter
    expect(result.frontmatter.title).toBe("Full Test");
    expect(result.frontmatter.author).toBe("Test Author");

    // TOC
    expect(result.toc).toHaveLength(4);
    expect(result.toc[0].text).toBe("Introduction");
    expect(result.toc[1].text).toBe("Details");
    expect(result.toc[2].text).toBe("Code Example");
    expect(result.toc[3].text).toBe("Conclusion");

    // HTML content
    expect(result.html).toContain("<table>");
    expect(result.html).toContain("hello");
    expect(result.html).toContain("Final thoughts.");
  });
});
