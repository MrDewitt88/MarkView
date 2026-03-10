import { Command } from "commander";
import chalk from "chalk";

export function registerMcpCommand(program: Command): void {
  program
    .command("mcp")
    .description("Start MCP server for AI agent integration (stdio)")
    .action(async () => {
      try {
        const mcp = await import("@teammind/markview-mcp");
        // The MCP package auto-starts on import
      } catch {
        console.error(chalk.red("MCP server failed to start."));
        console.error(`Install the MCP package: ${chalk.bold("npm install @teammind/markview-mcp")}`);
        process.exit(1);
      }
    });
}
