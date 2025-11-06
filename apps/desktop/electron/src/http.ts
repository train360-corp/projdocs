import type { Server } from "http";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import { app } from "electron";
import { Secrets } from "@workspace/desktop/electron/src/secrets";
import https from "https";
import { trustRootCert } from "@workspace/desktop/electron/src/certs";
import { createProxyMiddleware } from "http-proxy-middleware";
import { AuthSettings } from "@workspace/desktop/src/lib/auth/store";



const HOST = "127.0.0.1" as const; // loopback only
const PORT = 9305 as const;
let auth: AuthSettings | null = null;

let server: Server | null = null;

function buildApp() {

  const app = express();

  // update auth token
  Secrets.get().then(a => auth = typeof a === "string" && a.length > 0 ? JSON.parse(a) : null);

  // cors
  app.use(cors());
  app.options(/.*/, cors()); // handle preflight requests

  // body parsers
  app.use(express.json({ limit: "32mb" })); // word internally sets this limit generally
  app.use(express.urlencoded({ extended: false }));

  // routes
  app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

  app.get("/version", (_req, res) => res.status(200).json({
    name: appName(),
    version: appVersion(),
    electron: process.versions.electron
  }));

  app.post("/echo", (req, res) => res.status(200).json({ received: req.body ?? null }));

  app.get("/user", async (_req, res) => {
    const secret = await Secrets.get();
    if (secret !== null && secret.trim().length > 0) res.status(200).end();
    else res.status(400).end();
  });

  return app;
}

function buildForwardProxy(server: Server, app: Express) {
  const middleware = createProxyMiddleware({
    changeOrigin: true,
    ws: true,
    secure: false,
    pathRewrite: { "^/supabase": "" },
    router: () => auth ? auth.supabase.url : undefined,
    on: {
      proxyReqWs: (proxyReq, req, socket, options, head) => {
        try {

          if (auth) {

            if (proxyReq.path.startsWith("/realtime/v1/websocket")) {
              const url = new URL(`http://placeholder.local${proxyReq.path}`);
              url.searchParams.set("apikey", auth.supabase.key);
              proxyReq.path = url.pathname + "?" + url.searchParams.toString();
            }

            proxyReq.setHeader("Authorization", `Bearer ${auth.token}`);
            proxyReq.setHeader("apikey", auth.supabase.key);

          }
        } catch (e) {
          console.error(e);
          socket.destroy(e as Error);
        }
      },
      proxyReq: (proxyReq, req, res) => {
        if (auth) {
          proxyReq.setHeader("Authorization", `Bearer ${auth.token}`);
          proxyReq.setHeader("apikey", auth.supabase.key);
        }
      },
    },
  });
  app.use("/supabase", middleware);
  server.on("upgrade", (req, socket, head) => {
    try {
      if (req.url?.startsWith("/supabase/realtime/v1/websocket")) {
        // @ts-expect-error: Node typings use Socket, but proxy expects Duplex
        middleware.upgrade(req, socket, head);
      } else {
        socket.destroy();
      }
    } catch (err) {
      console.error("[upgrade] proxy error:", err);
      socket.destroy();
    }
  });
}

async function startHttpServer(): Promise<void> {
  if (server) return;

  // Build express and create a plain HTTP server (no HTTPS since loopback)
  const app = buildApp();

  const { key, cert } = trustRootCert();
  server = https.createServer({ key, cert }, app);

  // setup
  buildForwardProxy(server, app);

  // add minimal 404 **LAST**
  app.use((_req, res) => res.status(404).json({ error: "not found" }));

  await new Promise<void>((resolve, reject) => {
    server!.once("error", (err: any) => {
      // Helpful diagnostics if port is taken
      if (err?.code === "EADDRINUSE") {
        console.error(`[http] Port ${PORT} is already in use on ${HOST}.`);
      }
      reject(err);
    });
    server!.listen(PORT, HOST, () => {
      console.log(`[http] Listening on http://${HOST}:${PORT}`);
      resolve();
    });
  });

  // Close server when Electron is quitting
  appOnWillQuit(() => stopHttpServer().catch((e) => console.error("[http] stop error:", e)));
}

async function stopHttpServer(): Promise<void> {
  if (!server) return;
  const s = server;
  server = null;
  await new Promise<void>((resolve) => s.close(() => resolve()));
  console.log("[http] Closed");
}

// --- small helpers ---

function appOnWillQuit(cb: () => void) {
  // Ensure single subscription
  app.once("will-quit", cb);
  app.once("quit", cb);
}

function appName() {
  try {
    return app.getName();
  } catch {
    return "ProjDocs";
  }
}

function appVersion() {
  try {
    return app.getVersion();
  } catch {
    return "0.0.0";
  }
}

export const HttpServer = {
  start: startHttpServer,
  stop: stopHttpServer,
  auth: {
    set: (a: AuthSettings | null) => {
      auth = a;
    }
  }
};