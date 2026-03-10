import chalk from "chalk";
import type { Command } from "commander";

export interface OutputOptions {
  json?: boolean;
  quiet?: boolean;
}

export function getGlobalOptions(cmd: Command): OutputOptions {
  const root = cmd.parent ?? cmd;
  const opts = root.opts<OutputOptions>();
  return {
    json: opts.json ?? false,
    quiet: opts.quiet ?? false,
  };
}

export function formatOutput(
  data: Record<string, unknown>,
  options: OutputOptions,
): string {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }
  if (options.quiet) {
    return "";
  }
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.length > 200) {
      lines.push(`${chalk.bold(key)}: ${value.slice(0, 200)}...`);
    } else {
      lines.push(`${chalk.bold(key)}: ${String(value)}`);
    }
  }
  return lines.join("\n");
}

export function log(message: string, options: OutputOptions): void {
  if (!options.quiet) {
    console.error(message);
  }
}

export function output(text: string): void {
  process.stdout.write(text);
}
