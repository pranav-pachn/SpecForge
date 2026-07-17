import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Providers from "@/components/shared/Providers";
import { MobileMenuProvider } from "@/components/layout/MobileMenuContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <MobileMenuProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex flex-1 overflow-hidden relative">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-black/20 w-full transition-colors duration-200">
              {children}
            </main>
          </div>
        </div>
      </MobileMenuProvider>
    </Providers>
  );
}
