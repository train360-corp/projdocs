import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Badge } from "@workspace/ui/components/badge";
import { icons } from "@workspace/ui/components/nav-items";



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

const Icon = ({ item }: {
  item: NavSectionItem;
}) => {
  const Icon = item.icon ? icons[item.icon] : undefined;
  return Icon === undefined ? undefined : <Icon/>;
};

export function NavSection(props: {
  section: NavSection;
  router: {
    navigate: (url: string) => void;
    path: string;
  }
}) {


  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {props.section.title !== undefined && (
        <SidebarGroupLabel>{props.section.title}</SidebarGroupLabel>
      )}
      <SidebarMenu>
        {props.section.items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              disabled={item.url === props.router.path || item.isComingSoon}
              isActive={item.url === props.router.path}
              onClick={() => props.router.navigate(item.url)}
            >
              <Icon item={item}/>
              <span>{item.name}</span>
              {item.isComingSoon && (
                <Badge
                  variant="outline"
                >
                  {"Coming Soon"}
                </Badge>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
