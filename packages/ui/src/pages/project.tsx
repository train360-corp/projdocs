import { PageContent } from "@workspace/ui/components/page-content";
import { H1, H2, Link, P } from "@workspace/ui/components/text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { FileBrowser } from "@workspace/web/components/file-browser";
import * as React from "react";
import { useEffect, useState } from "react";
import { SupabaseClient, Tables } from "@workspace/supabase/types";
import { Spinner } from "@workspace/ui/components/spinner";



type PermissionsTable = Tables<"permissions"> & {
  user: Tables<"users">;
}

type ClientPageState = undefined | null | {
  client: Tables<"clients">;
  project: Tables<"projects">;
  permissions: readonly PermissionsTable[];
}

export const ProjectPage = (props: {
  clientID: string | number;
  projectID: string | number;
  supabase: SupabaseClient;
  navigate: (url: string) => void;
}) => {

  const [ state, setState ] = useState<ClientPageState | undefined | null>(undefined);

  useEffect(() => {
    (async () => {

      const client = await props.supabase.from("clients").select().eq("id", typeof props.clientID === "string" ? Number(props.clientID) : props.clientID).single();
      if (client.error) {
        console.error(client.error);
        setState(null);
        return;
      }

      const project = await props.supabase.from("projects").select()
        .eq("project_number", typeof props.projectID === "string" ? Number(props.projectID) : props.projectID)
        .eq("client_id", typeof props.clientID === "string" ? Number(props.clientID) : props.clientID)
        .single();
      if (project.error) {
        console.error(project.error);
        setState(null);
        return;
      }

      const permissions = await props.supabase
        .from("permissions")
        .select("*, user:users (*)")
        .eq("project_id", project.data.id)
        .overrideTypes<Array<PermissionsTable>>();
      if (permissions.error) {
        console.error(permissions.error);
        setState(null);
        return;
      }

      setState({
        client: client.data,
        permissions: permissions.data,
        project: project.data,
      });

    })();
  }, []);

  return (
    <PageContent>
      {!state ? (
        <div className={"flex flex-row w-full justify-center"}>
          <Spinner className={"size-16 text-secondary"}/>
        </div>
      ) : (
        <>
          <div className={"flex flex-col"}>
            <Link
              href={`/dashboard/clients/${state.client.id}`}
              onClick={() => props.navigate(`/dashboard/clients/${state.client.id}`)}
            >
              <P className="cursor-pointer hover:underline">{state.client.name}</P>
            </Link>
            <H1>{state.project.name}</H1>
          </div>

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
                    <TableCell align={"right"}>{state.project.access}</TableCell>
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
            <H2>{"Files"}</H2>

            <FileBrowser
              navigate={props.navigate}
              client={state.client}
              project={state.project}
              directoryID={undefined}
              supabase={props.supabase}
            />

          </div>
        </>
      )}
    </PageContent>
  );

};