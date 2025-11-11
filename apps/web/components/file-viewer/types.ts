import { ReactNode } from "react";
import { Tables } from "@workspace/supabase/types";



export type FileViewerProps = {
  file: Tables<"files">;
  version: Tables<"files_versions">;
  data: {
    info: Tables<{ schema: "storage" }, "objects">,
    blob: Blob
  };
}

export type FileViewer = (props: FileViewerProps) => ReactNode;


