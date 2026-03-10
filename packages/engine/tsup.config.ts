import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/pdf.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    external: ["playwright", "jsdom"],
  },
  {
    entry: ["src/browser.ts"],
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: [
      "playwright", "jsdom", "linkedom",
      "fs", "fs/promises", "path", "url",
      "node:fs", "node:fs/promises", "node:path", "node:url",
      "juice", "qrcode", "node-forge",
    ],
  },
]);
