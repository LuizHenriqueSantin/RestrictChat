import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import MessageItem from "./MessageItem";
import { useChatStore } from "../../store/chatStore";

export default function MessageList() {
  const { messages } = useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </Box>
  );
}
