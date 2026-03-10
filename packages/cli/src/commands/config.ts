import { Command } from "commander";
import chalk from "chalk";
import readline from "node:readline";
import {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  getConfigPath,
  maskSecret,
} from "../utils/config.js";
import { isAvailable, speak } from "@teammind/markview-engine";
import type { SpeakloneConfig } from "@teammind/markview-engine";

const SECRET_KEYS = ["tts.token"];

function isSecret(key: string): boolean {
  return SECRET_KEYS.some((s) => key === s || key.endsWith(`.${s.split(".").pop()}`));
}

function formatValue(key: string, value: unknown, reveal: boolean): string {
  if (value == null) return chalk.dim("(not set)");
  const str = String(value);
  if (!reveal && isSecret(key)) return maskSecret(str);
  return str;
}

function printConfig(config: Record<string, unknown>, prefix = ""): void {
  for (const [key, value] of Object.entries(config)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      printConfig(value as Record<string, unknown>, fullKey);
    } else {
      console.log(`  ${chalk.bold(fullKey)}: ${formatValue(fullKey, value, false)}`);
    }
  }
}

function ask(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function registerConfigCommand(program: Command): void {
  const cmd = program
    .command("config")
    .description("Manage MarkView configuration");

  cmd
    .command("set <key> <value>")
    .description("Set a config value")
    .action((key: string, value: string) => {
      // Parse numbers
      const numVal = Number(value);
      const parsed = !isNaN(numVal) && value !== "" ? numVal : value;
      setConfigValue(key, parsed);
      console.log(chalk.green(`Set ${key} = ${formatValue(key, parsed, false)}`));
    });

  cmd
    .command("get <key>")
    .description("Get a config value")
    .option("--reveal", "Show secrets in full")
    .action((key: string, opts: { reveal?: boolean }) => {
      const value = getConfigValue(key);
      console.log(formatValue(key, value, opts.reveal ?? false));
    });

  cmd
    .command("list")
    .description("List all config values")
    .action(() => {
      const config = loadConfig();
      printConfig(config as unknown as Record<string, unknown>);
    });

  cmd
    .command("reset")
    .description("Reset config to defaults")
    .action(() => {
      resetConfig();
      console.log(chalk.green("Config reset to defaults."));
    });

  cmd
    .command("path")
    .description("Show config file path")
    .action(() => {
      console.log(getConfigPath());
    });

  cmd
    .command("setup <provider>")
    .description("Interactive setup wizard")
    .action(async (provider: string) => {
      if (provider !== "tts") {
        console.error(`Unknown provider: ${provider}. Available: tts`);
        process.exit(1);
      }

      console.log(chalk.bold("\nSpeaklone TTS Setup\n"));

      const token = await ask("Speaklone Token: ");
      if (!token) {
        console.error(chalk.red("Token is required."));
        process.exit(1);
      }

      const endpoint = (await ask("Endpoint [http://localhost:7849/speak]: ")) || "http://localhost:7849/speak";
      const voice = (await ask("Default Voice [aiden]: ")) || "aiden";
      const tempStr = (await ask("Temperature [0.8]: ")) || "0.8";
      const temperature = parseFloat(tempStr);

      const config = loadConfig();
      config.tts = {
        ...config.tts,
        provider: "speaklone",
        token,
        endpoint,
        voice,
        temperature,
      };
      saveConfig(config);

      const testConn = await ask("Test connection? [Y/n]: ");
      if (testConn.toLowerCase() !== "n") {
        // Use base endpoint (strip /speak path for status check)
        const baseEndpoint = endpoint.replace(/\/speak\/?$/, "");
        const available = await isAvailable({ endpoint: baseEndpoint });
        if (available) {
          const speakConfig: SpeakloneConfig = {
            endpoint: baseEndpoint,
            token,
            voice,
            temperature,
          };
          const result = await speak("MarkView ist bereit.", speakConfig);
          if (result.success) {
            console.log(chalk.green("\nSpeaklone connected. Config saved."));
            console.log(chalk.dim("  Test with: markview speak README.md"));
          } else {
            console.log(chalk.yellow(`\nSpeaklone reachable but speak failed: ${result.error}`));
          }
        } else {
          console.log(chalk.yellow("\nSpeaklone not reachable. Config saved anyway."));
          console.log(chalk.dim("  Start Speaklone and try: markview speak test.md"));
        }
      } else {
        console.log(chalk.green("\nConfig saved."));
      }
    });
}
