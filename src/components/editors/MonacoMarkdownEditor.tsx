"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface MonacoMarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export default function MonacoMarkdownEditor({
  value,
  onChange,
  onSave,
  readOnly = false,
}: MonacoMarkdownEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [theme, setTheme] = useState<"vs-dark" | "vs">("vs");

  useEffect(() => {
    // Detect system/app theme to match Monaco theme
    const isDark = document.documentElement.classList.contains("dark") ||
                   window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDark ? "vs-dark" : "vs");
    
    // Optional: add a listener if theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDark = document.documentElement.classList.contains("dark");
          setTheme(isDark ? "vs-dark" : "vs");
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Add Save Shortcut (Cmd/Ctrl + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave();
      }
    });
  };

  return (
    <div className="w-full h-full relative border-r border-slate-200 dark:border-slate-800">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: "on",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          fontSize: 14,
          lineHeight: 24,
          padding: { top: 24, bottom: 24 },
          renderWhitespace: "none",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: "all",
          scrollbar: {
            vertical: "visible",
            horizontal: "hidden",
            useShadows: false,
            verticalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
}
