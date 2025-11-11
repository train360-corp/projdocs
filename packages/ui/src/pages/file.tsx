import { Tables } from "@workspace/supabase/types.gen";
import { SupabaseClient } from "@workspace/supabase/types";
import * as React from "react";
import { useEffect, useState } from "react";
import { PageContent } from "@workspace/ui/components/page-content";
import { Spinner } from "@workspace/ui/components/spinner";
import { Link, P } from "@workspace/ui/components/text";
import { FileViewer } from "@workspace/web/components/file-viewer/file-viewer";

type Symlink = Tables<"symlinks"> & {
  file: Tables<"files">;
}


type FilePageState = undefined | null | {
  client: Tables<"clients">;
  project: Tables<"projects">;
  directory: Tables<"directories">;
  symlink: Symlink;
}

export const FilePage = (props: {
  navigate: (url: string) => void;
  clientID: string | number;
  projectID: string | number;
  directoryID: string;
  symlinkID: string;
  supabase: SupabaseClient;
  disableFileSelection?: boolean;
  disableDirectorySelection?: boolean;
}) => {

  const [ state, setState ] = useState<FilePageState>(undefined);

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

      const directory = await props.supabase.from("directories").select().eq("id", props.directoryID).single();
      if (directory.error) {
        console.error(directory.error);
        setState(null);
        return;
      }

      const symlink = await props.supabase.from("symlinks").select("*, file:files (*)").eq("id", props.symlinkID).single();
      if(symlink.error) {
        console.error(symlink.error);
        setState(null);
        return;
      }

      setState({
        client: client.data,
        project: project.data,
        directory: directory.data,
        symlink: symlink.data
      });

    })();
  }, [ props.clientID, props.directoryID, props.projectID ]);

  return (
    <PageContent>
      {!state ? (
        <div className={"flex flex-row w-full justify-center"}>
          <Spinner className={"size-16 text-secondary"}/>
        </div>
      ) : (
        <>
          <div className={"flex flex-row items-center gap-2"}>
            <Link
              className={"transition-colors"}
              href={`/dashboard/clients/${state.client.id}`}
              onClick={() => props.navigate(`/dashboard/clients/${state.client.id}`)}
            >
              {state.client.name}
            </Link>
            <P className={"text-secondary"}>{"·"}</P>
            <Link
              className={"transition-colors"}
              onClick={() => props.navigate(`/dashboard/clients/${state.client.id}/${state.project.project_number}`)}
              href={`/dashboard/clients/${state.client.id}/${state.project.project_number}`}
            >
              {state.project.name}
            </Link>
            <P className={"text-secondary"}>{"·"}</P>
            <Link
              className={"transition-colors"}
              onClick={() => props.navigate(`/dashboard/clients/${state.client.id}/${state.project.project_number}/${state.symlink.directory_id}`)}
              href={`/dashboard/clients/${state.client.id}/${state.project.project_number}/${state.symlink.directory_id}`}
            >
              {state.directory.name}
            </Link>
          </div>

          <FileViewer
            project={state.project}
            file={state.symlink.file}
            directory={state.directory}
          />

        </>
      )}
    </PageContent>
  );

};