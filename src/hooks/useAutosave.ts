import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export function useAutosave(
  value: string,
  onSave: () => Promise<void> | void,
  delay: number = 2000,
  enabled: boolean = true
) {
  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) return;

    const handler = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave();
        toast.success("Draft auto-saved", { 
          id: "autosave", 
          duration: 2000,
          position: "bottom-right"
        });
      } catch (error) {
        toast.error("Failed to auto-save", { id: "autosave" });
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay, enabled]);

  return { isSaving };
}
