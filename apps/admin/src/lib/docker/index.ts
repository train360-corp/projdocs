import * as SDK from "@workspace/admin/lib/docker/gen/sdk.gen";
import { client } from "@workspace/admin/lib/docker/gen/client.gen.ts";
import * as process from "node:process";

client.instance.interceptors.request.use(request => {
  if(process.env.NODE_ENV !== "development" || !request.url) return request;
  const url = new URL(request.url);
  console.log(` ${request.method!.toUpperCase()} ${url.host}:${url.pathname}`);
  return request;
})

export const docker = SDK;

