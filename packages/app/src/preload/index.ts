import { contextBridge, ipcRenderer } from "electron";

export interface FileData {
  path: string;
  name: string;
  content: string;
}

export interface ExportResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface SaveResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface NewFileResult {
  success: boolean;
  path?: string;
  name?: string;
  content?: string;
  error?: string;
}

export interface PdfExportOptions {
  landscape?: boolean;
  paperFormat?: string;
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

export interface SpeakResult {
  success: boolean;
  error?: string;
}

export interface TTSConfig {
  endpoint?: string;
  token?: string;
  voice?: string;
  instruction?: string;
  temperature?: number;
}

export interface VoiceInfo {
  id: string;
  name: string;
  gender: string;
  description: string;
}

export type AppMode = "viewer" | "builder";

export interface MarkviewAPI {
  openFile: () => Promise<string | null>;
  getRecentFiles: () => Promise<string[]>;
  exportPdf: (outPath: string) => Promise<ExportResult>;
  exportPdfWithOptions: (outPath: string, options?: PdfExportOptions) => Promise<ExportResult>;
  exportPdfDialog: () => Promise<ExportResult>;
  exportHtml: (markdown: string) => Promise<ExportResult>;
  exportPng: (markdown: string) => Promise<ExportResult>;
  saveFile: (filePath: string, content: string) => Promise<SaveResult>;
  saveAs: (content: string) => Promise<SaveResult>;
  newFile: (templateName: string) => Promise<NewFileResult>;
  getTemplates: () => Promise<string[]>;
  ttsSpeak: (text: string, config: TTSConfig) => Promise<SpeakResult>;
  ttsCheck: (endpoint?: string) => Promise<boolean>;
  ttsVoices: (config: TTSConfig) => Promise<VoiceInfo[]>;
  configLoad: () => Promise<Record<string, unknown>>;
  configSave: (config: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  onFileContent: (callback: (data: FileData) => void) => () => void;
  onFileChanged: (callback: (data: FileData) => void) => () => void;
  onSetMode: (callback: (mode: AppMode) => void) => () => void;
  onOpenTTSSettings: (callback: () => void) => () => void;
}

const api: MarkviewAPI = {
  openFile: () => ipcRenderer.invoke("file:open"),

  getRecentFiles: () => ipcRenderer.invoke("file:recent"),

  exportPdf: (outPath: string) => ipcRenderer.invoke("file:export", outPath),

  exportPdfWithOptions: (outPath: string, options?: PdfExportOptions) =>
    ipcRenderer.invoke("file:export-pdf", outPath, options),

  exportPdfDialog: () => ipcRenderer.invoke("file:export-dialog"),

  exportHtml: (markdown: string) => ipcRenderer.invoke("file:export-html", markdown),

  exportPng: (markdown: string) => ipcRenderer.invoke("file:export-png", markdown),

  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("file:save", filePath, content),

  saveAs: (content: string) => ipcRenderer.invoke("file:save-as", content),

  newFile: (templateName: string) =>
    ipcRenderer.invoke("file:new", templateName),

  getTemplates: () => ipcRenderer.invoke("file:templates"),

  ttsSpeak: (text: string, config: TTSConfig) =>
    ipcRenderer.invoke("tts:speak", text, config),

  ttsCheck: (endpoint?: string) =>
    ipcRenderer.invoke("tts:check", endpoint),

  ttsVoices: (config: TTSConfig) =>
    ipcRenderer.invoke("tts:voices", config),

  configLoad: () => ipcRenderer.invoke("config:load"),

  configSave: (config: Record<string, unknown>) =>
    ipcRenderer.invoke("config:save", config),

  onFileContent: (callback: (data: FileData) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: FileData): void => {
      callback(data);
    };
    ipcRenderer.on("file:content", handler);
    return () => {
      ipcRenderer.removeListener("file:content", handler);
    };
  },

  onFileChanged: (callback: (data: FileData) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: FileData): void => {
      callback(data);
    };
    ipcRenderer.on("file:changed", handler);
    return () => {
      ipcRenderer.removeListener("file:changed", handler);
    };
  },

  onSetMode: (callback: (mode: AppMode) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, mode: AppMode): void => {
      callback(mode);
    };
    ipcRenderer.on("app:set-mode", handler);
    return () => {
      ipcRenderer.removeListener("app:set-mode", handler);
    };
  },

  onOpenTTSSettings: (callback: () => void) => {
    const handler = (): void => {
      callback();
    };
    ipcRenderer.on("menu:tts-settings", handler);
    return () => {
      ipcRenderer.removeListener("menu:tts-settings", handler);
    };
  },
};

contextBridge.exposeInMainWorld("markview", api);
