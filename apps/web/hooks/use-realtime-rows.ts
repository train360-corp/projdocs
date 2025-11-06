import { useEffect, useState } from "react";
import { Database } from "@workspace/supabase/types";
import { createClient } from "@workspace/supabase/client";
import { RealtimeChannel } from "@supabase/realtime-js";
import { v4 } from "uuid";



type Table = keyof Database["public"]["Tables"];

type Tables<T extends Table> = Database["public"]["Tables"][T]["Row"] extends {
  id: string | number
} ? Database["public"]["Tables"][T]["Row"] : never;

type Column<T extends Table> = keyof Tables<T>;
type UseRealtimeRowsProps<T extends Table, C extends Column<T>> = {
  table: T;
  filters: readonly {
    column: C;
    value: Tables<T>[C];
  }[];
} | {
  table: T;
}

type UseRealtimeRowsResult<T extends Table> = {
  loading: true;
  rows: undefined;
} | {
  loading: false;
  rows: Tables<T>[];
};


export const useRealtimeRows = <T extends Table, C extends Column<T>>(props: UseRealtimeRowsProps<T, C>): UseRealtimeRowsResult<T> => {

  const [ state, setState ] = useState<Tables<T>[] | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let subscription: RealtimeChannel;
    (async () => {

      let query = supabase.from(props.table).select();
      if ("filters" in props)
        for (const filter of props.filters)
          query = (filter.value === null || filter.value === undefined) ? query.is(filter.column as any, null) : query.eq(filter.column as any, filter.value as any);
      const { data } = await query;
      setState((data as Tables<T>[] | null) ?? []);

      subscription = supabase.realtime.channel(v4()).on("postgres_changes", {
          table: props.table,
          schema: "public",
          event: "*",
        }, (event) => {
          switch (event.eventType) {
            case "INSERT":
              let passed = true;
              if ("filters" in props)
                for (const filter of props.filters)
                  if ((event.new as unknown as Tables<T>)[filter.column] !== filter.value)
                    passed = false;
              if (passed) setState(data => [ ...(data ?? []), (event.new as unknown as Tables<T>) ]);
              break;
            case "UPDATE":
              setState(data => (data ?? []).map(row => row.id === (event.new as unknown as Tables<T>).id ? (event.new as unknown as Tables<T>) : row));
              break;
            case "DELETE":
              setState(data => (data ?? []).filter(row => row.id !== (event.old as unknown as Tables<T>).id));
              break;
          }
        }
      ).subscribe();
    })();
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (state === undefined) return ({
    loading: true,
    rows: undefined,
  });

  return ({
    loading: false,
    rows: state
  });
};