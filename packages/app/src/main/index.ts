import { app, BrowserWindow, shell, protocol, net, nativeImage } from "electron";
import { join, resolve as resolvePath } from "path";
import { pathToFileURL } from "url";
import { registerIpcHandlers } from "./ipc.js";
import { openFile, getRecentFiles, stopWatching } from "./file-handler.js";
import { createAppMenu } from "./menu.js";

const isDev = !app.isPackaged;
const iconPath = isDev
  ? join(__dirname, "../../resources/icons/512x512.png")
  : join(process.resourcesPath, "icons/512x512.png");

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    show: false,
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
  });

  // Set macOS dock icon
  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(appIcon);
  }

  // Forward renderer console to main process terminal
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const prefix = ["LOG", "WARN", "ERR", "INFO"][level] ?? "LOG";
    console.log(`[Renderer ${prefix}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    stopWatching();
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Load the renderer
  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  // Register IPC handlers
  registerIpcHandlers(mainWindow);

  // Handle CLI file argument, --edit mode, or restore last opened file
  const editMode = process.argv.includes("--edit");
  const fileArg = process.argv.find((arg) => arg.endsWith(".md"));
  const fileToOpen = fileArg ?? null;

  if (fileToOpen) {
    mainWindow.webContents.on("did-finish-load", () => {
      openFile(fileToOpen, mainWindow!);
      if (editMode) {
        mainWindow!.webContents.send("app:set-mode", "builder");
      }
    });
  }
}

// macOS: handle file open via Finder / drag-drop onto dock icon
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    openFile(filePath, mainWindow);
  } else {
    // App not ready yet — wait, then open
    app.whenReady().then(() => {
      if (mainWindow) {
        openFile(filePath, mainWindow);
      }
    });
  }
});

// Register custom protocol to serve local files (images, etc.) referenced in markdown.
// This allows the renderer (running on localhost in dev) to load file:// resources securely.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-resource",
    privileges: { bypassCSP: true, supportFetchAPI: true, stream: true },
  },
]);

app.whenReady().then(() => {
  // Handle local-resource:// requests by serving the file from disk
  protocol.handle("local-resource", (request) => {
    // URL format: local-resource:///absolute/path/to/file.png
    const rawPath = decodeURIComponent(new URL(request.url).pathname);
    const filePath = resolvePath(rawPath); // normalize ./  and ../ segments
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createAppMenu(() => mainWindow);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
