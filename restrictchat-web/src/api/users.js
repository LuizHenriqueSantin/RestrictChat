import api from "./axios";

export const searchUserByEmail = (email) =>
  api.get("/users/search", { params: { email } });
