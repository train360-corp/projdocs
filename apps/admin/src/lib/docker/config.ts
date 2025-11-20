import { ContainerCreateData } from "@workspace/admin/lib/docker/gen";
import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import process from "node:process";
import { CONSTANTS } from "@workspace/consts/consts.ts";
import os from "node:os";
import { kv, KvKeys } from "@workspace/admin/lib/db/kv.ts";
import { random } from "@workspace/admin/lib/random.ts";
import { DockerService } from "@workspace/admin/lib/docker/types.ts";



export const getContainerConfig = async (svc: DockerService): Promise<ContainerCreateData["body"]> => {


  const download = async (url: string, outputPath: string): Promise<string> => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.rmSync(outputPath, { force: true });
    const writer = fs.createWriteStream(outputPath);
    try {
      const response = await axios.get(url, { responseType: "stream", });
      if (response.status !== 200) throw new Error(response.data);
      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", () => resolve());
        writer.on("error", reject);
      });
    } catch (err) {
      console.error(`Failed to download ${url}`, err);
    } finally {
      writer.close();
    }
    return outputPath;
  };

  function seconds(sec: number): bigint {
    return sec * 1_000_000_000 as unknown as bigint;
  }

  const port = process.env.PORT;
  if (!port) throw new Error(`'PORT' is undefined`);

  const shared: ContainerCreateData["body"] = {
    Labels: {
      [CONSTANTS.DOCKER.LABEL]: svc,
      "com.docker.compose.project": CONSTANTS.DOCKER.LABEL
    },
  };

  switch (svc) {

    case DockerService.REST:
      return {
        ...shared,
        Image: "postgrest/postgrest:v13.0.7",
        HostConfig: {
          NetworkMode: CONSTANTS.DOCKER.NETWORK,
          RestartPolicy: { Name: "unless-stopped" },
        },
        Env: [
          `PGRST_DB_URI=postgres://authenticator:${kv.get(KvKeys.POSTGRES_PASSWORD)}@${kv.get(KvKeys.POSTGRES_HOST)}:${kv.get(KvKeys.POSTGRES_PORT)}/${kv.get(KvKeys.POSTGRES_DB)}`,
          `PGRST_DB_SCHEMAS=public,storage`,
          `PGRST_DB_ANON_ROLE=anon`,
          `PGRST_JWT_SECRET=${kv.get(KvKeys.JWT_SECRET)}`,
          `PGRST_DB_USE_LEGACY_GUCS=false`,
          `PGRST_APP_SETTINGS_JWT_SECRET=${kv.get(KvKeys.JWT_SECRET)}`,
          `PGRST_APP_SETTINGS_JWT_EXP=3600`,
        ],
        Cmd: [ "postgrest" ]
      } satisfies ContainerCreateData["body"];

    case DockerService.KONG:

      // download required files
      const kongDir = path.join(os.homedir(), ".projdocs", "kong");
      fs.mkdirSync(kongDir, { recursive: true });
      const kongYml = await download(`http://127.0.0.1:${port}/cdn/volumes/kong/kong.yml`, path.join(kongDir, "kong.yml"));

      return {
        ...shared,
        Image: "kong:2.8.1",
        HostConfig: {
          NetworkMode: CONSTANTS.DOCKER.NETWORK,
          RestartPolicy: { Name: "unless-stopped" },
          Binds: [
            `${kongYml}:/home/kong/temp.yml:ro,z`
          ]
        },
        Entrypoint: [ "bash", "-c", "eval \"echo \\\"$(cat ~/temp.yml)\\\"\" > ~/kong.yml && /docker-entrypoint.sh kong docker-start" ],
        Env: [
          `KONG_DATABASE=off`,
          `KONG_DECLARATIVE_CONFIG=/home/kong/kong.yml`,
          `KONG_DNS_ORDER=LAST,A,CNAME`,
          `KONG_PLUGINS=request-transformer,cors,key-auth,acl,basic-auth,request-termination,ip-restriction`,
          `KONG_NGINX_PROXY_PROXY_BUFFER_SIZE=160k`,
          `KONG_NGINX_PROXY_PROXY_BUFFERS=64 160k`,
          `SUPABASE_ANON_KEY=${kv.get(KvKeys.PUBLIC_JWT)}`,
          `SUPABASE_SERVICE_KEY=${kv.get(KvKeys.PRIVATE_JWT)}`,
          `DASHBOARD_USERNAME=${random.string(16)}`,
          `DASHBOARD_PASSWORD=${random.string(16)}`,
        ],
        NetworkingConfig: {
          EndpointsConfig: {
            [CONSTANTS.DOCKER.NETWORK]: {
              Aliases: [ "kong" ]
            }
          }
        }
      } satisfies ContainerCreateData["body"];

    case DockerService.REALTIME:
      return {
        ...shared,
        Image: "ghcr.io/supabase/realtime:v2.63.0",
        Healthcheck: {
          Test: [ "CMD", "curl", "-sSfL", "--head", "-o", "/dev/null", "-H", "Authorization: Bearer ${ANON_KEY}", "http://localhost:4000/api/tenants/realtime-dev/health" ],
          Interval: seconds(5),
          Timeout: seconds(5),
          Retries: 10
        },
        HostConfig: {
          NetworkMode: CONSTANTS.DOCKER.NETWORK,
          RestartPolicy: { Name: "unless-stopped" },
        },
        Env: [
          "PORT=4000",
          `DB_HOST=${kv.get(KvKeys.POSTGRES_HOST)}`,
          `DB_PORT=${kv.get(KvKeys.POSTGRES_PORT)}`,
          `DB_USER=supabase_admin`,
          `DB_PASSWORD=${kv.get(KvKeys.POSTGRES_PASSWORD)}`,
          `DB_NAME=${kv.get(KvKeys.POSTGRES_DB)}`,
          `DB_AFTER_CONNECT_QUERY=SET search_path TO _realtime`,
          `DB_ENC_KEY=supabaserealtime`,
          `API_JWT_SECRET=${kv.get(KvKeys.JWT_SECRET)}`,
          `SECRET_KEY_BASE=${kv.get(KvKeys.REALTIME_BASE_KEY)}`,
          `ERL_AFLAGS=-proto_dist inet_tcp`,
          `DNS_NODES="''"`,
          `RLIMIT_NOFILE=10000`,
          `APP_NAME=realtime`,
          `SEED_SELF_HOST=true`,
          `RUN_JANITOR=true`,
        ],
        NetworkingConfig: {
          EndpointsConfig: {
            [CONSTANTS.DOCKER.NETWORK]: {
              Aliases: [ "realtime" ]
            }
          }
        }
      } satisfies ContainerCreateData["body"];

    case DockerService.DB:

      // download required files
      const dbDir = path.join(os.homedir(), ".projdocs", "db");
      const dbDataDir = path.join(dbDir, "data");
      const dbBindsDir = path.join(dbDir, "binds");
      fs.mkdirSync(dbDir, { recursive: true });
      fs.mkdirSync(dbDataDir, { recursive: true });
      fs.mkdirSync(dbBindsDir, { recursive: true });

      const realtimeSql = await download(`http://127.0.0.1:${port}/cdn/volumes/db/realtime.sql`, path.join(dbBindsDir, "realtime.sql"));
      const webhooksSql = await download(`http://127.0.0.1:${port}/cdn/volumes/db/webhooks.sql`, path.join(dbBindsDir, "webhooks.sql"));
      const rolesSql = await download(`http://127.0.0.1:${port}/cdn/volumes/db/roles.sql`, path.join(dbBindsDir, "roles.sql"));
      const jwtSql = await download(`http://127.0.0.1:${port}/cdn/volumes/db/jwt.sql`, path.join(dbBindsDir, "jwt.sql"));
      const _supabaseSql = await download(`http://127.0.0.1:${port}/cdn/volumes/db/_supabase.sql`, path.join(dbBindsDir, "_supabase.sql"));
      const logsSql = await download(`http://127.0.0.1:${port}/cdn/volumes/db/logs.sql`, path.join(dbBindsDir, "logs.sql"));
      const poolerSql = await download(`http://127.0.0.1:${port}/cdn/volumes/db/pooler.sql`, path.join(dbBindsDir, "pooler.sql"));

      return {
        ...shared,
        Image: "ghcr.io/supabase/postgres:17.6.1.052",
        Healthcheck: {
          Test: [ "CMD", "pg_isready", "-U", "postgres", "-h", "localhost" ],
          Interval: seconds(5),
          Timeout: seconds(5),
          Retries: 10
        },
        HostConfig: {
          NetworkMode: CONSTANTS.DOCKER.NETWORK,
          RestartPolicy: { Name: "unless-stopped" },
          Binds: [
            `${realtimeSql}:/docker-entrypoint-initdb.d/migrations/99-realtime.sql:Z`,
            `${webhooksSql}:/docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql:Z`,
            `${rolesSql}:/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:Z`,
            `${jwtSql}:/docker-entrypoint-initdb.d/init-scripts/99-jwt.sql:Z`,
            `${_supabaseSql}:/docker-entrypoint-initdb.d/migrations/97-_supabase.sql:Z`,
            `${logsSql}:/docker-entrypoint-initdb.d/migrations/99-logs.sql:Z`,
            `${poolerSql}:/docker-entrypoint-initdb.d/migrations/99-pooler.sql:Z`,
            `${dbDataDir}:/var/lib/postgresql/data:Z`,
          ]
        },
        Env: [
          `POSTGRES_HOST=/var/run/postgresql`,
          `PGPORT=${kv.get(KvKeys.POSTGRES_PORT)}`,
          `POSTGRES_PORT=${kv.get(KvKeys.POSTGRES_PORT)}`,
          `PGPASSWORD=${kv.get(KvKeys.POSTGRES_PASSWORD)}`,
          `POSTGRES_PASSWORD=${kv.get(KvKeys.POSTGRES_PASSWORD)}`,
          `PGDATABASE=${kv.get(KvKeys.POSTGRES_DB)}`,
          `POSTGRES_DB=${kv.get(KvKeys.POSTGRES_DB)}`,
          `JWT_SECRET=${kv.get(KvKeys.JWT_SECRET)}`,
          `JWT_EXP=3600`,
        ],
        Cmd: [
          "postgres",
          "-c",
          "config_file=/etc/postgresql/postgresql.conf",
          "-c",
          "log_min_messages=fatal"
        ],
        NetworkingConfig: {
          EndpointsConfig: {
            [CONSTANTS.DOCKER.NETWORK]: {
              Aliases: [ "db" ]
            }
          }
        }
      } satisfies ContainerCreateData["body"];
  }
};