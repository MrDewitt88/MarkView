const { app, BrowserWindow } = require("electron"); console.log("app:", typeof app); app.whenReady().then(() => { console.log("ELECTRON READY"); app.quit(); });
