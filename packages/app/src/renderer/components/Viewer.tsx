import React, { useMemo, useRef, useEffect } from "react";
import type { FrontmatterConfig } from "@markview/engine";

interface TTSConfig {
  endpoint?: string;
  token?: string;
  voice?: string;
  instruction?: string;
  temperature?: number;
}

interface ViewerProps {
  html: string;
  frontmatter: FrontmatterConfig;
  isLoading: boolean;
  error?: string | null;
  filePath?: string | null;
  ttsConfig?: TTSConfig | null;
  onNeedsTTSSetup?: () => void;
}

function resolveLocalPaths(html: string, filePath: string | null | undefined): string {
  if (!filePath) return html;
  const dir = filePath.replace(/[/\\][^/\\]*$/, "");
  return html.replace(
    /(src|href)="(?!https?:\/\/|data:|#|\/|local-resource:)([^"]+)"/g,
    (_match, attr, relativePath) => {
      const absolutePath = `${dir}/${relativePath}`;
      return `${attr}="local-resource://${absolutePath}"`;
    },
  );
}

export function Viewer({
  html,
  frontmatter,
  isLoading,
  error,
  filePath,
  ttsConfig,
  onNeedsTTSSetup,
}: ViewerProps): React.JSX.Element {
  const resolvedHtml = useMemo(() => resolveLocalPaths(html, filePath), [html, filePath]);
  const contentRef = useRef<HTMLElement>(null);

  const templateClass = frontmatter.template
    ? `template-${frontmatter.template}`
    : "template-default";

  const customStyles: React.CSSProperties = {};
  if (frontmatter.font) {
    customStyles.fontFamily = frontmatter.font;
  }
  if (frontmatter.fontSize) {
    customStyles.fontSize = frontmatter.fontSize;
  }
  if (frontmatter.lineHeight) {
    customStyles.lineHeight = frontmatter.lineHeight;
  }

  // Inject per-section speak buttons next to headings
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const buttons: HTMLButtonElement[] = [];

    headings.forEach((heading) => {
      // Skip if already has a speak button
      if (heading.querySelector(".heading-speak-btn")) return;

      const btn = document.createElement("button");
      btn.className = "heading-speak-btn";
      btn.textContent = "\u{1F50A}";
      btn.title = "Read this section";
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!ttsConfig?.token) {
          onNeedsTTSSetup?.();
          return;
        }

        // Collect text from heading until next same-or-higher-level heading
        const level = parseInt(heading.tagName[1]!);
        let text = (heading.textContent ?? "") + ". ";
        let sibling = heading.nextElementSibling;
        while (sibling) {
          if (/^H[1-6]$/.test(sibling.tagName)) {
            const siblingLevel = parseInt(sibling.tagName[1]!);
            if (siblingLevel <= level) break;
          }
          text += (sibling.textContent ?? "") + " ";
          sibling = sibling.nextElementSibling;
        }

        btn.textContent = "\u25A0";
        btn.classList.add("speaking");
        await window.markview.ttsSpeak(text.trim(), ttsConfig);
        btn.textContent = "\u{1F50A}";
        btn.classList.remove("speaking");
      });

      heading.style.position = "relative";
      heading.appendChild(btn);
      buttons.push(btn);
    });

    return () => {
      buttons.forEach((btn) => btn.remove());
    };
  }, [resolvedHtml, ttsConfig, onNeedsTTSSetup]);

  return (
    <div className={`viewer ${templateClass}`}>
      {isLoading && <div className="viewer-loading">Rendering...</div>}
      {error && (
        <div className="viewer-error">
          <h3>Render Error</h3>
          <pre>{error}</pre>
        </div>
      )}
      {!error && frontmatter.title && (
        <header className="viewer-header">
          <h1>{frontmatter.title}</h1>
          {frontmatter.author && (
            <p className="viewer-author">{frontmatter.author}</p>
          )}
        </header>
      )}
      {!error && (
        <article
          ref={contentRef}
          className="viewer-content"
          style={customStyles}
          dangerouslySetInnerHTML={{ __html: resolvedHtml }}
        />
      )}
    </div>
  );
}
