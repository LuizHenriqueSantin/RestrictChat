import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useChatStore = create(
  persist(
    (set) => ({
      selectedRoom: null,
      messages: [],
      isPending: false,
      lastMessageByRoom: {},
      unreadRooms: {},
      setSelectedRoom: (room) =>
        set((state) => ({
          selectedRoom: room,
          messages: [],
          unreadRooms: room
            ? { ...state.unreadRooms, [room.id]: false }
            : state.unreadRooms,
        })),
      setMessages: (messages, roomId) =>
        set((state) => ({
          messages,
          lastMessageByRoom:
            roomId && messages.length > 0
              ? {
                  ...state.lastMessageByRoom,
                  [roomId]: messages[messages.length - 1],
                }
              : state.lastMessageByRoom,
        })),
      addMessage: (message, roomId) =>
        set((state) => ({
          messages: [...state.messages, message],
          lastMessageByRoom: roomId
            ? { ...state.lastMessageByRoom, [roomId]: message }
            : state.lastMessageByRoom,
        })),
      updateLastMessage: (message, roomId) =>
        set((state) => ({
          lastMessageByRoom: roomId
            ? { ...state.lastMessageByRoom, [roomId]: message }
            : state.lastMessageByRoom,
        })),
      setPending: (isPending) => set({ isPending }),
      markUnread: (roomId) =>
        set((state) => ({
          unreadRooms: { ...state.unreadRooms, [roomId]: true },
        })),
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        selectedRoom: state.selectedRoom,
        lastMessageByRoom: state.lastMessageByRoom,
      }),
    },
  ),
);
