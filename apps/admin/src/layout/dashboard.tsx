import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { CSSProperties, ReactNode } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import * as React from "react";
import AdminSidebarMenu from "@workspace/admin/layout/client-side";


export default function DashboardLayout({children}: {
  children: ReactNode;
}) {



  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as CSSProperties
      }
    >
      <Sidebar variant="floating" className={"bg-background p-4 pr-0"}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">Documentation</span>
                    <span className="">v1.0.0</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <AdminSidebarMenu />
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className={"w-full h-full p-4"}>
          <div className="flex flex-1 flex-col gap-4 h-full rounded-lg border bg-sidebar overflow-hidden">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
