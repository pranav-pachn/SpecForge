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
        margin: 10,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
