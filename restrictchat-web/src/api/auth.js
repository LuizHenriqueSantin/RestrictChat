import api from "./axios";

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const register = (username, email, password) =>
  api.post("/auth/register", { username, email, password });
