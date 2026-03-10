import React, { useState, useRef, useEffect } from "react";
import type { Theme } from "../hooks/useTheme.js";
import type { AppMode } from "../App.js";
import { SpeakButton } from "./SpeakButton.js";
import logoUrl from "../assets/logo.png";

type ExportFormat = "pdf" | "html" | "png";

interface TTSConfig {
  endpoint?: string;
  token?: string;
  voice?: string;
  instruction?: string;
  temperature?: number;
}

interface ToolbarProps {
  fileName: string | null;
  theme: Theme;
  sidebarOpen: boolean;
  mode: AppMode;
  hasUnsavedChanges: boolean;
  ttsConfig: TTSConfig | null;
  speakableContent: string | null;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onOpenFile: () => void;
  onExport: (format: ExportFormat) => void;
  onPrint: () => void;
  onToggleMode: () => void;
  onNewFile: (template: string) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onNeedsTTSSetup: () => void;
}

export function Toolbar({
  fileName,
  theme,
  sidebarOpen,
  mode,
  hasUnsavedChanges,
  ttsConfig,
  speakableContent,
  onToggleTheme,
  onToggleSidebar,
  onOpenFile,
  onExport,
  onPrint,
  onToggleMode,
  onNewFile,
  onSave,
  onSaveAs,
  onNeedsTTSSetup,
}: ToolbarProps): React.JSX.Element {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = fileName
    ? `${hasUnsavedChanges ? "\u25CF " : ""}${fileName}`
    : "MarkView";

  const handleExportFormat = (format: ExportFormat): void => {
    onExport(format);
    setShowExportMenu(false);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <img src={logoUrl} alt="MarkView" className="toolbar-logo" />
        <button
          className="toolbar-btn"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {"\u2630"}
        </button>
        <button className="toolbar-btn" onClick={onOpenFile} title="Open file">
          Open
        </button>

        {/* New File dropdown */}
        <div className="toolbar-dropdown-wrapper" ref={newMenuRef}>
          <button
            className="toolbar-btn"
            onClick={() => setShowNewMenu((prev) => !prev)}
            title="New file"
          >
            New
          </button>
          {showNewMenu && (
            <div className="toolbar-dropdown">
              <button
                className="toolbar-dropdown-item"
                onClick={() => {
                  onNewFile("default");
                  setShowNewMenu(false);
                }}
              >
                Default
              </button>
              <button
                className="toolbar-dropdown-item"
                onClick={() => {
                  onNewFile("report");
                  setShowNewMenu(false);
                }}
              >
                Report
              </button>
              <button
                className="toolbar-dropdown-item"
                onClick={() => {
                  onNewFile("minimal");
                  setShowNewMenu(false);
                }}
              >
                Minimal
              </button>
            </div>
          )}
        </div>

        {mode === "builder" && (
          <>
            <button className="toolbar-btn" onClick={onSave} title="Save (Ctrl+S)">
              Save
            </button>
            <button className="toolbar-btn" onClick={onSaveAs} title="Save As">
              Save As
            </button>
          </>
        )}
      </div>

      <div className="toolbar-center">
        <span className="toolbar-filename">{displayName}</span>
      </div>

      <div className="toolbar-right">
        {speakableContent && (
          <SpeakButton
            text={speakableContent}
            ttsConfig={ttsConfig}
            onNeedsSetup={onNeedsTTSSetup}
            title="Read document aloud"
          />
        )}
        <button
          className="toolbar-btn toolbar-btn-mode"
          onClick={onToggleMode}
          title={mode === "viewer" ? "Switch to Editor" : "Switch to Viewer"}
        >
          {mode === "viewer" ? "Edit" : "View"}
        </button>
        <button
          className="toolbar-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "\u263E" : "\u2600"}
        </button>
        <button className="toolbar-btn" onClick={onPrint} title="Print">
          Print
        </button>

        {/* Export dropdown */}
        <div className="toolbar-dropdown-wrapper" ref={exportMenuRef}>
          <button
            className="toolbar-btn"
            onClick={() => setShowExportMenu((prev) => !prev)}
            title="Export"
          >
            Export
          </button>
          {showExportMenu && (
            <div className="toolbar-dropdown toolbar-dropdown-right">
              <button
                className="toolbar-dropdown-item"
                onClick={() => handleExportFormat("pdf")}
              >
                PDF
              </button>
              <button
                className="toolbar-dropdown-item"
                onClick={() => handleExportFormat("html")}
              >
                HTML
              </button>
              <button
                className="toolbar-dropdown-item"
                onClick={() => handleExportFormat("png")}
              >
                PNG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
