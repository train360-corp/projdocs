import React, { useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import { Layout } from "@workspace/word/surfaces/folder-picker/src/layout";
import { SupabaseRealtimeListener } from "@workspace/supabase/realtime/listener";
import { v4 } from "uuid";
import { createClient } from "@workspace/supabase/client";



export default function App() {

  const [channel] = useState(v4());
  const supabase = createClient();

  useEffect(() => {
    console.log(`realtime channel: ${channel}`);
  }, [channel]);

  return (
    <SupabaseRealtimeListener supabase={supabase} channel={channel}>
      <MemoryRouter initialEntries={[ "/dashboard" ]}>
        <Layout/>
      </MemoryRouter>
    </SupabaseRealtimeListener>
  );
}