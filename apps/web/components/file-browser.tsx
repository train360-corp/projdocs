import { SupabaseClient, Tables } from "@workspace/supabase/types";
import FileBrowserTable from "@workspace/web/components/file-browser-table";
import * as React from "react";
import { useEffect, useState } from "react";
import { Spinner } from "@workspace/ui/components/spinner";



export const FileBrowser = ({ client, project, directoryID, supabase, navigate }: {
  client: Tables<"clients">;
  project: Tables<"projects">;
  directoryID?: string;
  supabase: SupabaseClient;
  navigate: (url: string) => void;
}) => {


  const [ directory, setDirectory ] = useState<Tables<"directories"> | null | undefined>(undefined);

  useEffect(() => {
    const isRootPath = directoryID === "_" || directoryID === undefined;
    if (isRootPath) setDirectory(null);
    else supabase.from("directories").select()
      .eq("project_id", project.id)
      .eq("id", directoryID)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error);
        setDirectory(data);
      });
  }, [ directoryID ]);

  return (
    <div className="flex flex-col rounded-lg border h-full max-h-full overflow-scroll">
      {directory === undefined ? (
        <div className={"flex flex-row w-full justify-center"}>
          <Spinner className={"size-16 text-secondary"}/>
        </div>
      ) : (
        <FileBrowserTable
          project={project}
          directory={directory}
          supabase={supabase}
          navigate={navigate}
        />
      )}
    </div>
  );
};