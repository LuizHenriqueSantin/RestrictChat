import api from "./axios";

export const getRooms = () => api.get("/rooms");

export const createRoom = (name, topic) => api.post("/rooms", { name, topic });

export const getMembers = (roomId) => api.get(`/rooms/${roomId}/members`);

export const addMember = (roomId, username) =>
  api.post(`/rooms/${roomId}/members`, { username });

export const deleteRoom = (roomId) => api.delete(`/rooms/${roomId}`);

export const getHistory = (roomId, before) =>
  api.get(`/rooms/${roomId}/messages`, { params: before ? { before } : {} });
