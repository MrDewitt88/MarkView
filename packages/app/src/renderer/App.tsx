import React, { useState, useEffect, useCallback, useRef } from "react";
import { Viewer } from "./components/Viewer.js";
import { Editor } from "./components/Editor.js";
import { Sidebar } from "./components/Sidebar.js";
import { Toolbar } from "./components/Toolbar.js";
import { StatusBar } from "./components/StatusBar.js";
import { SpeakloneSetup } from "./components/SpeakloneSetup.js";
import { useFileWatcher } from "./hooks/useFileWatcher.js";
import { useMarkdown } from "./hooks/useMarkdown.js";
import { useTheme } from "./hooks/useTheme.js";
import logoUrl from "./assets/logo.png";

export type AppMode = "viewer" | "builder";

interface TTSConfig {
  endpoint?: string;
  token?: string;
  voice?: string;
  instruction?: string;
  temperature?: number;
}

export function App(): React.JSX.Element {
  const [mode, setMode] = useState<AppMode>("viewer");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { markdown, filePath, fileName } = useFileWatcher();
  const { html, frontmatter, toc, isLoading, error } = useMarkdown(markdown);

  // Editor state
  const [editorContent, setEditorContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const savedContentRef = useRef<string>("");

  // TTS state
  const [ttsConfig, setTtsConfig] = useState<TTSConfig | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  // Load TTS config on mount
  useEffect(() => {
    window.markview.configLoad().then((config) => {
      const tts = config.tts as TTSConfig | undefined;
      if (tts?.token) {
        setTtsConfig(tts);
      }
    });
  }, []);

  // Sync editor content when file is loaded
  useEffect(() => {
    if (markdown !== null) {
      setEditorContent(markdown);
      savedContentRef.current = markdown;
      setHasUnsavedChanges(false);
    }
  }, [markdown]);

  // Listen for mode change from main process (e.g., --edit flag)
  useEffect(() => {
    const unsub = window.markview.onSetMode((newMode) => {
      setMode(newMode as AppMode);
    });
    return unsub;
  }, []);

  // Listen for TTS settings from menu
  useEffect(() => {
    const unsub = window.markview.onOpenTTSSettings(() => {
      setShowSetup(true);
    });
    return unsub;
  }, []);

  // Global Ctrl+S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleOpenFile = async (): Promise<void> => {
    await window.markview.openFile();
  };

  const handleExport = async (format: string): Promise<void> => {
    const content = mode === "builder" ? editorContent : markdown;
    if (format === "pdf") {
      await window.markview.exportPdfDialog();
    } else if (format === "html" && content) {
      await window.markview.exportHtml(content);
    } else if (format === "png" && content) {
      await window.markview.exportPng(content);
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleToggleMode = (): void => {
    setMode((prev) => (prev === "viewer" ? "builder" : "viewer"));
  };

  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content);
    setHasUnsavedChanges(content !== savedContentRef.current);
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!filePath) {
      const result = await window.markview.saveAs(editorContent);
      if (result.success) {
        savedContentRef.current = editorContent;
        setHasUnsavedChanges(false);
      }
      return;
    }
    const result = await window.markview.saveFile(filePath, editorContent);
    if (result.success) {
      savedContentRef.current = editorContent;
      setHasUnsavedChanges(false);
    }
  }, [filePath, editorContent]);

  const handleSaveAs = useCallback(async (): Promise<void> => {
    const result = await window.markview.saveAs(editorContent);
    if (result.success) {
      savedContentRef.current = editorContent;
      setHasUnsavedChanges(false);
    }
  }, [editorContent]);

  const handleNewFile = async (template: string): Promise<void> => {
    await window.markview.newFile(template);
    setMode("builder");
  };

  const handleCursorChange = useCallback((line: number, col: number) => {
    setCursorLine(line);
    setCursorCol(col);
  }, []);

  const handleSetupComplete = async (config: {
    token: string; endpoint: string; voice: string; temperature: number;
  }): Promise<void> => {
    const newConfig: TTSConfig = {
      endpoint: config.endpoint,
      token: config.token,
      voice: config.voice,
      temperature: config.temperature,
    };
    setTtsConfig(newConfig);
    // Save to shared config file
    const fullConfig = await window.markview.configLoad();
    fullConfig.tts = { ...fullConfig.tts as object, ...newConfig, provider: "speaklone" };
    await window.markview.configSave(fullConfig);
  };

  const speakableContent = mode === "builder" ? editorContent : markdown;
  const templateName = frontmatter.template ?? "default";

  return (
    <div className={`app ${theme}`} data-mode={mode}>
      <Toolbar
        fileName={fileName}
        theme={theme}
        sidebarOpen={sidebarOpen}
        mode={mode}
        hasUnsavedChanges={hasUnsavedChanges}
        ttsConfig={ttsConfig}
        speakableContent={speakableContent}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenFile={handleOpenFile}
        onExport={handleExport}
        onPrint={handlePrint}
        onToggleMode={handleToggleMode}
        onNewFile={handleNewFile}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNeedsTTSSetup={() => setShowSetup(true)}
      />
      <div className="app-content">
        {sidebarOpen && <Sidebar toc={toc} />}
        <main className="main-panel">
          {markdown !== null || mode === "builder" ? (
            mode === "builder" ? (
              <Editor
                initialContent={editorContent}
                theme={theme}
                onContentChange={handleContentChange}
                onSave={handleSave}
                onCursorChange={handleCursorChange}
              />
            ) : (
              <Viewer
                html={html}
                frontmatter={frontmatter}
                isLoading={isLoading}
                error={error}
                filePath={filePath}
                ttsConfig={ttsConfig}
                onNeedsTTSSetup={() => setShowSetup(true)}
              />
            )
          ) : (
            <div className="empty-state">
              <img src={logoUrl} alt="MarkView" className="empty-state-logo" />
              <h2>Welcome to MarkView</h2>
              <p>Open a Markdown file to get started.</p>
              <button className="open-button" onClick={handleOpenFile}>
                Open File
              </button>
              <p className="hint">
                Or drag and drop a .md file onto the app
              </p>
              <div className="cli-info">
                <h3>CLI Usage</h3>
                <p>MarkView is also available as a command-line tool:</p>
                <pre className="cli-commands">
{`markview render doc.md          # Render to HTML
markview render doc.md -o out.pdf # Export as PDF
markview serve doc.md             # Live preview in browser
markview lint doc.md              # Check for issues
markview render doc.md --open     # Render & open in browser`}
                </pre>
                <p className="hint">
                  Install via Menu → Install CLI Command
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
      <StatusBar
        markdown={mode === "builder" ? editorContent : markdown}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        templateName={templateName}
        isBuilder={mode === "builder"}
      />
      {showSetup && (
        <SpeakloneSetup
          onClose={() => setShowSetup(false)}
          onComplete={handleSetupComplete}
        />
      )}
    </div>
  );
}
