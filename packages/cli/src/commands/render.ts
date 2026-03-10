import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { render } from "@teammind/markview-engine";
import { exportPdf } from "@teammind/markview-engine/pdf";
import { getGlobalOptions, log, output } from "../utils/output.js";

export function registerRenderCommand(program: Command): void {
  program
    .command("render")
    .description("Render a Markdown file to HTML")
    .argument("<file>", "Markdown file to render (use - for stdin)")
    .option("-o, --output <path>", "Write HTML to file instead of stdout")
    .action(async (file: string, opts: { output?: string }, cmd: Command) => {
      const globalOpts = getGlobalOptions(cmd);

      let markdown: string;

      if (file === "-") {
        markdown = await readStdin();
      } else {
        const filePath = path.resolve(file);
        try {
          markdown = await fs.readFile(filePath, "utf-8");
        } catch {
          console.error(`Error: Cannot read file "${filePath}"`);
          process.exit(1);
        }
      }

      try {
        const result = await render(markdown);

        if (globalOpts.json) {
          output(
            JSON.stringify(
              {
                html: result.html,
                frontmatter: result.frontmatter,
                toc: result.toc,
              },
              null,
              2,
            ) + "\n",
          );
          return;
        }

        if (opts.output) {
          const outPath = path.resolve(opts.output);
          const ext = path.extname(outPath).toLowerCase();

          if (ext === ".pdf") {
            const pdfBuffer = await exportPdf(markdown);
            await fs.writeFile(outPath, pdfBuffer);
          } else {
            await fs.writeFile(outPath, result.html, "utf-8");
          }
          log(`Written to ${outPath}`, globalOpts);
        } else {
          output(result.html);
        }
      } catch (err) {
        console.error(
          `Error rendering: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });
}
