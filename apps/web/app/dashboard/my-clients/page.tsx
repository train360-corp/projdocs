"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { H1 } from "@workspace/ui/components/text";
import ClientsTable, { FavoriteClient } from "@workspace/ui/components/clients-table";
import { useRouter } from "next/navigation";
import { createClient } from "@workspace/supabase/client";
import { Tables } from "@workspace/supabase/types";

type FavoriteClientTable = Tables<"favorites"> & {
  client: Tables<"clients">;
}

export default function Page() {

  const [ clients, setClients ] = useState<readonly FavoriteClient[] | undefined | null>();
  const router = useRouter();

  useEffect(() => {
    createClient()
      .from("favorites")
      .select(`*, client:clients (*)`).not("client_id", "is", null)
      .overrideTypes<Array<FavoriteClientTable>>()
      .then(({ data }) => setClients(!data ? data : data.map(r => ({
        ...r.client,
        isFavorite: true
      }))));
  }, []);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">

        <H1>{"My Clients"}</H1>

        <ClientsTable
          clients={clients}
          noRowsText={"Looks like you haven't added a client yet! Add one to continue."}
          onRowClick={({ id }) => router.push(`/dashboard/clients/${id}`)}
        />

      </div>
    </div>
  );
}