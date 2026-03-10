import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";
import { signPdf } from "@markview/engine";
import { getGlobalOptions, log, output } from "../utils/output.js";

export function registerSignCommand(program: Command): void {
  program
    .command("sign")
    .description("Sign a PDF file with an X.509 certificate")
    .argument("<file>", "PDF file to sign")
    .requiredOption("--cert <path>", "Path to PKCS#12 certificate (.p12)")
    .option("--password <password>", "Certificate password", "")
    .action(
      async (
        file: string,
        opts: { cert: string; password: string },
        cmd: Command,
      ) => {
        const globalOpts = getGlobalOptions(cmd);
        const filePath = path.resolve(file);
        const certPath = path.resolve(opts.cert);

        try {
          // Read the PDF
          const pdfBuffer = await fs.readFile(filePath);

          log(
            chalk.blue(`Signing ${path.basename(filePath)} with certificate...`),
            globalOpts,
          );

          // Sign the PDF
          const signedBuffer = await signPdf(pdfBuffer, certPath, opts.password);

          // Write signed PDF
          const ext = path.extname(filePath);
          const base = path.basename(filePath, ext);
          const dir = path.dirname(filePath);
          const signedPath = path.join(dir, `${base}.signed${ext}`);

          await fs.writeFile(signedPath, signedBuffer);

          log(
            chalk.green(`Signed PDF written to: ${path.relative(process.cwd(), signedPath)}`),
            globalOpts,
          );

          if (globalOpts.json) {
            output(
              JSON.stringify(
                {
                  file: filePath,
                  cert: certPath,
                  output: signedPath,
                  status: "signed",
                },
                null,
                2,
              ) + "\n",
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          log(chalk.red(`Error signing PDF: ${msg}`), globalOpts);

          if (globalOpts.json) {
            output(
              JSON.stringify(
                {
                  file: filePath,
                  cert: certPath,
                  status: "error",
                  error: msg,
                },
                null,
                2,
              ) + "\n",
            );
          }

          process.exit(1);
        }
      },
    );
}
