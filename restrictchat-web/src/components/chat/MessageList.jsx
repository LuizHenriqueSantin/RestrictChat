import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import MessageItem from "./MessageItem";
import PendingIndicator from "./PendingIndicator";
import { useChatStore } from "../../store/chatStore";

export default function MessageList() {
  const { messages, isPending } = useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {isPending && <PendingIndicator />}
      <div ref={bottomRef} />
    </Box>
  );
}
