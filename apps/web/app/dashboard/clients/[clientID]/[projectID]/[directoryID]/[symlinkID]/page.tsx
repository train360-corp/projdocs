"use client";
import { useRouter } from "next/navigation";
import { FilePage } from "@workspace/ui/pages/file";
import { use } from "react";
import { WithSupabaseClient } from "@workspace/web/lib/supabase/client";



export default function Page({ params }: {
  params: Promise<{
    clientID: string;
    projectID: string;
    directoryID: string;
    symlinkID: string;
  }>;
}) {

  const { clientID, projectID, directoryID, symlinkID } = use(params);
  const router = useRouter();

  return (
    <WithSupabaseClient>
      {(supabase) => (
        <FilePage
          navigate={(url) => router.push(url)}
          supabase={supabase}
          clientID={clientID}
          projectID={projectID}
          directoryID={directoryID}
          symlinkID={symlinkID}
          disableFileSelection
          disableDirectorySelection
        />
      )}
    </WithSupabaseClient>
  );
}