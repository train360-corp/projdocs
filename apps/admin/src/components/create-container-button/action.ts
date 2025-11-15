"use server";

import { docker } from "@workspace/admin/lib/docker";
import { DockerService } from "../../../app/page.tsx";
import { ContainerCreateData } from "@workspace/admin/lib/docker/gen";
import { CONSTANTS } from "@workspace/consts/consts.ts";



function seconds(sec: number): bigint {
  return BigInt(sec) * 1_000_000_000n;
}

// TODO: replace with dynamically loaded values
const logflarePublicToken: string = "testtoken";
const logflarePrivateToken: string = "testprivatetoken";
const databasePassword: string = "postgres";
const databaseHost: string = "postgres";

const getContainerConfig = (svc: DockerService): ContainerCreateData["body"] => {

  const shared: ContainerCreateData["body"] = {
    Labels: {
      [CONSTANTS.DOCKER.LABEL]: svc,
      "com.docker.compose.project": CONSTANTS.DOCKER.LABEL
    }
  };

  switch (svc) {
    case DockerService.LOGS:
      return {
        ...shared,
        Image: "supabase/logflare:1.14.2",
        Healthcheck: {
          Test: [ "CMD", "curl", "http://localhost:4000/health" ],
          Interval: seconds(5),
          Timeout: seconds(5),
          Retries: 10
        },
        Env: [
          `LOGFLARE_NODE_HOST=127.0.0.1`,
          `DB_USERNAME=supabase_admin`,
          `DB_DATABASE=_supabase`,
          `DB_HOSTNAME=${databaseHost}`,
          `DB_PORT=5432`,
          `DB_PASSWORD=${databasePassword}`,
          `DB_SCHEMA=_analytics`,
          `LOGFLARE_PUBLIC_ACCESS_TOKEN=${logflarePublicToken}`,
          `LOGFLARE_PRIVATE_ACCESS_TOKEN=${logflarePrivateToken}`,
          `LOGFLARE_SINGLE_TENANT=true`,
          `LOGFLARE_SUPABASE_MODE=true`,
          `LOGFLARE_MIN_CLUSTER_SIZE=1`,
          `POSTGRES_BACKEND_URL=postgresql://supabase_admin:${databasePassword}@${databaseHost}:5432/_supabase`,
          `POSTGRES_BACKEND_SCHEMA=_analytics`,
          `LOGFLARE_FEATURE_FLAG_OVERRIDE=multibackend=true`,
        ]
      };
    case DockerService.DB:
      return {
        ...shared,
        Image: "ghcr.io/supabase/postgres:17.6.1.052"
      } satisfies ContainerCreateData["body"];
    case DockerService.REALTIME:
      return {
        ...shared,
        Image: ""
      } satisfies ContainerCreateData["body"];
  }
};

export const onClick = async ({ svc }: { svc: DockerService }) => {

  const cfg = getContainerConfig(svc);

  // pull the image
  const { error: pullError } = await docker.imageCreate({ query: { fromImage: cfg.Image } });
  if (pullError) console.error(pullError);

  // create the container
  const resp = await docker.containerCreate({ query: { name: svc, }, body: cfg });
  if (resp.error) console.error(resp.status, resp.error);
};