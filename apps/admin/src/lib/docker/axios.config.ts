import type { CreateClientConfig } from "@workspace/admin/lib/docker/gen/client.gen";



export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: "http://unix:/v1.47",
  socketPath: "/var/run/docker.sock",
});