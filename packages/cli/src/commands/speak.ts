import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import {
  speak,
  isAvailable,
  getVoices,
  extractSpeakableText,
  extractSection,
  extractFromLine,
  extractFromPattern,
  splitIntoChunks,
} from "@teammind/markview-engine";
import type { SpeakloneConfig } from "@teammind/markview-engine";
import { loadConfig } from "../utils/config.js";

function resolveConfig(opts: Record<string, string | undefined>): SpeakloneConfig {
  const config = loadConfig();
  const tts = config.tts ?? {};

  const token = opts["token"] ?? process.env["SPEAKLONE_TOKEN"] ?? tts.token;
  if (!token) {
    console.error(chalk.red("No Speaklone token configured.\n"));
    console.error(`  Quick setup:  ${chalk.bold("markview config setup tts")}`);
    console.error(`  Manual:       ${chalk.bold('markview config set tts.token YOUR_TOKEN')}`);
    console.error(`\n  Find your token: Speaklone → Settings → Local API → Copy Token`);
    process.exit(1);
  }

  const endpoint = opts["endpoint"] ?? process.env["SPEAKLONE_ENDPOINT"] ?? tts.endpoint ?? "http://localhost:7849";
  // Ensure endpoint is base URL (without /speak)
  const baseEndpoint = endpoint.replace(/\/speak\/?$/, "");

  return {
    endpoint: baseEndpoint,
    token,
    voice: opts["voice"] ?? tts.voice,
    instruction: opts["instruction"] ?? tts.instruction,
    temperature: opts["temperature"] != null ? parseFloat(opts["temperature"]) : tts.temperature,
  };
}

export function registerSpeakCommand(program: Command): void {
  program
    .command("speak")
    .description("Read a Markdown file aloud via Speaklone")
    .argument("<file>", "Markdown file to read (use - for stdin)")
    .option("--section <heading>", "Read only a specific section")
    .option("--from <lineOrText>", "Start reading from line number or text pattern")
    .option("--to <lineOrText>", "Stop reading at line number or text pattern")
    .option("--voice <name>", "Speaklone voice (e.g. aiden, ryan)")
    .option("--instruction <text>", "Emotion/style instruction")
    .option("--temperature <float>", "Temperature 0.0–1.0")
    .option("--token <token>", "One-time token override")
    .option("--endpoint <url>", "One-time endpoint override")
    .option("--list-voices", "List available voices")
    .action(async (file: string, opts: Record<string, string | boolean | undefined>) => {
      const config = resolveConfig(opts as Record<string, string | undefined>);

      // List voices
      if (opts["listVoices"]) {
        try {
          const voices = await getVoices(config);
          console.log(chalk.bold("\nAvailable Voices:\n"));
          for (const v of voices) {
            console.log(`  ${chalk.bold(v.id.padEnd(12))} ${v.name} — ${v.description} (${v.gender})`);
          }
          console.log();
        } catch (err) {
          console.error(chalk.red(`Failed to get voices: ${err instanceof Error ? err.message : err}`));
          process.exit(1);
        }
        return;
      }

      // Check availability
      const available = await isAvailable({ endpoint: config.endpoint });
      if (!available) {
        console.error(chalk.red("Speaklone is not running. Start the app and try again."));
        process.exit(1);
      }

      // Read markdown
      let markdown: string;
      if (file === "-") {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        markdown = Buffer.concat(chunks).toString("utf-8");
      } else {
        const filePath = path.resolve(file);
        try {
          markdown = await fs.readFile(filePath, "utf-8");
        } catch {
          console.error(chalk.red(`Cannot read file: ${filePath}`));
          process.exit(1);
        }
      }

      // Extract text
      let text: string;
      if (opts["from"]) {
        const from = opts["from"] as string;
        const to = opts["to"] as string | undefined;
        const fromNum = /^\d+$/.test(from) ? parseInt(from, 10) : NaN;
        const toNum = to && /^\d+$/.test(to) ? parseInt(to, 10) : undefined;

        if (!isNaN(fromNum)) {
          text = extractFromLine(markdown, fromNum, toNum);
        } else {
          text = extractFromPattern(markdown, from, toNum ?? to);
        }
        if (!text) {
          console.error(chalk.red(`No text found from "${from}".`));
          process.exit(1);
        }
      } else if (opts["section"]) {
        text = extractSection(markdown, opts["section"] as string);
        if (!text) {
          console.error(chalk.red(`Section "${opts["section"]}" not found.`));
          process.exit(1);
        }
      } else {
        text = extractSpeakableText(markdown);
      }

      if (!text.trim()) {
        console.error(chalk.yellow("No speakable text found in the document."));
        process.exit(0);
      }

      // Split into chunks and speak
      const textChunks = splitIntoChunks(text, 500);
      const total = textChunks.length;

      if (total > 1) {
        console.error(chalk.dim(`Speaking ${total} chunks...`));
      }

      for (let i = 0; i < textChunks.length; i++) {
        if (total > 1) {
          console.error(chalk.dim(`  [${i + 1}/${total}]`));
        }
        const result = await speak(textChunks[i]!, config);
        if (!result.success) {
          console.error(chalk.red(`Speak failed: ${result.error}`));
          process.exit(1);
        }
      }

      console.error(chalk.green("Done."));
    });
}
