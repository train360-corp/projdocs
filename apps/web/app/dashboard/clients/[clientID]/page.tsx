"use client";
import { WithSupabaseClient } from "@workspace/web/lib/supabase/client";
import { ClientPage } from "@workspace/ui/pages/client";
import { useRouter } from "next/navigation";
import { use } from "react";



export default function Page({ params }: {
  params: Promise<{
    clientID: string;
  }>
}) {

  const { clientID } = use(params);
  const router = useRouter();

  return (
    <WithSupabaseClient
    >
      {(supabase) => (
        <ClientPage
          supabase={supabase}
          clientID={clientID}
          onClick={(project) => router.push(`/dashboard/clients/${project.client_id}/${project.project_number}`)}
        />
      )}
    </WithSupabaseClient>
  );

}