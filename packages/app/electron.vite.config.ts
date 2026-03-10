import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      // Emit CJS to avoid ESM/CJS interop issues with Electron's embedded Node
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
        },
        output: {
          format: "cjs",
        },
        external: ["playwright", "playwright-core"],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, "src/renderer"),
    define: {
      "global": "globalThis",
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
        // Node-only deps pulled in transitively by @teammind/markview-engine
        // must not be bundled into the browser renderer.
        external: ["linkedom", "playwright", "playwright-core", "fs", "fs/promises", "path", "node:fs", "node:fs/promises", "node:path"],
      },
    },
    plugins: [react()],
    optimizeDeps: {
      exclude: ["linkedom", "playwright", "playwright-core"],
    },
    resolve: {
      alias: {
        // gray-matter uses Buffer — provide polyfill for browser context
        buffer: "buffer",
      },
    },
  },
});
