import { useState } from "react";
import { toast } from "sonner";

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportAsMarkdown = (content: string, filename: string) => {
    try {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filename}.md`);
    } catch (e) {
      toast.error("Failed to export Markdown");
      console.error(e);
    }
  };

  const exportAsPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error("Content not found for PDF export");
      return;
    }
    
    setIsExporting(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default;
      
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${filename}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success(`Exported ${filename}.pdf`, { id: toastId });
    } catch (e) {
      toast.error("Failed to export PDF", { id: toastId });
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportAsMarkdown, exportAsPDF, isExporting };
}

/**
 * Minimal markdown → styled HTML converter for PDF output.
 * Handles: headings, bold, italic, code blocks, inline code, lists, horizontal rules.
 */
function markdownToHTML(markdown: string, title: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = markdown.split("\n");
  let html = "";
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let inList = false;

  // Header with branding
  html += `
    <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 28px;">
      <div style="display:flex; align-items:center; gap: 10px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px;">S</div>
        <div>
          <div style="font-size:11px; color:#6b7280; letter-spacing:1px; text-transform:uppercase; font-weight:600;">SpecForge Export</div>
          <div style="font-size:9px; color:#9ca3af;">${new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</div>
        </div>
      </div>
    </div>
  `;

  const flushList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Code block toggle
    if (raw.trim().startsWith("```")) {
      if (inCodeBlock) {
        html += `<pre style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-family:monospace;font-size:11px;overflow:auto;white-space:pre-wrap;color:#1e293b;margin:12px 0;">${escape(codeLines.join("\n"))}</pre>`;
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(raw);
      continue;
    }

    // Blank line
    if (raw.trim() === "") {
      flushList();
      html += "<br/>";
      continue;
    }

    // Headings
    const h1 = raw.match(/^# (.+)/);
    const h2 = raw.match(/^## (.+)/);
    const h3 = raw.match(/^### (.+)/);
    const h4 = raw.match(/^#### (.+)/);
    const hr = raw.match(/^---+$/);

    if (h1) {
      flushList();
      html += `<h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:24px 0 8px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">${inlineFormat(escape(h1[1]))}</h1>`;
      continue;
    }
    if (h2) {
      flushList();
      html += `<h2 style="font-size:17px;font-weight:700;color:#334155;margin:20px 0 6px;padding-left:10px;border-left:3px solid #3b82f6;">${inlineFormat(escape(h2[1]))}</h2>`;
      continue;
    }
    if (h3) {
      flushList();
      html += `<h3 style="font-size:14px;font-weight:700;color:#475569;margin:16px 0 4px;">${inlineFormat(escape(h3[1]))}</h3>`;
      continue;
    }
    if (h4) {
      flushList();
      html += `<h4 style="font-size:12px;font-weight:700;color:#64748b;margin:12px 0 4px;">${inlineFormat(escape(h4[1]))}</h4>`;
      continue;
    }
    if (hr) {
      flushList();
      html += `<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />`;
      continue;
    }

    // List items
    const li = raw.match(/^[-*] (.+)/);
    const oli = raw.match(/^\d+\. (.+)/);
    if (li || oli) {
      if (!inList) {
        html += `<ul style="margin:8px 0 8px 20px;padding:0;list-style:disc;">`;
        inList = true;
      }
      html += `<li style="margin:3px 0;color:#334155;">${inlineFormat(escape((li || oli)![1]))}</li>`;
      continue;
    }

    // Regular paragraph
    flushList();
    html += `<p style="margin:6px 0;color:#334155;">${inlineFormat(escape(raw))}</p>`;
  }

  flushList();

  // Footer
  html += `
    <div style="margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:9px; color:#9ca3af; display:flex; justify-content:space-between;">
      <span>Generated by SpecForge</span>
      <span>${title}</span>
    </div>
  `;

  return html;
}

function inlineFormat(text: string): string {
  return text
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic *text*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:3px;padding:1px 5px;font-family:monospace;font-size:11px;color:#0f172a;">$1</code>');
}
