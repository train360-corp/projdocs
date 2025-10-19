import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, } from "@workspace/ui/components/sidebar";
import { NavSectionButton } from "@workspace/ui/components/nav-section-button";
import { ReactNode } from "react";



export const NavSectionIcons = [];

export type NavSectionItem = {
  name: string;
  url: string;
  icon: number;
  isComingSoon?: true;
}

export type NavSection = {
  title: string | undefined;
  items: readonly NavSectionItem[];
}

type NavSectionProps = {
  section: NavSection;
  Button: (props: {
    item: NavSectionItem;
  }) => ReactNode;
} | {
  section: NavSection;
  type: "FOO";
}

export function NavSection(props: NavSectionProps) {

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {props.section.title !== undefined && (
        <SidebarGroupLabel>{props.section.title}</SidebarGroupLabel>
      )}
      <SidebarMenu>
        {props.section.items.map((item, index) => (
          <SidebarMenuItem key={item.name}>
            {"Button" in props ? <props.Button item={item}/> : (
              <NavSectionButton item={item}/>
            )}
            {/*<DropdownMenu>*/}
            {/*  <DropdownMenuTrigger asChild>*/}
            {/*    <SidebarMenuAction*/}
            {/*      showOnHover*/}
            {/*      className="data-[state=open]:bg-accent rounded-sm"*/}
            {/*    >*/}
            {/*      <IconDots/>*/}
            {/*      <span className="sr-only">More</span>*/}
            {/*    </SidebarMenuAction>*/}
            {/*  </DropdownMenuTrigger>*/}
            {/*  <DropdownMenuContent*/}
            {/*    className="w-24 rounded-lg"*/}
            {/*    side={isMobile ? "bottom" : "right"}*/}
            {/*    align={isMobile ? "end" : "start"}*/}
            {/*  >*/}
            {/*    <DropdownMenuItem>*/}
            {/*      <IconFolder/>*/}
            {/*      <span>Open</span>*/}
            {/*    </DropdownMenuItem>*/}
            {/*    <DropdownMenuItem>*/}
            {/*      <IconShare3/>*/}
            {/*      <span>Share</span>*/}
            {/*    </DropdownMenuItem>*/}
            {/*    <DropdownMenuSeparator/>*/}
            {/*    <DropdownMenuItem variant="destructive">*/}
            {/*      <IconTrash/>*/}
            {/*      <span>Delete</span>*/}
            {/*    </DropdownMenuItem>*/}
            {/*  </DropdownMenuContent>*/}
            {/*</DropdownMenu>*/}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
