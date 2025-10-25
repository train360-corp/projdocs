import { SupabaseClient as $SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@workspace/supabase/types";



export {};
declare global {
  type SupabaseClient = $SupabaseClient<Database>;
}