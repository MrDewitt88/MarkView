import { Command } from "commander";
import path from "node:path";
import { exec } from "node:child_process";
import chalk from "chalk";
import { getGlobalOptions, log } from "../utils/output.js";

export function registerOpenCommand(program: Command): void {
  program
    .command("open")
    .description("Open a file in the MarkView viewer")
    .argument("<file>", "Markdown file to open")
    .action(async (file: string, _opts: Record<string, never>, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      const filePath = path.resolve(file);

      // Try to launch @markview/app if installed
      try {
        const appPath = await resolveApp();
        log(chalk.blue(`Opening ${filePath} in MarkView viewer...`), globalOpts);
        exec(`"${appPath}" "${filePath}"`);
      } catch {
        // Fallback: start serve + open browser
        log(
          chalk.yellow(
            "@markview/app is not installed. Falling back to serve mode...",
          ),
          globalOpts,
        );
        await fallbackServe(filePath);
      }
    });

  program
    .command("edit")
    .description("Open a file in the MarkView builder/editor")
    .argument("<file>", "Markdown file to edit")
    .action(async (file: string, _opts: Record<string, never>, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      const filePath = path.resolve(file);

      try {
        const appPath = await resolveApp();
        log(chalk.blue(`Opening ${filePath} in MarkView editor...`), globalOpts);
        exec(`"${appPath}" --edit "${filePath}"`);
      } catch {
        log(
          chalk.yellow(
            "@markview/app is not installed. Falling back to serve mode...",
          ),
          globalOpts,
        );
        await fallbackServe(filePath);
      }
    });
}

async function resolveApp(): Promise<string> {
  // Try to find the electron app binary
  // This will be implemented properly in Phase 3
  throw new Error("@markview/app not found");
}

async function fallbackServe(filePath: string): Promise<void> {
  // Dynamically import serve to avoid circular deps
  const { default: openUrl } = await import("node:child_process").then((cp) => ({
    default: (url: string) => {
      const platform = process.platform;
      const cmd =
        platform === "darwin"
          ? "open"
          : platform === "win32"
            ? "start"
            : "xdg-open";
      cp.exec(`${cmd} ${url}`);
    },
  }));

  // Import express dynamically to set up a quick server
  const express = await import("express");
  const { render } = await import("@markview/engine");
  const fs = await import("node:fs/promises");
  const { createServer } = await import("node:http");

  const app = express.default();
  const server = createServer(app);

  const port = 3000;

  app.get("/", async (_req, res) => {
    try {
      const markdown = await fs.readFile(filePath, "utf-8");
      const result = await render(markdown);
      res.type("html").send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>MarkView</title>
<style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6}</style>
</head><body>${result.html}</body></html>`);
    } catch (err) {
      res.status(500).send(String(err));
    }
  });

  server.listen(port, () => {
    console.error(`MarkView running at http://localhost:${port}`);
    openUrl(`http://localhost:${port}`);
  });
}
