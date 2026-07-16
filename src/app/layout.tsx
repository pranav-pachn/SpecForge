import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "@/app/globals.css";

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
    <html lang="en" className={`dark ${outfit.className}`}>
      <body className="min-h-screen bg-[#05050a] text-slate-200 antialiased selection:bg-blue-500/30 selection:text-blue-200">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#05050a] to-[#05050a]" />
        {children}
      </body>
    </html>
  );
}
