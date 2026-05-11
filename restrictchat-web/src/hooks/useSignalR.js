import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

export function useSignalR() {
  const token = useAuthStore((state) => state.token);
  const {
    selectedRoom,
    setMessages,
    addMessage,
    updateLastMessage,
    setPending,
    markUnread,
  } = useChatStore();
  const connectionRef = useRef(null);
  const selectedRoomRef = useRef(selectedRoom);
  const pendingSubscriptionsRef = useRef([]);
  const [rejectedMessage, setRejectedMessage] = useState(null);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("RoomHistory", (history) => {
      const roomId = selectedRoomRef.current?.id;
      setMessages(history, roomId);
    });

    connection.on("ReceiveMessage", (message) => {
      const currentRoomId = selectedRoomRef.current?.id;
      const msgRoomId = message.roomId;

      if (msgRoomId === currentRoomId) {
        setPending(false);
        addMessage(message, msgRoomId);
      } else {
        updateLastMessage(message, msgRoomId);
        markUnread(msgRoomId);
      }
    });

    connection.on("MessagePending", () => setPending(true));
    connection.on("MessageRejected", (reason) => {
      setPending(false);
      setRejectedMessage(reason);
    });
    connection.on("Error", (err) => console.error("SignalR error:", err));

    connection.onreconnected(() => {
      const room = selectedRoomRef.current;
      if (room) connection.invoke("JoinRoom", room.id);

      pendingSubscriptionsRef.current.forEach((id) => {
        if (id !== room?.id) connection.invoke("SubscribeToRoom", id);
      });
    });

    connection
      .start()
      .then(() => {
        connectionRef.current = connection;

        if (pendingSubscriptionsRef.current.length > 0) {
          pendingSubscriptionsRef.current.forEach((id) =>
            connection.invoke("SubscribeToRoom", id),
          );
        }

        const room = selectedRoomRef.current;
        if (room) connection.invoke("JoinRoom", room.id);
      })
      .catch((err) => console.error("SignalR connection error:", err));

    return () => {
      connection.stop();
    };
  }, [token]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || !selectedRoom) return;

    connection.invoke("JoinRoom", selectedRoom.id);

    return () => {
      connection.invoke("LeaveRoom", selectedRoom.id);
    };
  }, [selectedRoom]);

  const sendMessage = (content) => {
    const connection = connectionRef.current;
    if (!connection || !selectedRoom) return;
    connection.invoke("SendMessage", selectedRoom.id, content);
  };

  const subscribeToRooms = (roomIds) => {
    pendingSubscriptionsRef.current = roomIds;

    const connection = connectionRef.current;
    if (!connection) return;
    roomIds.forEach((id) => connection.invoke("SubscribeToRoom", id));
  };

  const clearRejected = () => setRejectedMessage(null);

  return { sendMessage, subscribeToRooms, rejectedMessage, clearRejected };
}
