import { H1, H2 } from "@workspace/ui/components/text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { columns } from "@workspace/web/app/dashboard/clients/[clientID]/columns";
import * as React from "react";
import { Tables, Database } from "@workspace/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Spinner } from "@workspace/ui/components/spinner";
import { PageContent } from "@workspace/ui/components/page-content";

type PermissionsTable = Tables<"permissions"> & {
  user: Tables<"users">;
}

type ClientPageState = undefined | null | {
  client: Tables<"clients">;
  permissions: readonly PermissionsTable[];
  projects: readonly Tables<"projects">[];
}

export const ClientPage = (props: {
  supabase: SupabaseClient<Database>;
  clientID: string | number;
  onClick: (project: Tables<"projects">) => void;
}) => {

  const [ state, setState ] = useState<ClientPageState | undefined | null>(undefined);

  useEffect(() => {
    (async () => {
      const client = await props.supabase.from("clients").select().eq("id", typeof props.clientID === "string" ? Number(props.clientID) : props.clientID).single();
      if(client.error) {
        console.error(client.error);
        setState(null);
        return;
      }

      const projects = await props.supabase.from("projects").select().eq("client_id", client.data.id);
      if(projects.error) {
        console.error(projects.error);
        setState(null);
        return;
      }

      const permissions = await props.supabase
        .from("permissions")
        .select("*, user:users (*)")
        .eq("client_id", client.data.id)
        .overrideTypes<Array<PermissionsTable>>();
      if(permissions.error){
        console.error(permissions.error);
        setState(null);
        return;
      }

      setState({
        client: client.data,
        permissions: permissions.data,
        projects: projects.data,
      });
    })();
  }, [props.clientID]);

  return (
    <PageContent>
      {!state ? (
        <div className={"flex flex-row w-full justify-center"}>
          <Spinner className={"size-16 text-secondary"}/>
        </div>
      ) : (
        <>
          <H1>{state.client.name}</H1>

          <div className={"flex flex-col gap-2 md:gap-4"}>
            <H2>{"People"}</H2>
            <div className="flex flex-col gap-4 overflow-auto overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>{"Name"}</TableHead>
                    <TableHead className={"text-right"}>{"Access"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">

                  <TableRow>
                    <TableCell>{"Default"}</TableCell>
                    <TableCell align={"right"}>{state.client.access}</TableCell>
                  </TableRow>

                  {state.permissions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.user.full_name}</TableCell>
                      <TableCell align={"right"}>{row.level}</TableCell>
                    </TableRow>
                  ))}

                </TableBody>
              </Table>
            </div>
          </div>

          <div className={"flex flex-col gap-2 md:gap-4"}>
            <H2>{"Projects"}</H2>

            <div className="flex flex-col gap-4 overflow-auto overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    {columns.map((col, index) => (
                      <TableHead key={index}>
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">

                  {(state.projects.length > 0) ? state.projects.map((project, index) => (
                    <ProjectRow
                      project={project}
                      key={index}
                      onClick={props.onClick}
                    />
                  )) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {"Looks like you haven't created a project yet! Create one to get started."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </PageContent>
  );
}

export const ProjectRow = ({ project, onClick }: {
  project: Tables<"projects">;
  onClick: (project: Tables<"projects">) => void;
}) => (
  <TableRow
    className={"cursor-pointer"}
    onClick={() => onClick(project)}>
    {columns.map((col, index) => (
      <TableCell key={index}>
        {project[col.key]}
      </TableCell>
    ))}
  </TableRow>
);