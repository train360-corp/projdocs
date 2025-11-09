import { ReactNode, useEffect, useState } from "react";
import { SupabaseClient } from "@workspace/supabase/types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { LoadingPage } from "@workspace/ui/pages/loading";



export type SupabaseRealtimeEvent<Table extends { id: any }> = {
  type: "INSERT";
  at: string;
  payload: {
    new: Table;
    old: null;
  }
} | {
  type: "UPDATE";
  at: string;
  payload: {
    new: Table;
    old: Pick<Table, "id">;
  }
} | {
  type: "DELETE";
  at: string;
  payload: {
    new: null;
    old: Pick<Table, "id">;
  }
}

export const SupabaseRealtimeListener = ({ children, supabase, channel, }: {
    children: ReactNode;
    supabase: SupabaseClient;
    channel: string;
  }) => {
    const [ subscribed, setSubscribed ] = useState(false);

    useEffect(() => {
      const ch = supabase
        .channel(channel)
        .on(
          "postgres_changes",
          { schema: "public", event: "*" },
          (payload: RealtimePostgresChangesPayload<{}>) => {
            window.dispatchEvent(new CustomEvent(`realtime:${payload.table}`, {
              detail: {
                type: payload.eventType,
                at: payload.commit_timestamp,
                payload: {
                  new: payload.eventType === "DELETE" ? null : payload.new,
                  // @ts-expect-error
                  old: payload.eventType === "INSERT" ? null : payload.old,
                }
              },
            } satisfies CustomEventInit<SupabaseRealtimeEvent<any>>));
          },
        )
        .subscribe((status) => setSubscribed(status === "SUBSCRIBED"));

      return () => {
        supabase.removeChannel(ch).then();
      };
    }, [ supabase, channel ]);

    return subscribed ? children : (
      <LoadingPage msg={"Establishing realtime connection..."} />
    );
  }
;