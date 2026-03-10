import { describe, it, expect } from "vitest";
import { diffMarkdown } from "../src/diff/index.js";

describe("diffMarkdown", () => {
  it("should detect added lines", () => {
    const oldMd = "line one\nline two";
    const newMd = "line one\nline two\nline three";
    const result = diffMarkdown(oldMd, newMd);

    expect(result.additions).toBe(1);
    const added = result.chunks.filter((c) => c.type === "added");
    expect(added).toHaveLength(1);
    expect(added[0].content).toBe("line three");
    expect(added[0].newLine).toBeDefined();
  });

  it("should detect removed lines", () => {
    const oldMd = "line one\nline two\nline three";
    const newMd = "line one\nline three";
    const result = diffMarkdown(oldMd, newMd);

    expect(result.deletions).toBe(1);
    const removed = result.chunks.filter((c) => c.type === "removed");
    expect(removed).toHaveLength(1);
    expect(removed[0].content).toBe("line two");
    expect(removed[0].oldLine).toBeDefined();
  });

  it("should detect unchanged lines", () => {
    const oldMd = "line one\nline two";
    const newMd = "line one\nline two";
    const result = diffMarkdown(oldMd, newMd);

    const unchanged = result.chunks.filter((c) => c.type === "unchanged");
    expect(unchanged).toHaveLength(2);
    expect(unchanged[0].content).toBe("line one");
    expect(unchanged[1].content).toBe("line two");
  });

  it("should handle identical content", () => {
    const md = "# Hello\n\nSome content.\n\n## Section 2";
    const result = diffMarkdown(md, md);

    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.chunks.every((c) => c.type === "unchanged")).toBe(true);
  });

  it("should handle completely different content", () => {
    const oldMd = "alpha\nbeta\ngamma";
    const newMd = "one\ntwo\nthree";
    const result = diffMarkdown(oldMd, newMd);

    expect(result.additions).toBe(3);
    expect(result.deletions).toBe(3);
    const added = result.chunks.filter((c) => c.type === "added");
    const removed = result.chunks.filter((c) => c.type === "removed");
    expect(added).toHaveLength(3);
    expect(removed).toHaveLength(3);
  });

  it("should handle empty inputs", () => {
    const result = diffMarkdown("", "");

    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
    // Empty string split gives one empty-string element
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0].type).toBe("unchanged");
  });

  it("should handle adding to empty content", () => {
    const result = diffMarkdown("", "new line");

    expect(result.additions).toBeGreaterThan(0);
    const added = result.chunks.filter((c) => c.type === "added");
    expect(added.some((c) => c.content === "new line")).toBe(true);
  });

  it("should handle removing all content", () => {
    const result = diffMarkdown("old line", "");

    expect(result.deletions).toBeGreaterThan(0);
    const removed = result.chunks.filter((c) => c.type === "removed");
    expect(removed.some((c) => c.content === "old line")).toBe(true);
  });
});
