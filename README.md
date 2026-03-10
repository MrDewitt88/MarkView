<p align="center">
  <img src="MarkView.png" alt="TeamMind MarkView" width="160" />
</p>

<h1 align="center">TeamMind MarkView</h1>

<p align="center">
  Markdown rendering, export, and preview — as CLI, Electron app, and MCP server.
</p>

---

## Features

| # | Feature | CLI | App | Engine |
|---|---------|:---:|:---:|:------:|
| F1 | **TTS partial read** — line ranges (`--from`/`--to`), pattern matching, right-click "Ab hier vorlesen" in viewer | x | x | x |
| F2 | **MCP server** — 8 tools for AI agents (render, export, lint, toc, extract, speak, diff, search) | x | | x |
| F3 | **Multi-file projects** — `include:` frontmatter directive, recursive up to 5 levels | x | | x |
| F4 | **Template variables** — `{{date}}`, `{{wordcount}}`, `{{readtime}}`, custom vars in frontmatter | x | x | x |
| F5 | **Accessibility linting** — img-alt, heading-order, link-text, table-header, lang checks | x | | x |
| F6 | **Markdown diff** — LCS-based line comparison, `--git` integration | x | | x |
| F7 | **PDF password protection** — `--password`, `--no-print`, `--no-copy` (placeholder) | x | | x |
| F8 | **Full-text search** — search across Markdown files in a directory | x | | x |
| F9 | **Live collaboration** — CollabSession scaffold via TeamMind WebSocket (coming soon) | | | x |
| F10 | **Custom CSS** — `style:` field in frontmatter, appended after template CSS | x | x | x |
| F11 | **QR codes in export** — `qr:` frontmatter field, SVG generation, footer positioning | x | | x |
| F12 | **Word count & reading time** — live in status bar, available as template variables | | x | x |
| F13 | **Auto-update** — `electron-updater` with user confirmation dialog | | x | |
| F14 | **Email export** — HTML with inlined CSS via juice, no external resources | x | | x |

### Core

- **Full rendering pipeline** — GFM, Mermaid diagrams, Shiki syntax highlighting, KaTeX math
- **Export** — PDF, HTML, PNG, and email-safe HTML with inlined CSS
- **Templates** — Default, Report, Minimal — or custom CSS via frontmatter
- **TTS** — Read documents aloud via Speaklone (partial reads, line ranges, right-click context menu)
- **Linting** — Frontmatter validation, Mermaid syntax checks, accessibility rules
- **Digital signatures** — Sign and verify PDFs
- **MCP server** — First-class AI agent integration via Model Context Protocol

<p align="center">
  <img src="TeamMind%20MarkView%20with%20Speaklone%20reading%20the%20md-File.png" alt="TeamMind MarkView with Speaklone TTS" width="800" />
</p>

## Packages

| Package | Description |
|---------|-------------|
| `packages/engine` | Core rendering, export, lint, TTS, diff, search |
| `packages/cli` | Command-line interface (`markview`) |
| `packages/app` | Electron desktop application |
| `packages/mcp` | MCP server for AI agents |

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm --filter @teammind/markview-engine test
```

## CLI Usage

```bash
# Render Markdown
markview render doc.md

# Export as PDF
markview export doc.md --format pdf -o output.pdf

# Export as email-safe HTML
markview export doc.md --format email -o newsletter.html

# Live preview in browser
markview serve doc.md

# Lint for issues
markview lint doc.md --a11y

# Read aloud via Speaklone
markview speak doc.md --from 42 --to 100

# Search across files
markview search "API config" ./docs/

# Compare two files
markview diff old.md new.md

# Start MCP server
markview mcp
```

## Frontmatter

```yaml
---
title: My Document
author: Jane Doe
template: report
toc: true
font: Inter
style: |
  h1 { color: #e63946; }
vars:
  company: TeamMind
  version: 1.0.0
include:
  - chapter1.md
  - chapter2.md
qr: https://example.com
---

# {{title}} v{{version}}

Created by {{author}} on {{date}}.
Word count: {{wordcount}} | Reading time: {{readtime}}.
```

## MCP Configuration

Add to Claude Desktop or any MCP-compatible client:

```json
{
  "mcpServers": {
    "markview": {
      "command": "markview",
      "args": ["mcp"],
      "type": "stdio"
    }
  }
}
```

## License

Proprietary — Digitale Projekte RF GmbH
