"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";



export const createClient = (): SupabaseClient => {

  const url = window.env.SUPABASE_PUBLIC_URL;
  const anonKey = window.env.SUPABASE_PUBLIC_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables not found in window.env");
  }

  return createBrowserClient(url, anonKey, { auth: { storageKey: "train360-dms" } }) as unknown as SupabaseClient;
};
