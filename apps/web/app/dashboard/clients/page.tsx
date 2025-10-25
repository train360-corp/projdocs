"use client";

import { createClient } from "@workspace/web/lib/supabase/client";
import { H1 } from "@workspace/ui/components/text";
import ClientsTable from "@workspace/ui/components/clients-table";
import { useEffect, useState } from "react";
import { Tables } from "@workspace/supabase/types";



export default function Page() {

  const [ clients, setClients ] = useState<readonly Tables<"clients">[] | undefined | null>();
  const supabase = createClient();


  useEffect(() => {
    supabase.from("clients").select().then(({ data }) => setClients(data));
  }, [ supabase ]);


  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">

        <H1>{"Clients"}</H1>

        <ClientsTable
          clients={clients}
          onRowClick={() => {}}
        />

      </div>
    </div>
  );
}