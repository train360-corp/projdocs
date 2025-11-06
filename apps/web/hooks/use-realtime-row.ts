import { useEffect, useState } from "react";
import { Database, Tables } from "@workspace/supabase/types";
import { createClient } from "@workspace/supabase/client";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/realtime-js";
import { v4 } from "uuid";



type Table = keyof Database["public"]["Tables"];
type Column<T extends Table> = string & keyof Tables<{ schema: "public" }, T>;
type UseRealtimeRowProps<T extends Table, C extends Column<T>> = {
  table: T;
  column: C;
  value: Tables<T>[C];
}

type UseRealtimeRowResult<T extends Table> = {
  loading: true;
  row: undefined;
} | {
  loading: false;
  row: Tables<T> | null;
};


export const useRealtimeRow = <T extends Table, C extends Column<T>>(props: UseRealtimeRowProps<T, C>): UseRealtimeRowResult<T> => {

  const [ state, setState ] = useState<Tables<T> | null | undefined>(undefined);
  const key = `${props.table}.${props.column}.${props.value}`;

  useEffect(() => {
    const supabase = createClient();
    let subscription: RealtimeChannel;
    let mounted = true;
    (async () => {
      const { data } = await supabase.from(props.table).select().eq(props.column, props.value as any).maybeSingle();
      setState(data as Tables<T> | null);
      subscription = supabase.realtime.channel(v4()).on("postgres_changes", {
          table: props.table,
          schema: "public",
          event: "*",
          filter: `${props.column}=eq.${props.value}`
        }, (data: RealtimePostgresChangesPayload<Tables<T>>) => setState(data.eventType === "DELETE" ? null : data.new)
      ).subscribe();
    })();
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [ key ]);

  if (state === undefined) return ({
    loading: true,
    row: undefined,
  });

  return ({
    loading: false,
    row: state
  });
};