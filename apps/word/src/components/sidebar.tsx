import { IconInnerShadowTop, } from "@tabler/icons-react";
import { NavQuickCreate } from "@workspace/ui/components/nav-quick-create";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { ComponentProps } from "react";
import { icons, sections } from "@workspace/ui/components/nav-items";
import { NavSection, NavSectionItem } from "@workspace/ui/components/nav-section";
import { Badge } from "@workspace/ui/components/badge";
import { useAppStore } from "@workspace/word/store/app";



export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5"/>
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavQuickCreate/>
        {sections
          .filter(sec => sec.title === "Documents")
          .map((section, index) => (
            <NavSection
              section={section}
              key={index}
              Button={NavSectionButton}
            />
          ))}
        {/*<NavSecondary items={data.navSecondary} className="mt-auto"/>*/}
      </SidebarContent>
    </Sidebar>
  );
}

function NavSectionButton({ item }: {
  item: NavSectionItem
}) {

  const app = useAppStore();
  const Icn = item.icon ? icons[item.icon] : undefined;

  return (
    <SidebarMenuButton
      disabled={item.url === app.state.router.path || item.isComingSoon}
      isActive={item.url === app.state.router.path}
      onClick={() => app.navigate(item.url)}
    >
      {Icn && <Icn/>}
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