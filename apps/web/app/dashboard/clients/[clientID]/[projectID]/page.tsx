"use client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { WithSupabaseClient } from "@workspace/web/lib/supabase/client";
import { ProjectPage } from "@workspace/ui/pages/project";



export default function Page({ params }: {
  params: Promise<{
    clientID: string;
    projectID: string;
  }>
}) {

  const { clientID, projectID } = use(params);
  const router = useRouter();


  return (
    <WithSupabaseClient>
      {(supabase) => (
        <ProjectPage
          navigate={(url) => router.push(url)}
          supabase={supabase}
          clientID={clientID}
          projectID={projectID}
          disableDirectorySelection
          disableFileSelection
        />
      )}
    </WithSupabaseClient>
  );
}