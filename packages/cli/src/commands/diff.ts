import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import chalk from "chalk";
import { diffMarkdown } from "@teammind/markview-engine";

export function registerDiffCommand(program: Command): void {
  program
    .command("diff")
    .description("Show line-level diff between two Markdown files")
    .argument("<old>", "Path to the old Markdown file")
    .argument("<new>", "Path to the new Markdown file")
    .option("--git <ref>", "Compare <new> against a git revision (e.g. HEAD, main, abc123)")
    .action(async (oldFile: string, newFile: string, opts: Record<string, string | undefined>) => {
      const gitRef = opts["git"];

      let oldContent: string;
      let newContent: string;

      if (gitRef) {
        // When --git is used, <old> is ignored and <new> is the working-tree file.
        // We fetch the old content from the git revision.
        const filePath = path.resolve(newFile);
        if (!fs.existsSync(filePath)) {
          console.error(chalk.red(`File not found: ${filePath}`));
          process.exit(1);
        }
        newContent = fs.readFileSync(filePath, "utf-8");

        // Get the repo-relative path for git show
        try {
          const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
          const relativePath = path.relative(repoRoot, filePath);
          oldContent = execSync(`git show ${gitRef}:${relativePath}`, { encoding: "utf-8" });
        } catch {
          console.error(chalk.red(`Failed to retrieve ${newFile} from git ref "${gitRef}".`));
          process.exit(1);
        }
      } else {
        const oldPath = path.resolve(oldFile);
        const newPath = path.resolve(newFile);

        if (!fs.existsSync(oldPath)) {
          console.error(chalk.red(`File not found: ${oldPath}`));
          process.exit(1);
        }
        if (!fs.existsSync(newPath)) {
          console.error(chalk.red(`File not found: ${newPath}`));
          process.exit(1);
        }

        oldContent = fs.readFileSync(oldPath, "utf-8");
        newContent = fs.readFileSync(newPath, "utf-8");
      }

      const result = diffMarkdown(oldContent, newContent);

      for (const chunk of result.chunks) {
        switch (chunk.type) {
          case "removed":
            console.log(chalk.red(`- ${chunk.content}`));
            break;
          case "added":
            console.log(chalk.green(`+ ${chunk.content}`));
            break;
          case "unchanged":
            console.log(chalk.dim(`  ${chunk.content}`));
            break;
        }
      }

      console.error(
        chalk.dim(
          `\n${chalk.green(`+${result.additions}`)} addition${result.additions === 1 ? "" : "s"}, ${chalk.red(`-${result.deletions}`)} deletion${result.deletions === 1 ? "" : "s"}`,
        ),
      );
    });
}
