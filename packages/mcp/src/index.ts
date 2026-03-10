import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  render,
  exportHtml,
  exportEmail,
  lint,
  extractSpeakableText,
  extractTocFromMarkdown,
  speak,
  isAvailable,
  diffMarkdown,
  searchMarkdown,
  resolveMarkdownFiles,
} from "@teammind/markview-engine";
import type { SpeakloneConfig } from "@teammind/markview-engine";

const server = new Server(
  { name: "markview", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "render",
      description: "Render Markdown to HTML with full pipeline (GFM, Mermaid, Shiki, KaTeX)",
      inputSchema: {
        type: "object" as const,
        properties: {
          markdown: { type: "string", description: "Markdown content to render" },
        },
        required: ["markdown"],
      },
    },
    {
      name: "export_html",
      description: "Export Markdown to a complete standalone HTML document",
      inputSchema: {
        type: "object" as const,
        properties: {
          markdown: { type: "string", description: "Markdown content" },
          template: { type: "string", description: "Template: default, report, or minimal" },
        },
        required: ["markdown"],
      },
    },
    {
      name: "export_email",
      description: "Export Markdown to email-safe HTML with all CSS inlined into style attributes",
      inputSchema: {
        type: "object" as const,
        properties: {
          markdown: { type: "string", description: "Markdown content" },
          template: { type: "string", description: "Template: default, report, or minimal" },
        },
        required: ["markdown"],
      },
    },
    {
      name: "lint",
      description: "Lint Markdown for issues (frontmatter, Mermaid syntax, internal links)",
      inputSchema: {
        type: "object" as const,
        properties: {
          markdown: { type: "string", description: "Markdown content to lint" },
          strict: { type: "boolean", description: "Enable strict mode" },
          a11y: { type: "boolean", description: "Enable accessibility checks" },
        },
        required: ["markdown"],
      },
    },
    {
      name: "get_toc",
      description: "Extract table of contents from Markdown",
      inputSchema: {
        type: "object" as const,
        properties: {
          markdown: { type: "string", description: "Markdown content" },
        },
        required: ["markdown"],
      },
    },
    {
      name: "extract_text",
      description: "Extract plain speakable text from Markdown (strips code, HTML, images)",
      inputSchema: {
        type: "object" as const,
        properties: {
          markdown: { type: "string", description: "Markdown content" },
        },
        required: ["markdown"],
      },
    },
    {
      name: "speak",
      description: "Read text aloud via Speaklone TTS (local API, plays on user's machine)",
      inputSchema: {
        type: "object" as const,
        properties: {
          text: { type: "string", description: "Text to speak" },
          voice: { type: "string", description: "Voice name (e.g. aiden, ryan, vivian)" },
          endpoint: { type: "string", description: "Speaklone endpoint URL" },
          token: { type: "string", description: "Speaklone API token" },
        },
        required: ["text"],
      },
    },
    {
      name: "diff",
      description: "Compare two Markdown texts and show additions/deletions",
      inputSchema: {
        type: "object" as const,
        properties: {
          oldMarkdown: { type: "string", description: "Original Markdown" },
          newMarkdown: { type: "string", description: "Updated Markdown" },
        },
        required: ["oldMarkdown", "newMarkdown"],
      },
    },
    {
      name: "search",
      description: "Search for text across Markdown files in a directory",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Search query" },
          directory: { type: "string", description: "Directory path to search" },
          headingsOnly: { type: "boolean", description: "Only search in headings" },
        },
        required: ["query", "directory"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "render": {
        const result = await render(args.markdown as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ html: result.html, toc: result.toc, frontmatter: result.frontmatter }, null, 2) },
          ],
        };
      }

      case "export_html": {
        const html = await exportHtml(args.markdown as string, {
          template: args.template as string | undefined,
        });
        return { content: [{ type: "text", text: html }] };
      }

      case "export_email": {
        const emailHtml = await exportEmail(args.markdown as string, {
          template: args.template as string | undefined,
        });
        return { content: [{ type: "text", text: emailHtml }] };
      }

      case "lint": {
        const results = await lint(args.markdown as string, {
          strict: args.strict as boolean | undefined,
          a11y: args.a11y as boolean | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "get_toc": {
        const toc = extractTocFromMarkdown(args.markdown as string);
        return {
          content: [{ type: "text", text: JSON.stringify(toc, null, 2) }],
        };
      }

      case "extract_text": {
        const text = extractSpeakableText(args.markdown as string);
        return { content: [{ type: "text", text }] };
      }

      case "speak": {
        const available = await isAvailable({ endpoint: args.endpoint as string });
        if (!available) {
          return {
            content: [{ type: "text", text: "Speaklone is not running. Start it first." }],
            isError: true,
          };
        }
        const config: SpeakloneConfig = {
          endpoint: (args.endpoint as string) ?? "http://localhost:7849",
          token: (args.token as string) ?? "",
          voice: args.voice as string | undefined,
        };
        const result = await speak(args.text as string, config);
        if (!result.success) {
          return { content: [{ type: "text", text: result.error ?? "Speak failed" }], isError: true };
        }
        return { content: [{ type: "text", text: "Speaking..." }] };
      }

      case "diff": {
        const result = diffMarkdown(args.oldMarkdown as string, args.newMarkdown as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "search": {
        const files = await resolveMarkdownFiles(args.directory as string);
        const results = await searchMarkdown(args.query as string, files, {
          headingsOnly: args.headingsOnly as boolean | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
