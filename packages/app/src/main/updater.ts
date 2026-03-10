import { dialog } from "electron";
import { autoUpdater } from "electron-updater";

export function initAutoUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    console.log(`Update available: ${info.version}`);
  });

  autoUpdater.on("update-downloaded", (info) => {
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
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto-updater error:", err);
  });

  autoUpdater.checkForUpdatesAndNotify();
}

export function checkForUpdatesManually(): void {
  autoUpdater.checkForUpdatesAndNotify();
}
