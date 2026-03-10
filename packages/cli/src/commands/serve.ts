import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import express from "express";
import { WebSocketServer } from "ws";
import { watch } from "chokidar";
import chalk from "chalk";
import { render } from "@teammind/markview-engine";
import { getGlobalOptions, log } from "../utils/output.js";

const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  const ws = new WebSocket('ws://' + location.host + '/__ws');
  ws.onmessage = function(event) {
    if (event.data === 'reload') {
      location.reload();
    }
  };
  ws.onclose = function() {
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>
`;

export function registerServeCommand(program: Command): void {
  program
    .command("serve")
    .description("Start a live-reloading preview server")
    .argument("<fileOrDir>", "Markdown file or directory to serve")
    .option("-p, --port <port>", "Port to listen on", "3000")
    .action(async (fileOrDir: string, opts: { port: string }, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);
      const port = parseInt(opts.port, 10);
      const target = path.resolve(fileOrDir);

      let stat: Awaited<ReturnType<typeof fs.stat>>;
      try {
        stat = await fs.stat(target);
      } catch {
        console.error(`Error: "${target}" does not exist`);
        process.exit(1);
      }

      const isDirectory = stat.isDirectory();
      const app = express();
      const server = createServer(app);
      const wss = new WebSocketServer({ server, path: "/__ws" });

      function notifyClients(): void {
        for (const client of wss.clients) {
          if (client.readyState === 1) {
            client.send("reload");
          }
        }
      }

      if (isDirectory) {
        app.get("/", async (_req, res) => {
          try {
            const entries = await fs.readdir(target, { withFileTypes: true });
            const mdFiles = entries
              .filter((e) => e.isFile() && e.name.endsWith(".md"))
              .map((e) => e.name);
            const dirs = entries
              .filter((e) => e.isDirectory() && !e.name.startsWith("."))
              .map((e) => e.name);

            const html = buildDirectoryListing(target, mdFiles, dirs);
            res.type("html").send(html);
          } catch (err) {
            res.status(500).send(
              `Error: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        });

        app.get("/:file", async (req, res) => {
          const filePath = path.join(target, req.params.file);
          if (!filePath.endsWith(".md")) {
            res.status(400).send("Only .md files are supported");
            return;
          }
          try {
            const markdown = await fs.readFile(filePath, "utf-8");
            const result = await render(markdown);
            const html = wrapServedHtml(result.html, req.params.file);
            res.type("html").send(html);
          } catch {
            res.status(404).send("File not found");
          }
        });

        const watcher = watch(path.join(target, "**/*.md"), {
          ignoreInitial: true,
        });
        watcher.on("change", () => notifyClients());
        watcher.on("add", () => notifyClients());
      } else {
        app.get("/", async (_req, res) => {
          try {
            const markdown = await fs.readFile(target, "utf-8");
            const result = await render(markdown);
            const html = wrapServedHtml(result.html, path.basename(target));
            res.type("html").send(html);
          } catch (err) {
            res.status(500).send(
              `Error: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        });

        const watcher = watch(target, { ignoreInitial: true });
        watcher.on("change", () => {
          log(chalk.gray("File changed, reloading..."), globalOpts);
          notifyClients();
        });
      }

      server.listen(port, () => {
        log(
          chalk.green(
            `\nMarkView server running at ${chalk.bold(`http://localhost:${port}`)}\n`,
          ),
          globalOpts,
        );
        log(
          chalk.gray(
            `Serving: ${path.relative(process.cwd(), target) || "."}`,
          ),
          globalOpts,
        );
        log(chalk.gray("Press Ctrl+C to stop\n"), globalOpts);
      });
    });
}

function wrapServedHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — MarkView</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
    blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #666; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${body}
${LIVE_RELOAD_SCRIPT}
</body>
</html>`;
}

function buildDirectoryListing(
  dirPath: string,
  mdFiles: string[],
  dirs: string[],
): string {
  const dirName = path.basename(dirPath);
  const fileLinks = mdFiles
    .map((f) => `<li><a href="/${f}">${escapeHtml(f)}</a></li>`)
    .join("\n      ");
  const dirLinks = dirs
    .map((d) => `<li>${escapeHtml(d)}/</li>`)
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(dirName)} — MarkView</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; }
    h1 { border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.4rem 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapeHtml(dirName)}</h1>
  ${dirs.length > 0 ? `<h2>Directories</h2><ul>${dirLinks}</ul>` : ""}
  ${mdFiles.length > 0 ? `<h2>Markdown Files</h2><ul>${fileLinks}</ul>` : "<p>No Markdown files found.</p>"}
${LIVE_RELOAD_SCRIPT}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
