import { useState, useEffect } from "react";

interface UseFileWatcherResult {
  markdown: string | null;
  filePath: string | null;
  fileName: string | null;
}

/**
 * Listen to file:content and file:changed IPC events.
 * Returns the current markdown content and file info.
 */
export function useFileWatcher(): UseFileWatcherResult {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const unsubContent = window.markview.onFileContent((data) => {
      setMarkdown(data.content);
      setFilePath(data.path);
      setFileName(data.name);
    });

    const unsubChanged = window.markview.onFileChanged((data) => {
      setMarkdown(data.content);
      setFilePath(data.path);
      setFileName(data.name);
    });

    return () => {
      unsubContent();
      unsubChanged();
    };
  }, []);

  return { markdown, filePath, fileName };
}
