import { Buffer } from "buffer";
// Polyfill Buffer for browser context (required by gray-matter)
globalThis.Buffer = globalThis.Buffer ?? Buffer;

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "katex/dist/katex.min.css";
import "./styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
