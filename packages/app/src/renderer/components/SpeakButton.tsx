import React, { useState } from "react";

interface SpeakButtonProps {
  text: string;
  ttsConfig: { endpoint?: string; token?: string; voice?: string; instruction?: string; temperature?: number } | null;
  onNeedsSetup: () => void;
  small?: boolean;
  title?: string;
  isMarkdown?: boolean;
}

/**
 * Strip markdown syntax to extract speakable plain text.
 * Zero-dependency alternative to engine's extractSpeakableText (which needs unified/remark).
 */
function stripMarkdown(md: string): string {
  return md
    // Remove frontmatter
    .replace(/^---[\s\S]*?---\n*/m, "")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    // Remove HTML tags
    .replace(/<[^>]+>/g, "")
    // Remove images
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    // Convert links to just text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Remove headings markers but keep text
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2")
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, "$1")
    // Remove blockquote markers
    .replace(/^>\s*/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Remove reference-style links/images
    .replace(/^\[[^\]]+\]:\s.*$/gm, "")
    // Collapse multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function SpeakButton({ text, ttsConfig, onNeedsSetup, small, title, isMarkdown = true }: SpeakButtonProps): React.JSX.Element {
  const [state, setState] = useState<"idle" | "speaking">("idle");

  const handleClick = async (): Promise<void> => {
    if (!ttsConfig?.token) {
      onNeedsSetup();
      return;
    }

    if (state === "speaking") {
      setState("idle");
      return;
    }

    const plainText = isMarkdown ? stripMarkdown(text) : text;
    if (!plainText.trim()) {
      console.error("TTS: no speakable text found");
      return;
    }

    setState("speaking");
    try {
      const result = await window.markview.ttsSpeak(plainText, ttsConfig);
      if (!result.success) {
        console.error("TTS error:", result.error);
      }
    } catch (err) {
      console.error("TTS failed:", err);
    }
    setState("idle");
  };

  return (
    <button
      className={`speak-btn ${small ? "speak-btn-small" : ""} ${state === "speaking" ? "speak-btn-speaking" : ""}`}
      onClick={handleClick}
      title={title ?? "Read aloud"}
    >
      {state === "speaking" ? "\u25A0" : "\u{1F50A}"}
    </button>
  );
}
