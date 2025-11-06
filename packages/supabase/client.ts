import { createBrowserClient } from "@supabase/ssr";
import { SupabaseBrowserRuntimeEnvironment, SupabaseClient } from "./types";



declare global {
  interface Window {
    env?: SupabaseBrowserRuntimeEnvironment;
  }
}

export const createClient = (): SupabaseClient => {

  if (window === undefined) throw new Error("window is undefined");
  if (window.env === undefined || typeof window.env !== "object") throw new Error("window.env is undefined");

  const url = window.env.SUPABASE_PUBLIC_URL;
  if (!url) throw new Error("window.env.SUPABASE_PUBLIC_URL is undefined");

  const anonKey = window.env.SUPABASE_PUBLIC_KEY;
  if (!anonKey) throw new Error("window.env.SUPABASE_PUBLIC_KEY is undefined");

  return createBrowserClient(url, anonKey, { auth: { storageKey: "train360-dms" } }) as unknown as SupabaseClient;
};