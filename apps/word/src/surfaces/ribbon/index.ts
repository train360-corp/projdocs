import { Ribbon } from "@workspace/word/surfaces/ribbon/actions";
import { CONSTANTS } from "@workspace/word/lib/consts";

// inject custom envs
window.env = {
  SUPABASE_PUBLIC_URL: `${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/supabase`,
  SUPABASE_PUBLIC_KEY: "handled-by-desktop-forward-proxy",
};

Office.initialize = Ribbon.setup;
Office.onReady(Ribbon.setup).catch((e) => console.error(e));
