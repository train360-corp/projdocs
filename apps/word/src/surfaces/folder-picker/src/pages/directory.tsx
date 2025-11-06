import { PageContent } from "@workspace/ui/components/page-content";
import { FileBrowser } from "@workspace/web/components/file-browser";
import * as React from "react";



export const Directory = () => {

  return (
    <PageContent>

      <FileBrowser
        navigate={props.navigate}
        client={state.client}
        project={state.project}
        directoryID={undefined}
        supabase={props.supabase}
      />

    </PageContent>
  )

}