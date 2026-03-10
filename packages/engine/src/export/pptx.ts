import type { ExportOptions, FrontmatterConfig } from "../types.js";
import { parseFrontmatter } from "../plugins/frontmatter.js";
import { render } from "../pipeline.js";

/**
 * Export Markdown to PPTX (PowerPoint) format.
 *
 * Convention: `---` (horizontal rule / thematic break) separates slides.
 * First h1 per slide becomes the slide title.
 * Content: paragraphs, lists, code blocks as text.
 * Template styling from frontmatter.
 */
export async function exportPptx(
  markdown: string,
  options?: ExportOptions,
): Promise<Buffer> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  const { content, frontmatter } = parseFrontmatter(markdown);

  // Apply frontmatter metadata
  if (frontmatter.title) {
    pptx.title = frontmatter.title;
  }
  if (frontmatter.author) {
    pptx.author = frontmatter.author;
  }

  // Apply template styling
  const style = getTemplateStyle(frontmatter, options?.template);
  const isLandscape = options?.landscape !== false; // default landscape
  pptx.layout = isLandscape ? "LAYOUT_WIDE" : "LAYOUT_16x9";
  if (!isLandscape) {
    // Portrait: define custom layout (7.5 x 10 inches, like A4 portrait)
    pptx.defineLayout({ name: "PORTRAIT", width: 7.5, height: 10 });
    pptx.layout = "PORTRAIT";
  }

  // Split markdown into slides by horizontal rules (---)
  const slideSections = splitIntoSlides(content);

  for (const section of slideSections) {
    const slide = pptx.addSlide();

    // Apply background color from template style
    if (style.backgroundColor) {
      slide.background = { color: style.backgroundColor };
    }

    const elements = parseSlideContent(section);
    let yPosition = 0.5;

    // Render title if present
    if (elements.title) {
      slide.addText(elements.title, {
        x: 0.5,
        y: yPosition,
        w: "90%",
        fontSize: style.titleFontSize,
        fontFace: style.fontFace,
        color: style.titleColor,
        bold: true,
      });
      yPosition += 1.0;
    }

    // Render body content
    for (const block of elements.blocks) {
      switch (block.type) {
        case "paragraph": {
          slide.addText(block.content, {
            x: 0.5,
            y: yPosition,
            w: "90%",
            fontSize: style.bodyFontSize,
            fontFace: style.fontFace,
            color: style.textColor,
          });
          yPosition += estimateHeight(block.content, style.bodyFontSize);
          break;
        }
        case "list": {
          const listItems: Array<{ text: string; options: { bullet: boolean; fontSize: number; fontFace: string; color: string; indentLevel: number } }> = [];
          for (const item of block.items) {
            listItems.push({
              text: item.text,
              options: {
                bullet: true,
                fontSize: style.bodyFontSize,
                fontFace: style.fontFace,
                color: style.textColor,
                indentLevel: item.indent,
              },
            });
          }
          slide.addText(listItems, {
            x: 0.5,
            y: yPosition,
            w: "90%",
          });
          yPosition += block.items.length * 0.35;
          break;
        }
        case "code": {
          slide.addText(block.content, {
            x: 0.5,
            y: yPosition,
            w: "90%",
            fontSize: style.codeFontSize,
            fontFace: "Courier New",
            color: style.codeColor,
            fill: { color: style.codeBackground },
            margin: [5, 10, 5, 10],
          });
          const codeLines = block.content.split("\n").length;
          yPosition += codeLines * 0.25 + 0.3;
          break;
        }
        case "heading": {
          slide.addText(block.content, {
            x: 0.5,
            y: yPosition,
            w: "90%",
            fontSize: style.bodyFontSize + 4,
            fontFace: style.fontFace,
            color: style.titleColor,
            bold: true,
          });
          yPosition += 0.6;
          break;
        }
        case "mermaid": {
          // Render mermaid to SVG via pipeline, then embed as image
          const mermaidMd = "```mermaid\n" + block.content + "\n```";
          try {
            const mermaidResult = await render(mermaidMd);
            // Extract SVG from rendered HTML
            const svgMatch = /<svg[^]*?<\/svg>/i.exec(mermaidResult.html);
            if (svgMatch) {
              const svgData = Buffer.from(svgMatch[0], "utf-8").toString("base64");
              const imgWidth = isLandscape ? 9 : 6;
              const imgHeight = isLandscape ? 4 : 4;
              slide.addImage({
                data: `data:image/svg+xml;base64,${svgData}`,
                x: 0.5,
                y: yPosition,
                w: imgWidth,
                h: imgHeight,
                sizing: { type: "contain", w: imgWidth, h: imgHeight },
              });
              yPosition += imgHeight + 0.3;
            } else {
              // Fallback: show placeholder
              slide.addText("[Mermaid Diagram]", {
                x: 0.5, y: yPosition, w: "90%",
                fontSize: style.bodyFontSize, fontFace: style.fontFace,
                color: "888888", italic: true,
              });
              yPosition += 0.5;
            }
          } catch {
            slide.addText("[Mermaid Diagram - render failed]", {
              x: 0.5, y: yPosition, w: "90%",
              fontSize: style.bodyFontSize, fontFace: style.fontFace,
              color: "888888", italic: true,
            });
            yPosition += 0.5;
          }
          break;
        }
      }

      // Prevent going off-slide (height ~7.5 inches in LAYOUT_WIDE)
      if (yPosition > 6.8) {
        break;
      }
    }
  }

  // Generate buffer
  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}

interface TemplateStyle {
  fontFace: string;
  titleFontSize: number;
  bodyFontSize: number;
  codeFontSize: number;
  titleColor: string;
  textColor: string;
  codeColor: string;
  codeBackground: string;
  backgroundColor: string | null;
}

function getTemplateStyle(
  frontmatter: FrontmatterConfig,
  templateOverride?: string,
): TemplateStyle {
  const template = templateOverride ?? frontmatter.template ?? "default";
  const fontFace = frontmatter.font ?? "Arial";

  const baseStyle: TemplateStyle = {
    fontFace,
    titleFontSize: 28,
    bodyFontSize: 16,
    codeFontSize: 12,
    titleColor: "333333",
    textColor: "444444",
    codeColor: "2d2d2d",
    codeBackground: "f5f5f5",
    backgroundColor: null,
  };

  switch (template) {
    case "report":
      return {
        ...baseStyle,
        titleFontSize: 32,
        bodyFontSize: 14,
        titleColor: "1a1a2e",
        textColor: "333333",
        codeBackground: "e8e8e8",
      };
    case "minimal":
      return {
        ...baseStyle,
        titleFontSize: 24,
        bodyFontSize: 14,
        titleColor: "000000",
        textColor: "222222",
        codeBackground: "eeeeee",
      };
    default:
      return baseStyle;
  }
}

/**
 * Split markdown content into slide sections by horizontal rules.
 * A horizontal rule is a line matching /^---+$/ or /^\*\*\*+$/ or /^___+$/
 * that is NOT inside a fenced code block.
 */
function splitIntoSlides(content: string): string[] {
  const lines = content.split("\n");
  const sections: string[] = [];
  let currentSection: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock && /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      if (currentSection.length > 0) {
        sections.push(currentSection.join("\n").trim());
        currentSection = [];
      }
    } else {
      currentSection.push(line);
    }
  }

  if (currentSection.length > 0) {
    const text = currentSection.join("\n").trim();
    if (text.length > 0) {
      sections.push(text);
    }
  }

  // If no sections were created, treat the whole content as one slide
  if (sections.length === 0 && content.trim().length > 0) {
    sections.push(content.trim());
  }

  return sections;
}

interface ListItem {
  text: string;
  indent: number;
}

interface ParagraphBlock {
  type: "paragraph";
  content: string;
}

interface ListBlock {
  type: "list";
  items: ListItem[];
}

interface CodeBlock {
  type: "code";
  content: string;
  language: string;
}

interface HeadingBlock {
  type: "heading";
  content: string;
  level: number;
}

interface MermaidBlock {
  type: "mermaid";
  content: string;
}

type ContentBlock = ParagraphBlock | ListBlock | CodeBlock | HeadingBlock | MermaidBlock;

interface SlideElements {
  title: string | null;
  blocks: ContentBlock[];
}

/**
 * Parse a slide section's markdown into structured elements.
 */
function parseSlideContent(section: string): SlideElements {
  const lines = section.split("\n");
  let title: string | null = null;
  const blocks: ContentBlock[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = (): void => {
    if (paragraphLines.length > 0) {
      const text = paragraphLines.join(" ").trim();
      if (text.length > 0) {
        blocks.push({ type: "paragraph", content: text });
      }
      paragraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    // Handle code fences
    if (/^```(\w*)/.test(line)) {
      if (!inCodeBlock) {
        flushParagraph();
        const langMatch = /^```(\w*)/.exec(line);
        codeLanguage = langMatch?.[1] ?? "";
        inCodeBlock = true;
        codeLines = [];
        continue;
      } else {
        // End of code block
        const content = codeLines.join("\n");
        if (codeLanguage === "mermaid") {
          blocks.push({ type: "mermaid", content });
        } else {
          blocks.push({ type: "code", content, language: codeLanguage });
        }
        inCodeBlock = false;
        codeLines = [];
        codeLanguage = "";
        continue;
      }
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const text = headingMatch[2] ?? "";

      // First h1 becomes slide title
      if (level === 1 && title === null) {
        title = text;
      } else {
        blocks.push({ type: "heading", content: text, level });
      }
      continue;
    }

    // List items
    const listMatch = /^(\s*)([-*+]|\d+\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      flushParagraph();
      const indent = Math.floor((listMatch[1]?.length ?? 0) / 2);
      const text = listMatch[3] ?? "";

      // Merge consecutive list items
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === "list") {
        lastBlock.items.push({ text, indent });
      } else {
        blocks.push({ type: "list", items: [{ text, indent }] });
      }
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    // Regular text -> paragraph
    paragraphLines.push(line);
  }

  // Handle unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({ type: "code", content: codeLines.join("\n"), language: codeLanguage });
  }

  flushParagraph();

  return { title, blocks };
}

/**
 * Estimate the height in inches that text content will take on a slide.
 */
function estimateHeight(content: string, fontSize: number): number {
  const charsPerLine = 90;
  const lineCount = Math.ceil(content.length / charsPerLine);
  const lineHeight = (fontSize / 72) * 1.5;
  return Math.max(lineCount * lineHeight, 0.4);
}
