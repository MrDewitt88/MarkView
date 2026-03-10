import { useState, useEffect, useRef } from "react";
import { render } from "@markview/engine";
import type { FrontmatterConfig, TocEntry } from "@markview/engine";

interface UseMarkdownResult {
  html: string;
  frontmatter: FrontmatterConfig;
  toc: TocEntry[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that wraps @markview/engine's render() function.
 * Memoized: only re-renders when the markdown string changes.
 */
export function useMarkdown(markdown: string | null): UseMarkdownResult {
  const [html, setHtml] = useState("");
  const [frontmatter, setFrontmatter] = useState<FrontmatterConfig>({});
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastMarkdownRef = useRef<string | null>(null);

  useEffect(() => {
    if (markdown === null || markdown === lastMarkdownRef.current) {
      return;
    }

    lastMarkdownRef.current = markdown;
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    render(markdown)
      .then((result) => {
        if (!cancelled) {
          setHtml(result.html);
          setFrontmatter(result.frontmatter);
          setToc(result.toc);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("Markdown render error:", err);
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [markdown]);

  return { html, frontmatter, toc, isLoading, error };
}
