"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@workspace/ui/components/sidebar";
import * as React from "react";
import { usePathname } from "next/navigation";



type NavItem = {
  title: string;
  url: string;
}

type NavGroup = NavItem & {
  items?: readonly NavItem[];
}

const nav: readonly NavGroup[] = [
  {
    title: "Dashboard",
    url: "/",
  },
  {
    title: "Backend",
    url: "/supabase",
  }
];

export default function AdminSidebarMenu() {

  const path = usePathname();

  return (
    <SidebarMenu className="gap-2">
      {nav.map((group, groupNumber) => (
        <SidebarMenuItem key={`navGroup-${groupNumber}`}>
          <SidebarMenuButton
            disabled={group.url === path}
            isActive={group.url === path}
            asChild
          >
            <a href={group.url} className="font-medium">
              {group.title}
            </a>
          </SidebarMenuButton>
          {group.items?.length ? (
            <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
              {group.items.map((item, key) => (
                <SidebarMenuSubItem key={`navGroup-${groupNumber}-item-${key}`}>
                  <SidebarMenuSubButton
                    isActive={path === item.url}
                    asChild
                  >
                    <a href={item.url}>{item.title}</a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}