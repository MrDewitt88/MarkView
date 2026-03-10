import { describe, it, expect, vi } from "vitest";
import { resolveVariables } from "../src/plugins/variables.js";

describe("resolveVariables", () => {
  it("should replace {{title}} from frontmatter", () => {
    const content = "# {{title}}\n\nSome text.";
    const result = resolveVariables(content, { title: "My Document" });

    expect(result).toContain("# My Document");
  });

  it("should replace {{date}} with current date format (YYYY-MM-DD)", () => {
    const content = "Date: {{date}}";
    const result = resolveVariables(content, {});
    const today = new Date().toISOString().slice(0, 10);

    expect(result).toBe(`Date: ${today}`);
  });

  it("should replace custom vars from frontmatter.vars", () => {
    const content = "Version: {{version}}, Project: {{project}}";
    const result = resolveVariables(content, {
      vars: { version: "2.0.0", project: "MarkView" },
    });

    expect(result).toBe("Version: 2.0.0, Project: MarkView");
  });

  it("should NOT replace variables inside code blocks", () => {
    const content = "Title: {{title}}\n\n```\n{{title}} should stay\n```";
    const result = resolveVariables(content, { title: "Replaced" });

    expect(result).toContain("Title: Replaced");
    expect(result).toContain("```\n{{title}} should stay\n```");
  });

  it("should leave unknown {{variables}} unchanged", () => {
    const content = "Hello {{unknown}} world";
    const result = resolveVariables(content, {});

    expect(result).toBe("Hello {{unknown}} world");
  });

  it("should calculate {{wordcount}} correctly", () => {
    const content = "Count: {{wordcount}}\n\nOne two three four five six seven eight nine ten";
    const result = resolveVariables(content, { lang: "en-US" });

    // "Count:", "{{wordcount}}", + 10 words = 12 total
    expect(result).toContain("Count: 12");
  });

  it("should calculate {{readtime}} correctly", () => {
    // readTime = ceil(wordCount / 200)
    // 399 content words + 1 ({{readtime}}) = 400 => ceil(400/200) = 2 min
    const words = Array(399).fill("word").join(" ");
    const content = `{{readtime}}\n\n${words}`;
    const result = resolveVariables(content, {});

    expect(result).toContain("2 min");
  });

  it("should return 1 min readtime for very short content", () => {
    const content = "Read: {{readtime}}\n\nShort.";
    const result = resolveVariables(content, {});

    expect(result).toContain("1 min");
  });

  it("should use lang for locale formatting (en-US)", () => {
    const content = "Date: {{date:long}}";
    const result = resolveVariables(content, { lang: "en-US" });

    // en-US long date contains the month name in English
    const now = new Date();
    const expected = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(result).toBe(`Date: ${expected}`);
  });

  it("should default to de-DE locale when lang is not specified", () => {
    const content = "Date: {{date:long}}";
    const result = resolveVariables(content, {});

    const now = new Date();
    const expected = now.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(result).toBe(`Date: ${expected}`);
  });

  it("should replace {{author}} from frontmatter", () => {
    const content = "Author: {{author}}";
    const result = resolveVariables(content, { author: "Jane Doe" });

    expect(result).toBe("Author: Jane Doe");
  });

  it("should replace {{filename}} when filePath is provided", () => {
    const content = "File: {{filename}}";
    const result = resolveVariables(content, {}, "/docs/readme.md");

    expect(result).toBe("File: readme.md");
  });

  it("should allow custom vars to override builtins", () => {
    const content = "Title: {{title}}";
    const result = resolveVariables(content, {
      title: "Frontmatter Title",
      vars: { title: "Custom Override" },
    });

    expect(result).toBe("Title: Custom Override");
  });
});
