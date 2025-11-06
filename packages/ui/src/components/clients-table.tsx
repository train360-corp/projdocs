"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { columns } from "@workspace/ui/components/clients-table-columns";
import { Tables } from "@workspace/supabase/types";
import { ClientRow } from "@workspace/ui/components/clients-table-row";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { BuildingIcon } from "lucide-react";
import { IconDotsVertical } from "@tabler/icons-react";
import { Button } from "@workspace/ui/components/button";

export type FavoriteClient = Tables<"clients"> & {
  isFavorite?: boolean;
};

export default function ClientsTable({ clients, noRowsText, onRowClick }: {
  clients: readonly FavoriteClient[] | null | undefined;
  noRowsText?: string;
  onRowClick: (client: FavoriteClient) => void;
}) {

  return (
    <div className="flex flex-col gap-4 overflow-auto overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead>
              {/* Icon */}
            </TableHead>
            {columns.map((col, index) => (
              <TableHead key={index}>
                {col.header}
              </TableHead>
            ))}
            <TableHead>
              {/* Settings */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {
            clients === undefined ? (
                <TableRow>
                  <TableCell>
                    <BuildingIcon className={"text-muted"}/>
                  </TableCell>
                  {columns.map((col, index) => (
                    <TableCell key={index} width={col.width}>
                      <Skeleton className="h-4 w-[50px]"/>
                    </TableCell>
                  ))}
                  <TableCell align={"right"}>
                    <Button disabled variant={"ghost"} size="icon" className="size-8">
                      <IconDotsVertical/>
                    </Button>
                  </TableCell>
                </TableRow>
              ) :
              clients === null ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 2}
                      className="h-24 text-center"
                    >
                      {"An error occurred while loading clients."}
                    </TableCell>
                  </TableRow>
                ) :
                clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 2}
                      className="h-24 text-center"
                    >
                      {noRowsText ?? "Looks like you haven't created a client yet! Create one to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client, index) => (
                    <ClientRow
                      client={client}
                      key={index}
                      onClick={onRowClick}
                    />
                  ))
                )
          }
        </TableBody>
      </Table>
    </div>
  );
}