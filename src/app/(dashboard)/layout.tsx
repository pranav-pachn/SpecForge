import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Providers from "@/components/shared/Providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-950/50">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
