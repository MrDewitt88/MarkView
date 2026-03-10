# UPDATE.md — TeamMind Branding für MarkView

> Alle Änderungen um MarkView als TeamMind-Produkt zu branden.
> GitHub Repo: https://github.com/MrDewitt88/MarkView
> Dachmarke: TeamMind (team-mind.eu) von Digitale Projekte RF GmbH

---

## 1. package.json — npm Scope ändern

### packages/engine/package.json

```diff
- "name": "@markview/engine",
+ "name": "@teammind/markview-engine",
```

### packages/cli/package.json

```diff
- "name": "@markview/cli",
+ "name": "@teammind/markview-cli",
```

Dependencies aktualisieren:

```diff
- "@markview/engine": "workspace:*",
+ "@teammind/markview-engine": "workspace:*",
```

### packages/app/package.json

```diff
- "name": "markview-app",
+ "name": "@teammind/markview-app",
```

Dependencies aktualisieren:

```diff
- "@markview/engine": "workspace:*",
+ "@teammind/markview-engine": "workspace:*",
```

### Root package.json (falls vorhanden)

Scripts anpassen:

```diff
- "release:engine": "pnpm --filter @markview/engine publish",
- "release:cli": "pnpm --filter @markview/cli publish",
+ "release:engine": "pnpm --filter @teammind/markview-engine publish",
+ "release:cli": "pnpm --filter @teammind/markview-cli publish",
```

---

## 2. Alle Imports aktualisieren

Betrifft jede Datei die `@markview/engine` importiert.

### packages/cli/ — alle Dateien in src/

```diff
- import { render, ... } from "@markview/engine";
+ import { render, ... } from "@teammind/markview-engine";
```

Betroffene Dateien:
- `packages/cli/src/commands/render.ts`
- `packages/cli/src/commands/export.ts`
- `packages/cli/src/commands/serve.ts`
- `packages/cli/src/commands/lint.ts`
- `packages/cli/src/commands/sign.ts`
- `packages/cli/src/commands/open.ts` (fallbackServe importiert engine)
- `packages/cli/src/commands/speak.ts`
- `packages/cli/src/commands/config.ts` (falls engine config utils importiert)

### packages/app/ — alle Dateien in src/

```diff
- import { ... } from "@markview/engine";
+ import { ... } from "@teammind/markview-engine";
```

Betroffene Dateien:
- `packages/app/src/renderer/hooks/useMarkdown.ts`
- `packages/app/src/renderer/App.tsx` (falls direkt importiert)
- `packages/app/src/main/ipc.ts` (importiert engine für Export)
- `packages/app/src/main/install-cli.ts` (Pfad zu `@markview/cli`)

### install-cli.ts — CLI-Pfad anpassen

```diff
- return join(process.resourcesPath, "app.asar", "node_modules", "@markview", "cli", "dist", "index.js");
+ return join(process.resourcesPath, "app.asar", "node_modules", "@teammind", "markview-cli", "dist", "index.js");
```

```diff
- "On Windows the CLI is available after adding the install directory to your PATH.\nAlternatively, install globally via: npm install -g @markview/cli",
+ "On Windows the CLI is available after adding the install directory to your PATH.\nAlternatively, install globally via: npm install -g @teammind/markview-cli",
```

---

## 3. electron-builder.yml — App-ID & Copyright

### packages/app/build/electron-builder.yml

```diff
- appId: com.markview.app
- productName: MarkView
- copyright: Copyright (c) 2026 MarkView Contributors
+ appId: eu.team-mind.markview
+ productName: TeamMind MarkView
+ copyright: Copyright (c) 2026 Digitale Projekte RF GmbH
```

Publish-URL auf eigenes Repo:

```diff
  publish:
    provider: github
+   owner: MrDewitt88
+   repo: MarkView
    releaseType: release
```

---

## 4. App-Menü — GitHub Links & About

### packages/app/src/main/menu.ts

Help-Menü Links auf eigenes Repo:

```diff
- click: () => shell.openExternal("https://github.com/markview/markview"),
+ click: () => shell.openExternal("https://github.com/MrDewitt88/MarkView"),
```

```diff
- click: () => shell.openExternal("https://github.com/markview/markview/issues/new"),
+ click: () => shell.openExternal("https://github.com/MrDewitt88/MarkView/issues/new"),
```

About-Dialog hinzufügen (macOS Menü, erster Eintrag):

```typescript
{
  label: "About TeamMind MarkView",
  click: () => {
    dialog.showMessageBox({
      type: "info",
      title: "About TeamMind MarkView",
      message: "TeamMind MarkView",
      detail: `Version ${app.getVersion()}\n\nThe missing OS for Markdown — by TeamMind\nhttps://team-mind.eu\n\n© 2026 Digitale Projekte RF GmbH`,
    });
  },
},
```

---

## 5. CLI — Beschreibung & Branding

### packages/cli/src/index.ts

```diff
  program
    .name("markview")
-   .description("MarkView — Markdown rendering, export, and preview CLI")
+   .description("TeamMind MarkView — Markdown rendering, export, and preview CLI")
    .version("0.1.0")
```

---

## 6. Renderer — HTML Title & Empty State

### packages/app/src/renderer/index.html

```diff
- <title>MarkView</title>
+ <title>TeamMind MarkView</title>
```

### packages/app/src/renderer/App.tsx

Empty State Texte:

```diff
- <img src={logoUrl} alt="MarkView" className="empty-state-logo" />
- <h2>Welcome to MarkView</h2>
+ <img src={logoUrl} alt="TeamMind MarkView" className="empty-state-logo" />
+ <h2>Welcome to TeamMind MarkView</h2>
```

```diff
- <p>MarkView is also available as a command-line tool:</p>
+ <p>Also available as a command-line tool:</p>
```

---

## 7. CLI open.ts — Fallback Serve Branding

### packages/cli/src/commands/open.ts

```diff
- log(chalk.blue(`Opening ${filePath} in MarkView viewer...`), globalOpts);
+ log(chalk.blue(`Opening ${filePath} in TeamMind MarkView...`), globalOpts);
```

```diff
- log(chalk.yellow("@markview/app is not installed. Falling back to serve mode..."), globalOpts);
+ log(chalk.yellow("@teammind/markview-app is not installed. Falling back to serve mode..."), globalOpts);
```

```diff
- log(chalk.blue(`Opening ${filePath} in MarkView editor...`), globalOpts);
+ log(chalk.blue(`Opening ${filePath} in TeamMind MarkView editor...`), globalOpts);
```

Fallback-Serve HTML:

```diff
- <title>MarkView</title>
+ <title>TeamMind MarkView</title>
```

Console-Ausgabe:

```diff
- console.error(`MarkView running at http://localhost:${port}`);
+ console.error(`TeamMind MarkView running at http://localhost:${port}`);
```

---

## 8. install-cli.ts — Kommentare & Meldungen

### packages/app/src/main/install-cli.ts

Shell-Wrapper Kommentar:

```diff
- # MarkView CLI — installed by MarkView.app
+ # TeamMind MarkView CLI — installed by TeamMind MarkView.app
```

---

## 9. CSS Templates — Kommentare (optional)

### packages/engine/src/templates/default.css + default.css.ts

```diff
- /* MarkView Default Template — Clean, readable typography */
+ /* TeamMind MarkView — Default Template */
```

### packages/engine/src/templates/report.css + report.css.ts

```diff
- /* MarkView Report Template — Professional, paged, with header/footer */
+ /* TeamMind MarkView — Report Template */
```

### packages/engine/src/templates/minimal.css + minimal.css.ts

```diff
- /* MarkView Minimal Template — Black/white, reduced, ideal for print */
+ /* TeamMind MarkView — Minimal Template */
```

---

## 10. Logo & Icons

### Neues Logo erstellen

TeamMind MarkView braucht ein eigenes App-Icon in den TeamMind-Farben.

Dateien die ersetzt werden müssen:
- `packages/app/resources/icons/icon.icns` (macOS)
- `packages/app/resources/icons/icon.ico` (Windows)
- `packages/app/resources/icons/` (Linux, verschiedene Größen)
- Logo-Datei die in `App.tsx` als `logoUrl` referenziert wird

Das Icon sollte die TeamMind-Farbpalette nutzen und visuell zur
TeamMind-Produktfamilie (myMind, goMind, Kiara) passen.

---

## 11. README.md — Repo Branding

### Root README.md

```markdown
# TeamMind MarkView

> The missing OS for Markdown — in the age of AI agents.

Part of the [TeamMind](https://team-mind.eu) ecosystem by Digitale Projekte RF GmbH.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| @teammind/markview-engine | Engine | Headless render engine |
| @teammind/markview-cli | CLI | Command-line interface |
| @teammind/markview-app | App | Electron GUI (Viewer + Builder) |

## Quick Start

\`\`\`bash
npm install -g @teammind/markview-cli
markview render README.md
markview serve README.md
markview export README.md --format pdf
\`\`\`
```

---

## 12. LICENSE

```diff
- Copyright (c) 2026 MarkView Contributors
+ Copyright (c) 2026 Digitale Projekte RF GmbH (TeamMind)
```

---

## 13. Speaklone TTS — Config Default-Kommentar

### packages/cli/src/commands/speak.ts

Fehlermeldungen:

```diff
- console.error(chalk.red("No Speaklone token found.\n"));
+ console.error(chalk.red("No Speaklone token configured.\n"));
```

Keine Namensänderung nötig hier — Speaklone ist ein externes Produkt,
bleibt Speaklone in allen Referenzen.

---

## 14. preload/index.ts — Interface-Name (optional)

### packages/app/src/preload/index.ts

Das Interface heißt `MarkviewAPI` — das kann bleiben, da es ein
interner technischer Name ist der nicht dem User angezeigt wird.
Alternativ:

```diff
- export interface MarkviewAPI {
+ export interface TeamMindMarkviewAPI {
```

Empfehlung: Belassen als `MarkviewAPI`. Intern, nicht sichtbar.

---

## Zusammenfassung: Alle betroffenen Dateien

| Datei | Änderung |
|-------|----------|
| `packages/engine/package.json` | npm name → `@teammind/markview-engine` |
| `packages/cli/package.json` | npm name → `@teammind/markview-cli`, dependency |
| `packages/app/package.json` | npm name → `@teammind/markview-app`, dependency |
| `packages/cli/src/index.ts` | CLI description |
| `packages/cli/src/commands/open.ts` | Log-Meldungen, HTML title, imports |
| `packages/cli/src/commands/render.ts` | Import path |
| `packages/cli/src/commands/export.ts` | Import path |
| `packages/cli/src/commands/serve.ts` | Import path |
| `packages/cli/src/commands/lint.ts` | Import path |
| `packages/cli/src/commands/sign.ts` | Import path |
| `packages/cli/src/commands/speak.ts` | Import path |
| `packages/cli/src/commands/config.ts` | Import path |
| `packages/app/build/electron-builder.yml` | appId, productName, copyright, publish |
| `packages/app/src/main/menu.ts` | GitHub URLs, About-Dialog |
| `packages/app/src/main/install-cli.ts` | CLI-Pfad, Kommentare, Meldungen |
| `packages/app/src/main/ipc.ts` | Import path |
| `packages/app/src/renderer/index.html` | `<title>` |
| `packages/app/src/renderer/App.tsx` | Empty State Texte, imports |
| `packages/app/src/renderer/hooks/useMarkdown.ts` | Import path |
| `packages/engine/src/templates/default.css` | Kommentar |
| `packages/engine/src/templates/default.css.ts` | Kommentar |
| `packages/engine/src/templates/report.css` | Kommentar |
| `packages/engine/src/templates/report.css.ts` | Kommentar |
| `packages/engine/src/templates/minimal.css` | Kommentar |
| `packages/engine/src/templates/minimal.css.ts` | Kommentar |
| `packages/app/resources/icons/*` | Neues TeamMind MarkView Icon |
| `README.md` | Komplett neu mit TeamMind Branding |
| `LICENSE` | Copyright Digitale Projekte RF GmbH |

---

## Reihenfolge der Umsetzung

1. **package.json** — Alle drei Packages umbenennen (Scope + Name)
2. **Imports** — Globales Find & Replace: `@markview/engine` → `@teammind/markview-engine`
3. **electron-builder.yml** — App-ID, Name, Copyright, Publish
4. **menu.ts** — GitHub Links + About-Dialog
5. **UI-Texte** — index.html, App.tsx, open.ts, install-cli.ts
6. **CSS-Kommentare** — Templates
7. **README + LICENSE** — Repo-Root
8. **Icons** — Neues Logo in TeamMind-Farben
9. **Build testen** — `pnpm build` in allen Packages
10. **Commit** — `chore: rebrand to TeamMind MarkView`

---

## Globales Find & Replace

Diese Ersetzungen decken 90% der Änderungen ab:

```
@markview/engine  →  @teammind/markview-engine
@markview/cli     →  @teammind/markview-cli
@markview/app     →  @teammind/markview-app
com.markview.app  →  eu.team-mind.markview
github.com/markview/markview  →  github.com/MrDewitt88/MarkView
Copyright (c) 2026 MarkView Contributors  →  Copyright (c) 2026 Digitale Projekte RF GmbH (TeamMind)
```

Vorsicht bei `.markview-document` und `.markview-header` CSS-Klassen — 
diese NICHT umbenennen, da sie reine technische Selektoren sind.
Gleiches gilt für den CLI-Befehl `markview` — bleibt `markview`.