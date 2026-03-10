import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface MarkviewConfig {
  tts?: {
    provider?: string;
    endpoint?: string;
    token?: string;
    voice?: string;
    instruction?: string;
    temperature?: number;
  };
  theme?: string;
  template?: string;
}

const DEFAULT_CONFIG: MarkviewConfig = {
  tts: {
    provider: "speaklone",
    endpoint: "http://localhost:7849/speak",
    voice: "aiden",
    temperature: 0.8,
  },
  theme: "system",
  template: "default",
};

export function getConfigPath(): string {
  const platform = os.platform();
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "markview", "config.json");
  } else if (platform === "win32") {
    return path.join(process.env["APPDATA"] ?? path.join(os.homedir(), "AppData", "Roaming"), "markview", "config.json");
  }
  return path.join(process.env["XDG_CONFIG_HOME"] ?? path.join(os.homedir(), ".config"), "markview", "config.json");
}

function ensureConfigDir(): void {
  const dir = path.dirname(getConfigPath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadConfig(): MarkviewConfig {
  const configPath = getConfigPath();
  try {
    const data = fs.readFileSync(configPath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: MarkviewConfig): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { encoding: "utf-8", mode: 0o600 });
}

export function getConfigValue(key: string): unknown {
  const config = loadConfig();
  return getNestedValue(config, key);
}

export function setConfigValue(key: string, value: unknown): void {
  const config = loadConfig();
  setNestedValue(config, key, value);
  saveConfig(config);
}

export function resetConfig(): void {
  saveConfig({ ...DEFAULT_CONFIG });
}

export function maskSecret(value: string): string {
  if (value.length <= 4) return "****";
  return value.slice(0, 4) + "****";
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
  const parts = key.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (current[part] == null || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
}
