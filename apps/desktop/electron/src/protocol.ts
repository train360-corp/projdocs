import { app } from "electron";
import { Secrets } from "@workspace/desktop/electron/src/secrets";
import { SERVICE_ID } from "@workspace/desktop/electron/src/secrets/consts";
import path from "node:path";
import { getTrayWindow } from "@workspace/desktop/electron/src/tray";
import { queryParamsToRequest } from "@workspace/packages/consts/auth";
import { AuthSettings } from "@workspace/desktop/src/lib/auth/store";



export async function handleDeepLink(link: string) {
  try {
    const url = new URL(link);
    if (url.protocol !== "projdocs:") return;
    switch (url.pathname) {
      case "/v1/auth/callback":
        const request = queryParamsToRequest(url.searchParams);
        if (
          !request.publicKey ||
          !request.supabaseUrl ||
          !request.session ||
          !request.url
        ) {
          console.warn("[DEEP LINK] invalid token received");
        } else {
          const authSettings: AuthSettings = {
            token: JSON.parse(request.session),
            url: request.url,
            supabase: {
              url: request.supabaseUrl,
              key: request.publicKey
            },
          };
          await Secrets.set(JSON.stringify(authSettings));
        }

        break;
      default:
        console.warn(`[DEEP LINK]: "${url.pathname}" route unhandled`);
    }

    const w = getTrayWindow();
    if (w) {
      w.show();
      w.focus();
    }
  } catch (e) {
    console.error("Bad deep link:", link, e);
  }
}

export function registerProtocol(): void {
  if (process.platform === "win32") {
    app.setAppUserModelId(SERVICE_ID); // Required before registration on Windows
    if (process.defaultApp) app.setAsDefaultProtocolClient(
      "projdocs",
      process.execPath,
      [ path.resolve(process.argv[1]!) ]
    );
    else app.setAsDefaultProtocolClient("projdocs");
  } else app.setAsDefaultProtocolClient("projdocs");
}