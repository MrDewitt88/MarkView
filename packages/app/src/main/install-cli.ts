import { app, dialog } from "electron";
import { existsSync, symlinkSync, unlinkSync, writeFileSync, chmodSync } from "fs";
import { join } from "path";

const CLI_SYMLINK = "/usr/local/bin/markview";

/**
 * Create a shell wrapper script inside the app bundle that invokes the
 * Electron binary with ELECTRON_RUN_AS_NODE=1 and points at the bundled
 * CLI entry point.  Then symlink /usr/local/bin/markview → that wrapper.
 *
 * On macOS the wrapper lives inside MarkView.app/Contents/Resources/.
 * On Linux it lives next to the executable.
 * On Windows we skip this approach (use PATH-based NSIS installer instead).
 */
export async function installCli(): Promise<void> {
  if (process.platform === "win32") {
    dialog.showMessageBox({
      type: "info",
      title: "Install CLI",
      message:
        "On Windows the CLI is available after adding the install directory to your PATH.\nAlternatively, install globally via: npm install -g @teammind/markview-cli",
    });
    return;
  }

  const wrapperPath = getWrapperPath();
  createWrapper(wrapperPath);

  try {
    // Remove existing symlink / file
    if (existsSync(CLI_SYMLINK)) {
      unlinkSync(CLI_SYMLINK);
    }
    symlinkSync(wrapperPath, CLI_SYMLINK);

    await dialog.showMessageBox({
      type: "info",
      title: "CLI Installed",
      message: `"markview" command installed successfully.\n\nUsage:\n  markview render file.md\n  markview serve file.md\n  markview export file.md --format pdf\n\nSymlink: ${CLI_SYMLINK} → ${wrapperPath}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("EACCES") || msg.includes("permission")) {
      const { response } = await dialog.showMessageBox({
        type: "question",
        title: "Permission Required",
        message:
          "Creating the symlink requires administrator privileges.\nWould you like to retry with sudo?",
        buttons: ["Retry with sudo", "Cancel"],
        defaultId: 0,
      });

      if (response === 0) {
        await installCliWithSudo(wrapperPath);
      }
    } else {
      dialog.showErrorBox("CLI Installation Failed", msg);
    }
  }
}

export function isCliInstalled(): boolean {
  try {
    return existsSync(CLI_SYMLINK);
  } catch {
    return false;
  }
}

export async function uninstallCli(): Promise<void> {
  if (!existsSync(CLI_SYMLINK)) {
    dialog.showMessageBox({
      type: "info",
      title: "CLI Not Installed",
      message: `No symlink found at ${CLI_SYMLINK}.`,
    });
    return;
  }

  try {
    unlinkSync(CLI_SYMLINK);
    dialog.showMessageBox({
      type: "info",
      title: "CLI Uninstalled",
      message: `Removed ${CLI_SYMLINK}.`,
    });
  } catch {
    await uninstallCliWithSudo();
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function getWrapperPath(): string {
  if (process.platform === "darwin") {
    // Inside .app bundle: MarkView.app/Contents/Resources/markview-cli
    const resourcesPath = app.isPackaged
      ? join(process.resourcesPath, "markview-cli")
      : join(app.getAppPath(), "resources", "markview-cli");
    return resourcesPath;
  }
  // Linux: next to the executable
  return join(app.getPath("exe"), "..", "markview-cli");
}

function getCliEntryPoint(): string {
  // The CLI package is bundled within the app's node_modules
  if (app.isPackaged) {
    return join(process.resourcesPath, "app.asar", "node_modules", "@teammind", "markview-cli", "dist", "index.js");
  }
  // Dev mode: use the workspace package directly
  return join(app.getAppPath(), "..", "..", "cli", "dist", "index.js");
}

function createWrapper(wrapperPath: string): void {
  const electronPath = process.execPath;
  const cliEntry = getCliEntryPoint();

  const script = `#!/bin/sh
# TeamMind MarkView CLI — installed by TeamMind MarkView.app
# This wrapper runs the bundled CLI using the Electron Node.js runtime.
ELECTRON_RUN_AS_NODE=1 exec "${electronPath}" "${cliEntry}" "$@"
`;

  writeFileSync(wrapperPath, script, { mode: 0o755 });
  chmodSync(wrapperPath, 0o755);
}

async function installCliWithSudo(wrapperPath: string): Promise<void> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    // Use osascript to get admin privileges (macOS)
    if (process.platform === "darwin") {
      await execAsync(
        `osascript -e 'do shell script "ln -sf \\"${wrapperPath}\\" \\"${CLI_SYMLINK}\\"" with administrator privileges'`,
      );
    } else {
      // Linux: pkexec
      await execAsync(
        `pkexec ln -sf "${wrapperPath}" "${CLI_SYMLINK}"`,
      );
    }

    dialog.showMessageBox({
      type: "info",
      title: "CLI Installed",
      message: `"markview" command installed successfully at ${CLI_SYMLINK}.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("User canceled") && !msg.includes("cancelled")) {
      dialog.showErrorBox("CLI Installation Failed", msg);
    }
  }
}

async function uninstallCliWithSudo(): Promise<void> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    if (process.platform === "darwin") {
      await execAsync(
        `osascript -e 'do shell script "rm -f \\"${CLI_SYMLINK}\\"" with administrator privileges'`,
      );
    } else {
      await execAsync(`pkexec rm -f "${CLI_SYMLINK}"`);
    }
    dialog.showMessageBox({
      type: "info",
      title: "CLI Uninstalled",
      message: `Removed ${CLI_SYMLINK}.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("User canceled") && !msg.includes("cancelled")) {
      dialog.showErrorBox("CLI Uninstall Failed", msg);
    }
  }
}
