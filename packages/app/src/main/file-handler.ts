import { readFile, writeFile, readFileSync, writeFileSync, watch, type FSWatcher } from "fs";
import { basename, join, resolve } from "path";
import { app, type BrowserWindow } from "electron";

/** Template frontmatter presets keyed by template name. */
const TEMPLATE_FRONTMATTER: Record<string, string> = {
  default: [
    "---",
    "title: Untitled Document",
    "author: ",
    "template: default",
    "---",
    "",
    "# Untitled Document",
    "",
  ].join("\n"),
  report: [
    "---",
    "title: Report",
    "author: ",
    "template: report",
    "toc: true",
    "header: '{{title}}'",
    "footer: 'Page {{page}} of {{pages}}'",
    "---",
    "",
    "# Report Title",
    "",
  ].join("\n"),
  minimal: [
    "---",
    "title: Note",
    "template: minimal",
    "---",
    "",
    "# Note",
    "",
  ].join("\n"),
};

let currentWatcher: FSWatcher | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Stop watching the current file.
 */
export function stopWatching(): void {
  if (currentWatcher) {
    currentWatcher.close();
    currentWatcher = null;
  }
}

const MAX_RECENT_FILES = 10;

function getRecentFilesPath(): string {
  return join(app.getPath("userData"), "recent-files.json");
}

/**
 * Open a markdown file: read contents, send to renderer via IPC, and start watching.
 */
export function openFile(filePath: string, window: BrowserWindow): void {
  const absolutePath = resolve(filePath);

  readFile(absolutePath, "utf-8", (err, content) => {
    if (err) {
      console.error(`Failed to open file: ${absolutePath}`, err);
      return;
    }

    if (window.isDestroyed()) return;

    window.webContents.send("file:content", {
      path: absolutePath,
      name: basename(absolutePath),
      content,
    });

    addToRecentFiles(absolutePath);
    watchFile(absolutePath, window);
  });
}

/**
 * Watch a file for changes and notify the renderer on each change.
 */
export function watchFile(filePath: string, window: BrowserWindow): void {
  // Stop any existing watcher
  if (currentWatcher) {
    currentWatcher.close();
    currentWatcher = null;
  }

  currentWatcher = watch(filePath, (eventType) => {
    if (eventType === "change") {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        readFile(filePath, "utf-8", (err, content) => {
          if (err) {
            console.error(`Failed to re-read file: ${filePath}`, err);
            return;
          }

          if (window.isDestroyed()) {
            currentWatcher?.close();
            currentWatcher = null;
            return;
          }

          window.webContents.send("file:changed", {
            path: filePath,
            name: basename(filePath),
            content,
          });
        });
      }, 150);
    }
  });
}

/**
 * Get the list of recently opened files (up to 10).
 */
export function getRecentFiles(): string[] {
  try {
    const data = readFileSync(getRecentFilesPath(), "utf-8");
    const parsed: unknown = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Add a file path to the recent files list.
 */
function addToRecentFiles(filePath: string): void {
  const recent = getRecentFiles();
  const filtered = recent.filter((f) => f !== filePath);
  filtered.unshift(filePath);
  const trimmed = filtered.slice(0, MAX_RECENT_FILES);

  try {
    writeFileSync(getRecentFilesPath(), JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save recent files:", err);
  }
}

/**
 * Save content to an existing file path.
 */
export function saveFile(filePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    writeFile(filePath, content, "utf-8", (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Create a new markdown file with template frontmatter.
 * Returns the new file path and content.
 */
export function createNewFile(
  filePath: string,
  templateName: string,
): { path: string; name: string; content: string } {
  const content =
    TEMPLATE_FRONTMATTER[templateName] ?? TEMPLATE_FRONTMATTER["default"]!;
  writeFileSync(filePath, content, "utf-8");
  return {
    path: resolve(filePath),
    name: basename(filePath),
    content,
  };
}

/**
 * Get the initial content for a template without writing a file.
 */
export function getTemplateContent(templateName: string): string {
  return TEMPLATE_FRONTMATTER[templateName] ?? TEMPLATE_FRONTMATTER["default"]!;
}

/**
 * Get available template names.
 */
export function getAvailableTemplateNames(): string[] {
  return Object.keys(TEMPLATE_FRONTMATTER);
}

interface PdfExportOptions {
  landscape?: boolean;
  paperFormat?: string;
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

/**
 * Export the rendered content to PDF using Electron's built-in printToPDF.
 * NOT Playwright — Electron already has Chromium built in.
 */
export async function exportToPdf(
  window: BrowserWindow,
  outPath: string,
  options?: PdfExportOptions,
): Promise<void> {
  const pdfData = await window.webContents.printToPDF({
    printBackground: true,
    landscape: options?.landscape ?? false,
    margins: options?.margins
      ? { marginType: "custom", ...options.margins }
      : { marginType: "default" },
    pageSize: (options?.paperFormat as Electron.PrintToPDFOptions["pageSize"]) ?? "A4",
  });

  return new Promise((resolve, reject) => {
    writeFile(outPath, pdfData, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
