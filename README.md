<p align="center">
  <img src="packages/app/src/renderer/assets/logo.png" alt="MarkView" width="128" height="128" />
</p>

<h1 align="center">MarkView</h1>

<p align="center">
  Markdown rendering, export, and preview toolkit with text-to-speech.
</p>

---

A monorepo containing three packages: a rendering engine, a CLI tool, and an Electron desktop app.

## Packages

| Package | Description |
|---|---|
| [@markview/engine](./packages/engine) | Core rendering engine — Markdown-to-HTML pipeline, PDF/HTML export, linting, TTS text extraction |
| [@markview/cli](./packages/cli) | CLI for rendering, exporting, serving, linting, and reading aloud |
| [MarkView App](./packages/app) | Electron desktop app with live preview, editor, and Speaklone TTS |

## Installation

### Engine (library)

```bash
npm install @markview/engine
```

### CLI

```bash
npm install -g @markview/cli
```

### Desktop App

Build from source:

```bash
pnpm install
pnpm build
cd packages/app && npx electron-builder --mac dmg --config build/electron-builder.yml
```

## Quick Start

### CLI

```bash
# Render Markdown to HTML
markview render doc.md -o output.html

# Export to PDF
markview render doc.md -o output.pdf

# Live preview in browser
markview serve doc.md

# Lint for issues
markview lint "docs/**/*.md"

# Read aloud via Speaklone
markview speak doc.md --voice aiden

# Configure TTS
markview config setup
```

### Engine (programmatic)

```typescript
import { render } from "@markview/engine";

const { html, frontmatter, toc } = await render("# Hello\n\nSome **bold** text.");
```

### Desktop App

Open any `.md` file to get a rendered preview with:

- Table of contents sidebar
- Dark/light theme toggle
- Live reload on file changes
- Split-pane editor mode (Builder)
- One-click PDF and HTML export
- Text-to-speech via [Speaklone](https://speaklone.com)

## Text-to-Speech (Speaklone)

MarkView integrates with [Speaklone](https://speaklone.com) for local text-to-speech. Speaklone runs a local API on `http://localhost:7849` and plays audio directly on your machine — no audio data leaves your device.

### Setup

1. Install and start [Speaklone](https://speaklone.com)
2. In Speaklone: Settings → Local API → copy your API token
3. In MarkView App: MarkView menu → TTS Settings → paste token
4. Or via CLI: `markview config set tts.token "YOUR_TOKEN"`

### Usage

- **App**: Click the speaker button in the toolbar to read the entire document, or hover over headings for per-section playback
- **CLI**: `markview speak doc.md` — optionally with `--voice`, `--section`, `--temperature`

Available voices: Aiden, Ryan, Vivian, Serena, Dylan, Eric, Sohee, Ono Anna, Uncle Fu.

## Features

- **GFM**: Tables, task lists, strikethrough, autolinks
- **Mermaid diagrams**: Rendered as inline SVGs
- **Syntax highlighting**: Powered by Shiki with language auto-detection
- **Frontmatter**: YAML metadata for templates, headers, footers
- **Templates**: Default, report, and minimal CSS themes
- **PDF export**: Headers, footers, page numbers, custom margins
- **Linting**: Validate frontmatter, Mermaid syntax, internal links
- **TTS**: Read documents aloud with Speaklone integration

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
pnpm install
pnpm build
```

### Scripts

| Script | Description |
|---|---|
| `pnpm build` | Build all packages |
| `pnpm dev` | Start all packages in watch mode |
| `pnpm test` | Run all tests |
| `pnpm release:app` | Build Electron app for distribution |

### Project Structure

```
packages/
  engine/     # @markview/engine — rendering, export, TTS extraction
  cli/        # @markview/cli — command-line interface
  app/        # Electron desktop application
```

### Developer

Alexander Fischer
Theseus-AT e.U. / Digitale Projekte RF GmbH
https://theseus.at
https://team-mind.eu

## License

[MIT](./LICENSE)
