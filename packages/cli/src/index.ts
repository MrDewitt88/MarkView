import { Command } from "commander";
import { registerRenderCommand } from "./commands/render.js";
import { registerExportCommand } from "./commands/export.js";
import { registerServeCommand } from "./commands/serve.js";
import { registerLintCommand } from "./commands/lint.js";
import { registerSignCommand } from "./commands/sign.js";
import { registerOpenCommand } from "./commands/open.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerSpeakCommand } from "./commands/speak.js";

const program = new Command();

program
  .name("markview")
  .description("TeamMind MarkView — Markdown rendering, export, and preview CLI")
  .version("0.1.0")
  .option("--json", "Output results as JSON")
  .option("--quiet", "Suppress non-essential output");

registerRenderCommand(program);
registerExportCommand(program);
registerServeCommand(program);
registerLintCommand(program);
registerSignCommand(program);
registerOpenCommand(program);
registerConfigCommand(program);
registerSpeakCommand(program);

program.parse(process.argv);
