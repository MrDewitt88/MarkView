import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";
import { exportHtml, signPdf } from "@markview/engine";
import { exportPdf } from "@markview/engine/pdf";
import { resolveFiles } from "../utils/glob.js";
import { getGlobalOptions, log, output } from "../utils/output.js";

type ExportFormat = "pdf" | "html";

export function registerExportCommand(program: Command): void {
  program
    .command("export")
    .description("Export Markdown files to PDF or HTML")
    .argument("<fileOrGlob>", "Markdown file or glob pattern")
    .requiredOption(
      "--format <format>",
      "Output format: pdf or html",
    )
    .option("--outdir <dir>", "Output directory (default: same as source)")
    .option("--template <name>", "Template: default, report, or minimal")
    .option("--paper <format>", "Paper format for PDF (e.g., A4, Letter)", "A4")
    .option("--sign", "Sign the exported PDF with a certificate")
    .option("--cert <path>", "Path to PKCS#12 certificate (.p12) for signing")
    .option("--cert-password <password>", "Certificate password", "")
    .action(
      async (
        fileOrGlob: string,
        opts: {
          format: string;
          outdir?: string;
          template?: string;
          paper?: string;
          sign?: boolean;
          cert?: string;
          certPassword?: string;
        },
        cmd: Command,
      ) => {
        const globalOpts = getGlobalOptions(cmd);
        const format = opts.format as ExportFormat;

        if (!["pdf", "html"].includes(format)) {
          console.error(
            `Error: Invalid format "${format}". Use pdf or html.`,
          );
          process.exit(1);
        }

        if (opts.sign && !opts.cert) {
          console.error("Error: --sign requires --cert <path> to be specified.");
          process.exit(1);
        }

        if (opts.sign && format !== "pdf") {
          console.error("Error: --sign is only supported for PDF exports.");
          process.exit(1);
        }

        const files = await resolveFiles(fileOrGlob);

        if (files.length === 0) {
          // Try as a direct file path
          const direct = path.resolve(fileOrGlob);
          try {
            await fs.access(direct);
            files.push(direct);
          } catch {
            console.error(`Error: No matching files found for "${fileOrGlob}"`);
            process.exit(1);
          }
        }

        const outdir = opts.outdir ? path.resolve(opts.outdir) : undefined;
        if (outdir) {
          await fs.mkdir(outdir, { recursive: true });
        }

        log(
          chalk.blue(
            `Exporting ${files.length} file${files.length > 1 ? "s" : ""} to ${format}...`,
          ),
          globalOpts,
        );

        const results: Array<{ file: string; output: string; status: string }> = [];

        for (const file of files) {
          const basename = path.basename(file, ".md");
          const outputDir = outdir ?? path.dirname(file);
          const outPath = path.join(outputDir, `${basename}.${format}`);

          try {
            const markdown = await fs.readFile(file, "utf-8");

            switch (format) {
              case "html": {
                const htmlContent = await exportHtml(markdown, {
                  template: opts.template,
                });
                await fs.writeFile(outPath, htmlContent, "utf-8");
                break;
              }
              case "pdf": {
                let pdfBuffer = await exportPdf(markdown, {
                  template: opts.template,
                  paperFormat: opts.paper,
                });

                if (opts.sign && opts.cert) {
                  log(
                    chalk.blue(`  Signing ${basename}.pdf...`),
                    globalOpts,
                  );
                  pdfBuffer = await signPdf(
                    pdfBuffer,
                    path.resolve(opts.cert),
                    opts.certPassword ?? "",
                  );
                }

                await fs.writeFile(outPath, pdfBuffer);
                break;
              }
            }

            log(
              chalk.green(`  ${path.relative(process.cwd(), outPath)}`),
              globalOpts,
            );
            results.push({ file, output: outPath, status: "ok" });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            log(chalk.red(`  ${basename}: ${msg}`), globalOpts);
            results.push({ file, output: outPath, status: "error" });
          }
        }

        if (globalOpts.json) {
          output(JSON.stringify(results, null, 2) + "\n");
        }
      },
    );
}
