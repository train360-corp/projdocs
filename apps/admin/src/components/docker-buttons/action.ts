"use server";

import { docker } from "@workspace/admin/lib/docker";
import { CONSTANTS } from "@workspace/consts/consts.ts";
import { getContainerConfig } from "@workspace/admin/lib/docker/config.ts";
import { DockerService } from "@workspace/admin/lib/docker/types.ts";



export const startContainer = async ({ id }: { id: string }) => {
  await docker.containerStart({ path: { id } });
};

export const createContainer = async ({ svc }: { svc: DockerService }) => {


  // create network
  const net = await docker.networkInspect({ path: { id: CONSTANTS.DOCKER.NETWORK } });
  if (!net.data?.Id) await docker.networkCreate({ body: { Name: CONSTANTS.DOCKER.NETWORK } });

  const cfg = await getContainerConfig(svc);

  // pull the image
  const { error: pullError } = await docker.imageCreate({ query: { fromImage: cfg.Image } });
  if (pullError) {
    console.error(pullError);
    return;
  }

  // create the container
  const resp = await docker.containerCreate({ query: { name: svc, }, body: cfg });
  if (resp.error) console.error(resp.error);
  else console.log(resp.data);
};