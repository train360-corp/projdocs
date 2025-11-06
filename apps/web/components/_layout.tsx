"use client";
import { CSSProperties, ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@workspace/web/components/app-sidebar";
import { SiteHeader } from "@workspace/ui/components/site-header";
import { usePathname, useRouter } from "next/navigation";



export function DashboardLayout({ children }: { children: ReactNode }) {

  const path = usePathname();
  const router = useRouter();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        router={{
          path: path,
          navigate: (url) => router.push(url),
        }}
      />
      <SidebarInset className="m-0 rounded-xl shadow-sm h-full overflow-hidden">
        <div className="flex h-full flex-col">
          <SiteHeader/>
          <div className="flex flex-1 flex-col overflow-hidden min-h-0">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}