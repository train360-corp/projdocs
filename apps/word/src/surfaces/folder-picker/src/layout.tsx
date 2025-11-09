import React, { CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router";
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@workspace/web/components/app-sidebar";
import { SiteHeader } from "@workspace/ui/components/site-header";
import { Pages } from "@workspace/word/surfaces/folder-picker/src/pages";



export const Layout = () => {

  const navigate = useNavigate();
  const { pathname } = useLocation();


  return (
    <div className="fixed inset-0 flex flex-col font-sans antialiased bg-background overflow-hidden">
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties}
      >
        <AppSidebar
          variant={"inset"}
          router={{
            navigate: (url) => navigate(url),
            path: pathname
          }}
        />
        <SidebarInset className="m-0 rounded-xl shadow-sm h-full overflow-hidden">
          <div className="flex h-full flex-col">
            <SiteHeader/>
            <div className="flex flex-1 flex-col overflow-hidden min-h-0">
              <Pages/>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};