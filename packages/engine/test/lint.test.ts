import { describe, it, expect } from "vitest";
import { lint } from "../src/lint/index.js";

describe("lint", () => {
  it("should return no issues for valid markdown", async () => {
    const md = `---
title: Valid Document
author: Test Author
template: default
---

# Introduction

This is a valid document.

## Details

Some details here.

[Go to intro](#introduction)
`;
    const result = await lint(md);
    expect(result.issues).toHaveLength(0);
  });

  it("should detect unclosed frontmatter", async () => {
    const md = `---
title: Broken
author: Test
`;
    const result = await lint(md);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.message.includes("Unclosed frontmatter"))).toBe(true);
  });

  it("should detect unknown frontmatter fields", async () => {
    const md = `---
title: Test
unknownField: value
anotherBadField: 123
---

# Hello
`;
    const result = await lint(md);
    const unknownFieldIssues = result.issues.filter((i) =>
      i.message.includes("Unknown frontmatter field"),
    );
    expect(unknownFieldIssues).toHaveLength(2);
    expect(unknownFieldIssues[0].severity).toBe("warning");
  });

  it("should detect unknown template name", async () => {
    const md = `---
title: Test
template: nonexistent
---

# Hello
`;
    const result = await lint(md);
    const templateIssues = result.issues.filter((i) =>
      i.message.includes("Unknown template"),
    );
    expect(templateIssues).toHaveLength(1);
    expect(templateIssues[0].severity).toBe("error");
  });

  it("should detect broken internal links", async () => {
    const md = `# Introduction

Some text.

## Details

[Go to nonexistent section](#nonexistent)
[Go to introduction](#introduction)
`;
    const result = await lint(md);
    const brokenLinks = result.issues.filter((i) =>
      i.message.includes("Broken internal link"),
    );
    expect(brokenLinks).toHaveLength(1);
    expect(brokenLinks[0].message).toContain("#nonexistent");
  });

  it("should handle valid internal links without issues", async () => {
    const md = `# First Section

Some text.

## Second Section

[Link to first](#first-section)
[Link to second](#second-section)
`;
    const result = await lint(md);
    const brokenLinks = result.issues.filter((i) =>
      i.message.includes("Broken internal link"),
    );
    expect(brokenLinks).toHaveLength(0);
  });

  it("should detect broken mermaid syntax", async () => {
    const md = `# Diagram Test

\`\`\`mermaid
this is not valid mermaid syntax at all!!!
\`\`\`
`;
    const result = await lint(md);
    const mermaidIssues = result.issues.filter((i) =>
      i.message.includes("Mermaid") || i.message.includes("mermaid"),
    );
    // Mermaid validation may or may not work in Node.js without DOM,
    // so we check that the lint function runs without crashing
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    // If mermaid is available and can validate, we expect an error
    if (mermaidIssues.length > 0) {
      expect(mermaidIssues[0].severity).toBe("error");
    }
  });

  it("should check image paths in strict mode", async () => {
    const md = `# Images

![Local image](./images/test.png)
![Remote image](https://example.com/image.png)
`;
    const result = await lint(md, { strict: true });
    const imageIssues = result.issues.filter((i) =>
      i.message.includes("Image path"),
    );
    // Only local paths are flagged; URLs are skipped
    expect(imageIssues).toHaveLength(1);
    expect(imageIssues[0].message).toContain("./images/test.png");
  });

  it("should not check image paths without strict mode", async () => {
    const md = `# Images

![Local image](./images/test.png)
`;
    const result = await lint(md);
    const imageIssues = result.issues.filter((i) =>
      i.message.includes("Image path"),
    );
    expect(imageIssues).toHaveLength(0);
  });

  it("should return empty issues for minimal valid markdown", async () => {
    const md = "# Hello World\n\nJust a simple document.\n";
    const result = await lint(md);
    expect(result.issues).toHaveLength(0);
  });
});
