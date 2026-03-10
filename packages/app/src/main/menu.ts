import { Menu, app, shell, type BrowserWindow } from "electron";
import { installCli, uninstallCli, isCliInstalled } from "./install-cli.js";

export function createAppMenu(getWindow: () => BrowserWindow | null): void {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              {
                label: isCliInstalled()
                  ? "CLI Command Installed ✓"
                  : "Install 'markview' CLI Command…",
                click: () => installCli(),
              },
              {
                label: "Uninstall CLI Command…",
                click: () => uninstallCli(),
                visible: isCliInstalled(),
              },
              { type: "separator" as const },
              {
                label: "TTS Settings\u2026",
                click: () => {
                  const win = getWindow();
                  if (win) {
                    win.webContents.send("menu:tts-settings");
                  }
                },
              },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          } as Electron.MenuItemConstructorOptions,
        ]
      : []),

    // File menu
    {
      label: "File",
      submenu: [
        {
          label: "Open…",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            const win = getWindow();
            if (win) {
              win.webContents.send("menu:open");
            }
          },
        },
        { type: "separator" },
        {
          label: "Export as PDF…",
          accelerator: "CmdOrCtrl+Shift+E",
          click: () => {
            const win = getWindow();
            if (win) {
              win.webContents.send("menu:export-pdf");
            }
          },
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },

    // Edit menu
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },

    // View menu
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },

    // Window menu
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },

    // Help menu
    {
      label: "Help",
      submenu: [
        ...(!isMac
          ? [
              {
                label: "Install 'markview' CLI Command…",
                click: () => installCli(),
              },
              { type: "separator" as const },
            ]
          : []),
        {
          label: "Documentation",
          click: () =>
            shell.openExternal("https://github.com/markview/markview"),
        },
        {
          label: "Report Issue…",
          click: () =>
            shell.openExternal(
              "https://github.com/markview/markview/issues/new",
            ),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
