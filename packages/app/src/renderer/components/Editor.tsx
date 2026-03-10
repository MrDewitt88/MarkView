import React, { useRef, useEffect, useCallback, useState } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Viewer } from "./Viewer.js";
import { useMarkdown } from "../hooks/useMarkdown.js";
import type { Theme } from "../hooks/useTheme.js";

interface EditorProps {
  initialContent: string;
  theme: Theme;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCursorChange?: (line: number, col: number) => void;
}

export function Editor({
  initialContent,
  theme,
  onContentChange,
  onSave,
  onCursorChange,
}: EditorProps): React.JSX.Element {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [editorContent, setEditorContent] = useState(initialContent);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const { html, frontmatter, isLoading } = useMarkdown(editorContent);

  // Debounced content change handler
  const handleDocChange = useCallback(
    (content: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setEditorContent(content);
        onContentChange(content);
      }, 150);
    },
    [onContentChange],
  );

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      markdown(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        {
          key: "Mod-s",
          run: () => {
            onSave();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          handleDocChange(update.state.doc.toString());
        }
        if (update.selectionSet && onCursorChange) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          onCursorChange(line.number, pos - line.from + 1);
        }
      }),
      EditorView.lineWrapping,
    ];

    if (theme === "dark") {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: initialContent,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
    // We intentionally only run this on mount/theme change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Update editor content when initialContent changes externally
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== initialContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: initialContent,
        },
      });
    }
  }, [initialContent]);

  // Synchronized scrolling: editor -> preview
  const handleEditorScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    const editorEl = editorContainerRef.current?.querySelector(".cm-scroller");
    const previewEl = previewRef.current;
    if (!editorEl || !previewEl) return;

    isSyncingScroll.current = true;
    const scrollRatio =
      editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight || 1);
    previewEl.scrollTop =
      scrollRatio * (previewEl.scrollHeight - previewEl.clientHeight);
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, []);

  // Synchronized scrolling: preview -> editor
  const handlePreviewScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    const editorEl = editorContainerRef.current?.querySelector(".cm-scroller");
    const previewEl = previewRef.current;
    if (!editorEl || !previewEl) return;

    isSyncingScroll.current = true;
    const scrollRatio =
      previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight || 1);
    editorEl.scrollTop =
      scrollRatio * (editorEl.scrollHeight - editorEl.clientHeight);
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, []);

  // Attach scroll listener to CodeMirror scroller
  useEffect(() => {
    const editorEl = editorContainerRef.current?.querySelector(".cm-scroller");
    if (!editorEl) return;
    editorEl.addEventListener("scroll", handleEditorScroll);
    return () => {
      editorEl.removeEventListener("scroll", handleEditorScroll);
    };
  }, [handleEditorScroll]);

  return (
    <div className="editor-split">
      <div className="editor-pane" ref={editorScrollRef}>
        <div className="editor-codemirror" ref={editorContainerRef} />
      </div>
      <div className="editor-divider" />
      <div
        className="editor-preview"
        ref={previewRef}
        onScroll={handlePreviewScroll}
      >
        <Viewer html={html} frontmatter={frontmatter} isLoading={isLoading} />
      </div>
    </div>
  );
}
