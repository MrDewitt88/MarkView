import { dialog } from "electron";

let autoUpdater: typeof import("electron-updater").autoUpdater | null = null;

async function getUpdater() {
  if (!autoUpdater) {
    const mod = await import("electron-updater");
    autoUpdater = mod.autoUpdater;
  }
  return autoUpdater;
}

export async function initAutoUpdater(): Promise<void> {
  const updater = await getUpdater();
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;

  updater.on("update-available", (info) => {
    console.log(`Update available: ${info.version}`);
  });

  updater.on("update-downloaded", (info) => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Update Ready",
        message: "A new version has been downloaded.",
        detail: `Version ${info.version} is ready to install. Restart now to apply the update.`,
        buttons: ["Install", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          updater.quitAndInstall();
        }
      });
  });

  updater.on("error", (err) => {
    console.error("Auto-updater error:", err);
  });

  updater.checkForUpdatesAndNotify();
}

export async function checkForUpdatesManually(): Promise<void> {
  const updater = await getUpdater();
  updater.checkForUpdatesAndNotify();
}
