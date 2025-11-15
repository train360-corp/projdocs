import axios from "axios";

const docker = axios.create({
  baseURL: "http://unix:/v1.47",
  socketPath: "/var/run/docker.sock"
})

const ping = async (): Promise<boolean> => {
  try {
    const response = await docker.get("/_ping");
    return response.status === 200;
  } catch (e) {
    console.error(e)
    return false;
  }
}

export const GET = async () => {

  if(!await ping()) return Response.json({ error: "unable to connect to docker (is it running?)" }, { status: 500 });

  const f = await docker.get("/containers/json", {
    params: {
      all: true,
      filters: JSON.stringify({"label": ["com.docker.compose.project=dms2"]})
    }
  })

  return Response.json({})

}