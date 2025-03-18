import axios from "axios";
import { safeParseJSON } from "./utils";

export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const { message, signature } = safeParseJSON(window.localStorage.getItem("siwe-token"));
    const token =  btoa(`${message}||${signature}`);
    console.log("token", token)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
