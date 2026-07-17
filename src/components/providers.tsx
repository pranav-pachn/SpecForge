"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/ui/CommandPalette";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      {children}
      <Toaster theme="system" position="bottom-right" richColors />
      <CommandPalette />
    </NextThemesProvider>
  );
}
