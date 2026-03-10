import { Command } from "commander";
import path from "node:path";
import chalk from "chalk";
import {
  searchMarkdown,
  resolveMarkdownFiles,
} from "@teammind/markview-engine";
import type { SearchOptions } from "@teammind/markview-engine";

export function registerSearchCommand(program: Command): void {
  program
    .command("search")
    .description("Search for text across Markdown files")
    .argument("<query>", "Search query")
    .argument("[dir]", "Directory to search in", ".")
    .option("--headings-only", "Only search in headings")
    .option("-C, --context <lines>", "Lines of context to show", "0")
    .action(async (query: string, dir: string, opts: Record<string, string | boolean | undefined>) => {
      const dirPath = path.resolve(dir);
      const files = await resolveMarkdownFiles(dirPath);

      if (files.length === 0) {
        console.error(chalk.yellow("No Markdown files found."));
        process.exit(0);
      }

      const options: SearchOptions = {
        headingsOnly: opts["headingsOnly"] === true,
        context: parseInt(opts["context"] as string, 10) || 0,
      };

      const results = await searchMarkdown(query, files, options);

      if (results.length === 0) {
        console.error(chalk.yellow(`No matches for "${query}".`));
        process.exit(0);
      }

      for (const r of results) {
        const relPath = path.relative(dirPath, r.file);

        // Context before
        for (const line of r.contextBefore) {
          console.log(chalk.dim(`  ${line}`));
        }

        // Match line
        const highlighted = r.matchText.replace(
          new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
          (m) => chalk.bold.red(m),
        );
        console.log(`${chalk.cyan(relPath)}:${chalk.yellow(String(r.line))}  ${highlighted}`);

        // Context after
        for (const line of r.contextAfter) {
          console.log(chalk.dim(`  ${line}`));
        }
      }

      console.error(chalk.dim(`\n${results.length} match${results.length === 1 ? "" : "es"} in ${files.length} file${files.length === 1 ? "" : "s"}`));
    });
}
