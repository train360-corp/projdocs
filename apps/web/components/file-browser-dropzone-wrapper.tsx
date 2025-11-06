"use client";

import { ReactNode } from "react";
import { uploadFile } from "@workspace/web/lib/supabase/upload-file";
import { createClient } from "@workspace/supabase/client";
import { toast } from "sonner";
import { Tables } from "@workspace/supabase/types";
import { DropzoneWrapper } from "@workspace/ui/components/dropzone-wrapper";



export const FileBrowserDropzoneWrapper = ({ children, project, directory }: {
  children: ReactNode;
  project: Tables<"projects">;
  directory: Tables<"directories"> | null;
}) => directory === null ? children : (
  <DropzoneWrapper
    onDrop={files => files.forEach(file => uploadFile(createClient(), {
      file: {
        data: file,
        object: null
      },
      directory: directory,
      bucket: project.id,
      onError: error => {
        if ("originalResponse" in error && error.originalResponse?.getStatus() === 403) toast.error("Permission Denied", {
          description: "You do not have permission to upload to this project."
        });
        else toast.error("Request Failed", {
          description: "An unknown error occurred."
        });
      },
    }))}
  >
    {children}
  </DropzoneWrapper>
);