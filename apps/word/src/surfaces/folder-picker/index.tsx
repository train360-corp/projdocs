import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { CONSTANTS } from "@workspace/word/lib/consts";
import { SupabaseBrowserRuntimeEnvironment } from "@workspace/supabase/types";

declare global {
  interface Window {
    Office?: typeof Office;
    env?: SupabaseBrowserRuntimeEnvironment;
  }
}

Office.onReady(async () => {

  // wait for DOM to be ready
  await new Promise<void>((res) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => res(), { once: true });
    } else res();
  });

  // inject custom envs
  window.env = {
    SUPABASE_PUBLIC_URL: `${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/supabase`,
    SUPABASE_PUBLIC_KEY: "handled-by-desktop-forward-proxy",
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("#root not found");
  createRoot(rootEl).render(<App/>);

}).catch((e) => {
  console.error("Boot error:", e);
});