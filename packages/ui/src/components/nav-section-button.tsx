"use client";

import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@workspace/ui/components/badge";
import { SidebarMenuButton } from "@workspace/ui/components/sidebar";
import { NavSectionItem } from "@workspace/ui/components/nav-section";
import { icons } from "@workspace/ui/components/nav-items";



export function NavSectionButton({ item }: {
  item: NavSectionItem;
}) {

  const router = useRouter();
  const path = usePathname();
  const Icn = item.icon ? icons[item.icon] : undefined;
  return (
    <SidebarMenuButton disabled={item.url === path || item.isComingSoon} isActive={item.url === path}
                       onClick={() => router.push(item.url)}>
      { Icn && <Icn /> }
      <span>{item.name}</span>
      {item.isComingSoon && (
        <Badge
          variant="outline"
        >
          {"Coming Soon"}
        </Badge>
      )}
    </SidebarMenuButton>
  );
}