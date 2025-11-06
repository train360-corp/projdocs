import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@workspace/supabase/client";
import type { SupabaseClient } from "@workspace/supabase/types";



export const WithSupabaseClient = (props: {
  children: (supabase: SupabaseClient) => ReactNode
}) => {
  const [ supabase, setSupabase ] = useState<SupabaseClient | undefined>(undefined);
  useEffect(() => {
    setSupabase(createClient());
  }, []);
  if (supabase === undefined) return null;
  return (props.children(supabase));
};