import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@workspace/supabase/types";
import { useEffect, useState } from "react";
import { H1 } from "@workspace/ui/components/text";
import ClientsTable from "@workspace/ui/components/clients-table";
import { PageContent } from "@workspace/ui/components/page-content";



export const ClientsPage = (props: {
  supabase: SupabaseClient<Database>;
  onClick: (client: Tables<"clients">) => void;
}) => {

  const [ clients, setClients ] = useState<readonly Tables<"clients">[] | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const clients = await props.supabase.from("clients").select();
      if (clients.error) {
        console.error(clients.error);
        setClients(null);
        return;
      } else setClients(clients.data);
    })();
  }, []);

  return (
    <PageContent>
      <H1>{"Clients"}</H1>

      <ClientsTable
        clients={clients}
        onRowClick={props.onClick}
      />
    </PageContent>
  );

};