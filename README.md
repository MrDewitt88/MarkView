<p align="center">
  <img src="packages/app/src/renderer/assets/logo.png" alt="TeamMind MarkView" width="128" height="128" />
</p>

<h1 align="center">TeamMind MarkView</h1>

<p align="center">
  The missing OS for Markdown — in the age of AI agents.
</p>

---

Part of the [TeamMind](https://team-mind.eu) ecosystem by Digitale Projekte RF GmbH.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| @teammind/markview-engine | Engine | Headless render engine |
| @teammind/markview-cli | CLI | Command-line interface |
| @teammind/markview-app | App | Electron GUI (Viewer + Builder) |

## Quick Start

```bash
npm install -g @teammind/markview-cli
markview render README.md
markview serve README.md
markview export README.md --format pdf
```

## Installation

### Engine (library)

```bash
npm install @teammind/markview-engine
```

### CLI

```bash
npm install -g @teammind/markview-cli
```

### Desktop App

Build from source:

```bash
pnpm install
pnpm build
cd packages/app && npx electron-builder --mac dmg --config build/electron-builder.yml
```

## CLI Usage

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

## Engine (programmatic)

```typescript
import { render } from "@teammind/markview-engine";

const { html, frontmatter, toc } = await render("# Hello\n\nSome **bold** text.");
```

## Desktop App

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
  engine/     # @teammind/markview-engine — rendering, export, TTS extraction
  cli/        # @teammind/markview-cli — command-line interface
  app/        # Electron desktop application
```

### Developer

Alexander Fischer
Theseus-AT e.U. / Digitale Projekte RF GmbH
https://theseus.at
https://team-mind.eu

## License

[MIT](./LICENSE)
