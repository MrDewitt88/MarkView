import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";
import { lint } from "@markview/engine";
import type { LintResult } from "@markview/engine";
import { resolveFiles } from "../utils/glob.js";
import { getGlobalOptions, log, output } from "../utils/output.js";

export function registerLintCommand(program: Command): void {
  program
    .command("lint")
    .description("Lint Markdown files for issues")
    .argument("<fileOrGlob>", "Markdown file or glob pattern")
    .option("--strict", "Enable strict mode (additional checks)")
    .action(
      async (
        fileOrGlob: string,
        opts: { strict?: boolean },
        cmd: Command,
      ) => {
        const globalOpts = getGlobalOptions(cmd);

        let files = await resolveFiles(fileOrGlob);

        if (files.length === 0) {
          const direct = path.resolve(fileOrGlob);
          try {
            await fs.access(direct);
            files = [direct];
          } catch {
            console.error(
              `Error: No matching files found for "${fileOrGlob}"`,
            );
            process.exit(1);
          }
        }

        const allResults: LintResult[] = [];
        let hasErrors = false;

        for (const file of files) {
          const markdown = await fs.readFile(file, "utf-8");
          const result = await lint(markdown, { strict: opts.strict ?? false });
          // Set the file path on the result
          const fileResult: LintResult = {
            file: path.resolve(file),
            issues: result.issues,
          };
          allResults.push(fileResult);

          if (fileResult.issues.length > 0) {
            hasErrors = fileResult.issues.some((i) => i.severity === "error") || hasErrors;
          }
        }

        if (globalOpts.json) {
          output(JSON.stringify(allResults, null, 2) + "\n");
        } else {
          for (const result of allResults) {
            const relPath = path.relative(process.cwd(), result.file);

            if (result.issues.length === 0) {
              log(chalk.green(`  ${relPath}: OK`), globalOpts);
            } else {
              log(chalk.bold(relPath), globalOpts);
              for (const issue of result.issues) {
                const icon =
                  issue.severity === "error"
                    ? chalk.red("  error")
                    : chalk.yellow("  warning");
                log(
                  `  ${icon} ${chalk.gray(`line ${issue.line}:`)} ${issue.message}`,
                  globalOpts,
                );
              }
            }
          }

          const totalIssues = allResults.reduce(
            (sum, r) => sum + r.issues.length,
            0,
          );
          if (totalIssues === 0) {
            log(
              chalk.green(`\nAll ${files.length} file${files.length > 1 ? "s" : ""} passed.`),
              globalOpts,
            );
          } else {
            log(
              chalk.yellow(`\nFound ${totalIssues} issue${totalIssues > 1 ? "s" : ""}.`),
              globalOpts,
            );
          }
        }

        process.exit(hasErrors ? 1 : 0);
      },
    );
}
