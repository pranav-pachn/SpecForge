import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/components/providers";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpecForge | Spec-to-Execution OS",
  description: "SpecForge turns rough feature ideas into approved specs, plans, tasks, execution packs, and validation artifacts for AI-assisted software delivery.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.className}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-500/30 selection:text-blue-200 transition-colors duration-200">
        <Providers>
          <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background dark:from-indigo-900/20" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
