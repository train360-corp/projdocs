import type { Database } from "./types.gen";
import { SupabaseClient as Supabase } from "@supabase/supabase-js";



export * from "./types.gen";
export type SupabaseClient = Supabase<Database>;
export type SupabaseRuntimeEnvironment = {
  SUPABASE_JWT_SECRET: string;
  SUPABASE_PUBLIC_URL: string;
  SUPABASE_PUBLIC_KEY: string;
};

export type SupabaseBrowserRuntimeEnvironment = Pick<SupabaseRuntimeEnvironment,
  | "SUPABASE_PUBLIC_KEY"
  | "SUPABASE_PUBLIC_URL"
>
