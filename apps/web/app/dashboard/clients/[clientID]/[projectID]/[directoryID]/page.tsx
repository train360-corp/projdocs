"use client";
import { useRouter } from "next/navigation";
import { DirectoryPage } from "@workspace/ui/pages/directory";
import { use } from "react";
import { WithSupabaseClient } from "@workspace/web/lib/supabase/client";



export default function Page({ params }: {
  params: Promise<{
    clientID: string;
    projectID: string;
    directoryID: string;
  }>
}) {

  const { clientID, projectID, directoryID } = use(params);
  const router = useRouter();


  return (
    <WithSupabaseClient>
      {(supabase) => (
        <DirectoryPage
          navigate={(url) => router.push(url)}
          supabase={supabase}
          clientID={clientID}
          projectID={projectID}
          directoryID={directoryID}
          disableFileSelection
          disableDirectorySelection
        />
      )}
    </WithSupabaseClient>
  );
}