import { IconDotsVertical, IconUserCircle, } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage, } from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from "@workspace/ui/components/sidebar";
import { Tables } from "@workspace/supabase/types";
import { createClient } from "@workspace/supabase/client";
import { User } from "@supabase/auth-js";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";



type CurrentUser = Tables<"users"> & {
  auth: User
};

export function NavUser() {

  const [user, setUser] = useState<CurrentUser | undefined>();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      await supabase.auth.refreshSession();

      const { data: { user: auth }, error } = await supabase.auth.getUser();
      console.log(user, error);

      const { data: $public } = await supabase.from("users").select().eq("id", auth?.id ?? "").single();
      if (auth && $public) setUser({
        auth,
        ...$public,
      });

    })();
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name}/>
                <AvatarFallback
                  className="rounded-lg">{`${user?.first_name.trim().at(0)}${user?.last_name.trim().at(0)}`}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.full_name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user?.auth.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4"/>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name}/>
                  <AvatarFallback
                    className="rounded-lg">{`${user?.first_name.trim().at(0)}${user?.last_name.trim().at(0)}`}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.full_name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.auth.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator/>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle/>
                Account
              </DropdownMenuItem>
              {/*<DropdownMenuItem>*/}
              {/*  <IconCreditCard/>*/}
              {/*  Billing*/}
              {/*</DropdownMenuItem>*/}
              {/*<DropdownMenuItem>*/}
              {/*  <IconNotification/>*/}
              {/*  Notifications*/}
              {/*</DropdownMenuItem>*/}
            </DropdownMenuGroup>
            <DropdownMenuSeparator/>
            {/*<NavUserLogout/>*/}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
