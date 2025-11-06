import { useEffect } from "react";
import { SupabaseRealtimeEvent } from "@workspace/supabase/realtime/listener";
import { Database, Tables } from "@workspace/supabase/types.gen";



export function useRealtimeListener<T extends string & keyof Database["public"]["Tables"]>(
  table: T,
  handler: (event: SupabaseRealtimeEvent<Tables<T>>) => void,
) {
  useEffect(() => {
    const eventName = `realtime:${table}`;
    const listener = (e: Event) => handler((e as CustomEvent<SupabaseRealtimeEvent<Tables<T>>>).detail);
    window.addEventListener(eventName, listener);
    return () => window.removeEventListener(eventName, listener);
  }, [ table, handler ]);
}