"use client";

import { TableCell, TableRow } from "@workspace/ui/components/table";
import * as React from "react";
import { columns } from "@workspace/ui/components/clients-table-columns";
import { BuildingIcon, FolderOpenIcon } from "lucide-react";
import { IconDatabaseMinus, IconDatabasePlus, IconDotsVertical } from "@tabler/icons-react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { FavoriteClient } from "@workspace/ui/components/clients-table";
import { createClient } from "@workspace/supabase/client";



export const ClientRow = ({ client, onClick }: {
  client: FavoriteClient;
  onClick: (row: FavoriteClient) => void;
}) => {

  return (
    <TableRow className={"cursor-pointer"} onClick={() => onClick(client)}>
      <TableCell>
        <BuildingIcon/>
      </TableCell>
      {columns.map((col, index) => (
        <TableCell key={index} width={col.width}>
          {client[col.key]}
        </TableCell>
      ))}
      <TableCell align={"right"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button onClick={(e) => e.stopPropagation()} variant={"ghost"} size="icon" className="size-8">
              <IconDotsVertical/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>{"Client"}</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation(); // don't trigger row click
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (client.isFavorite) await supabase.from("favorites").delete().eq("client_id", client.id).eq("user_id", user?.id ?? "");
                  else await supabase.from("favorites").insert({
                    user_id: user?.id ?? "",
                    client_id: client.id
                  }).select().single();
                }}
              >
                {`${client.isFavorite ? "Remove from" : "Add to"} My Clients`}
                <DropdownMenuShortcut>
                  {client.isFavorite ? <IconDatabaseMinus/> : <IconDatabasePlus/>}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator/>
            <DropdownMenuItem>
              {"View"}
              <DropdownMenuShortcut>
                <FolderOpenIcon/>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};