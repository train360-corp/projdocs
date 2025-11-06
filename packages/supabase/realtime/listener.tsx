import { ReactNode, useEffect, useState } from "react";
import { SupabaseClient } from "@workspace/supabase/types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";



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
      <div className="flex flex-row items-center justify-center p-4 text-sm text-muted-foreground gap-2">
        <svg
          className="animate-spin h-4 w-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span>{"Establishing realtime connection..."}</span>
      </div>
    );
  }
;