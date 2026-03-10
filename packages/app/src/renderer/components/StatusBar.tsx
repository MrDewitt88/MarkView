import React from "react";

interface StatusBarProps {
  markdown: string | null;
  cursorLine: number;
  cursorCol: number;
  templateName: string;
  isBuilder: boolean;
}

function computeStats(text: string): {
  words: number;
  chars: number;
  readingTime: string;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { words: 0, chars: 0, readingTime: "0 min" };
  }
  const words = trimmed.split(/\s+/).length;
  const chars = text.length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const readingTime = minutes === 1 ? "1 min" : `${minutes} min`;
  return { words, chars, readingTime };
}

export function StatusBar({
  markdown,
  cursorLine,
  cursorCol,
  templateName,
  isBuilder,
}: StatusBarProps): React.JSX.Element {
  const stats = computeStats(markdown ?? "");

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {markdown !== null && (
          <>
            <span className="status-item">
              {stats.words} words
            </span>
            <span className="status-separator">|</span>
            <span className="status-item">
              {stats.chars} chars
            </span>
            <span className="status-separator">|</span>
            <span className="status-item">
              ~{stats.readingTime} read
            </span>
          </>
        )}
      </div>
      <div className="status-bar-right">
        {isBuilder && (
          <>
            <span className="status-item">
              Ln {cursorLine}, Col {cursorCol}
            </span>
            <span className="status-separator">|</span>
          </>
        )}
        {templateName && (
          <>
            <span className="status-item">{templateName}</span>
            <span className="status-separator">|</span>
          </>
        )}
        <span className="status-item">UTF-8</span>
      </div>
    </div>
  );
}
