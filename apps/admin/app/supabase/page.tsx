"use client";
import { SupabaseManager } from "@workspace/admin/components/supabase-manager";



export default function () {
  return (
    <SupabaseManager
      projectRef={"#"}
      isMobile={false}
    />
  );
}