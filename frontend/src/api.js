import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("chatUser") || "null");

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

export default API;