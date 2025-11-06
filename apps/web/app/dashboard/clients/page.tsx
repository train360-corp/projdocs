"use client";

import { useRouter } from "next/navigation";
import { WithSupabaseClient } from "@workspace/web/lib/supabase/client";
import { ClientsPage } from "@workspace/ui/pages/clients";



export default function Page() {
  const router = useRouter();
  return (
    <WithSupabaseClient>
      {(supabase) => (
        <ClientsPage
          supabase={supabase}
          onClick={({ id }) => router.push(`/dashboard/clients/${id}`)}
        />
      )}
    </WithSupabaseClient>
  );
}