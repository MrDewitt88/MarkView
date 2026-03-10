/// <reference types="vite/client" />

import type { MarkviewAPI } from "../preload/index.js";

declare global {
  interface Window {
    markview: MarkviewAPI;
  }
}
