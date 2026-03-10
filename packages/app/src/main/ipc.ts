import { ipcMain, dialog, type BrowserWindow } from "electron";
import {
  openFile,
  getRecentFiles,
  exportToPdf,
  saveFile,
  createNewFile,
  getAvailableTemplateNames,
} from "./file-handler.js";

/**
 * IPC Channels:
 *   file:open           — Renderer requests opening a file (via dialog)
 *   file:content        — Main -> Renderer: sends file content after open
 *   file:changed        — Main -> Renderer: sends updated content on file change
 *   file:export         — Renderer requests export (legacy, calls printToPDF)
 *   file:export-pdf     — Renderer requests PDF export with options
 *   file:export-dialog  — Renderer requests export with save dialog
 *   file:recent         — Renderer requests recent files list
 *   file:save           — Renderer requests saving file content
 *   file:save-as        — Renderer requests save-as dialog + write
 *   file:new            — Renderer requests creating a new file with template
 *   file:templates      — Renderer requests available template names
 */
const channels = [
  "file:open", "file:recent", "file:export", "file:export-pdf",
  "file:export-dialog", "file:save", "file:save-as", "file:new",
  "file:templates", "file:export-html", "file:export-png",
  "tts:speak", "tts:check", "tts:voices",
  "config:load", "config:save",
];

export function registerIpcHandlers(window: BrowserWindow): void {
  // Remove any previously registered handlers
  for (const ch of channels) {
    ipcMain.removeHandler(ch);
  }

  // Open file via dialog
  ipcMain.handle("file:open", async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "mdx"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      openFile(filePath, window);
      return filePath;
    }

    return null;
  });

  // Get recent files
  ipcMain.handle("file:recent", () => {
    return getRecentFiles();
  });

  // Export to PDF (legacy channel)
  ipcMain.handle("file:export", async (_event, outPath: string) => {
    try {
      await exportToPdf(window, outPath);
      return { success: true, path: outPath };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      return { success: false, error: message };
    }
  });

  // Export to PDF with options — uses Electron's built-in Chromium printToPDF
  ipcMain.handle(
    "file:export-pdf",
    async (
      _event,
      outPath: string,
      options?: { landscape?: boolean; paperFormat?: string; margins?: { top?: number; bottom?: number; left?: number; right?: number } },
    ) => {
      try {
        await exportToPdf(window, outPath, options);
        return { success: true, path: outPath };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        return { success: false, error: message };
      }
    },
  );

  // Export with save dialog — always exports in light theme
  ipcMain.handle("file:export-dialog", async () => {
    const result = await dialog.showSaveDialog(window, {
      filters: [{ name: "PDF", extensions: ["pdf"] }],
      defaultPath: "document.pdf",
    });

    if (!result.canceled && result.filePath) {
      try {
        // Force light theme for PDF export
        const prevTheme = await window.webContents.executeJavaScript(
          `(() => { const el = document.documentElement; const prev = el.getAttribute("data-theme"); el.setAttribute("data-theme", "light"); return prev; })()`
        );
        // Small delay for repaint
        await new Promise((r) => setTimeout(r, 100));

        await exportToPdf(window, result.filePath);

        // Restore original theme
        if (prevTheme) {
          await window.webContents.executeJavaScript(
            `document.documentElement.setAttribute("data-theme", ${JSON.stringify(prevTheme)})`
          );
        }
        return { success: true, path: result.filePath };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        return { success: false, error: message };
      }
    }

    return { success: false, error: "Cancelled" };
  });

  // Save file content
  ipcMain.handle(
    "file:save",
    async (_event, filePath: string, content: string) => {
      try {
        await saveFile(filePath, content);
        return { success: true, path: filePath };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        return { success: false, error: message };
      }
    },
  );

  // Save As: show dialog then write
  ipcMain.handle("file:save-as", async (_event, content: string) => {
    const result = await dialog.showSaveDialog(window, {
      filters: [
        { name: "Markdown", extensions: ["md", "markdown"] },
        { name: "All Files", extensions: ["*"] },
      ],
      defaultPath: "untitled.md",
    });

    if (!result.canceled && result.filePath) {
      try {
        await saveFile(result.filePath, content);
        openFile(result.filePath, window);
        return { success: true, path: result.filePath };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        return { success: false, error: message };
      }
    }

    return { success: false, error: "Cancelled" };
  });

  // Create new file with template
  ipcMain.handle(
    "file:new",
    async (_event, templateName: string) => {
      const result = await dialog.showSaveDialog(window, {
        filters: [
          { name: "Markdown", extensions: ["md"] },
        ],
        defaultPath: "untitled.md",
      });

      if (!result.canceled && result.filePath) {
        try {
          const fileData = createNewFile(result.filePath, templateName);
          openFile(result.filePath, window);
          return { success: true, ...fileData };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Create failed";
          return { success: false, error: message };
        }
      }

      return { success: false, error: "Cancelled" };
    },
  );

  // Get available template names
  ipcMain.handle("file:templates", () => {
    return getAvailableTemplateNames();
  });

  // TTS: speak text via Speaklone
  // Inline fetch to avoid importing @teammind/markview-engine (which pulls in unified/remark, unavailable in asar)
  ipcMain.handle("tts:speak", async (_event, text: string, config: {
    endpoint?: string; token?: string; voice?: string;
    instruction?: string; temperature?: number;
  }) => {
    try {
      const base = (config.endpoint ?? "http://localhost:7849").replace(/\/+$/, "").replace(/\/(speak|status|voices)$/, "");
      const res = await fetch(`${base}/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token ?? ""}`,
        },
        body: JSON.stringify({
          text,
          ...(config.voice && { voice: config.voice }),
          ...(config.instruction && { instruction: config.instruction }),
          ...(config.temperature != null && { temperature: config.temperature }),
        }),
      });
      if (res.status === 401) return { success: false, error: "Speaklone rejected the token." };
      const data = (await res.json()) as { status?: string; error?: string };
      if (data.error) return { success: false, error: data.error };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Speaklone is not running." };
    }
  });

  // TTS: check Speaklone availability
  ipcMain.handle("tts:check", async (_event, endpoint?: string) => {
    try {
      const base = (endpoint ?? "http://localhost:7849").replace(/\/+$/, "").replace(/\/(speak|status|voices)$/, "");
      const res = await fetch(`${base}/status`);
      if (!res.ok) return false;
      const data = (await res.json()) as { status?: string };
      return data.status === "ok";
    } catch {
      return false;
    }
  });

  // TTS: get voices
  ipcMain.handle("tts:voices", async (_event, config: { endpoint?: string; token?: string }) => {
    try {
      const base = (config.endpoint ?? "http://localhost:7849").replace(/\/+$/, "").replace(/\/(speak|status|voices)$/, "");
      const res = await fetch(`${base}/voices`, {
        headers: { Authorization: `Bearer ${config.token ?? ""}` },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  });

  // Config: load
  ipcMain.handle("config:load", async () => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const os = await import("os");
      const configPath = path.join(os.homedir(), "Library", "Application Support", "markview", "config.json");
      const data = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  });

  // Config: save
  ipcMain.handle("config:save", async (_event, config: Record<string, unknown>) => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const os = await import("os");
      const dir = path.join(os.homedir(), "Library", "Application Support", "markview");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const configPath = path.join(dir, "config.json");
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { encoding: "utf-8", mode: 0o600 });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Save failed" };
    }
  });

  // Export to HTML using engine
  ipcMain.handle("file:export-html", async (_event, markdown: string) => {
    const result = await dialog.showSaveDialog(window, {
      filters: [{ name: "HTML", extensions: ["html"] }],
      defaultPath: "document.html",
    });

    if (!result.canceled && result.filePath) {
      try {
        const { exportHtml } = await import("@teammind/markview-engine");
        const htmlContent = await exportHtml(markdown);
        const { writeFile } = await import("fs/promises");
        await writeFile(result.filePath, htmlContent, "utf-8");
        return { success: true, path: result.filePath };
      } catch (err) {
        const message = err instanceof Error ? err.message : "HTML export failed";
        return { success: false, error: message };
      }
    }
    return { success: false, error: "Cancelled" };
  });

  // Export to PNG — render each page as a separate PNG via engine (Playwright)
  ipcMain.handle("file:export-png", async (_event, markdown: string) => {
    const result = await dialog.showSaveDialog(window, {
      filters: [{ name: "PNG Image", extensions: ["png"] }],
      defaultPath: "document.png",
    });

    if (!result.canceled && result.filePath) {
      try {
        const { exportPng } = await import("@teammind/markview-engine");
        const { writeFile } = await import("fs/promises");
        const { dirname, basename, extname, join } = await import("path");

        const pngPages = await exportPng(markdown);
        const dir = dirname(result.filePath);
        const name = basename(result.filePath, extname(result.filePath));

        if (pngPages.length === 1) {
          await writeFile(result.filePath, pngPages[0]!);
        } else {
          for (let i = 0; i < pngPages.length; i++) {
            const pagePath = join(dir, `${name}-${i + 1}.png`);
            await writeFile(pagePath, pngPages[i]!);
          }
        }

        return { success: true, path: result.filePath };
      } catch (err) {
        const message = err instanceof Error ? err.message : "PNG export failed";
        return { success: false, error: message };
      }
    }
    return { success: false, error: "Cancelled" };
  });
}
