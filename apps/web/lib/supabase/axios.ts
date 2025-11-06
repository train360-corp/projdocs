import Axios, { AxiosInstance } from "axios";
import { createClient } from "@workspace/supabase/client";



const axios: AxiosInstance = Axios.create({
  headers: {
    apiKey: window.env?.SUPABASE_PUBLIC_KEY,
    "Content-Type": "application/json",
  },
});


axios.interceptors.request.use(async (config) => {
  const { data } = await createClient().auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return config;
});

export default axios;