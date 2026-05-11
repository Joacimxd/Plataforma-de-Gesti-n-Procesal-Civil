import type { AxiosInstance } from "axios";
import axios from "axios";
import type { GetTokenFn } from "@/types";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export function createApi(getToken: GetTokenFn): AxiosInstance {
  const api = axios.create({ baseURL: baseURL.replace(/\/$/, "") });
  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return api;
}
