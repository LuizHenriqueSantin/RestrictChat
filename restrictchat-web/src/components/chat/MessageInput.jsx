import { useState } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useChatStore } from "../../store/chatStore";

export default function MessageInput({ onSend }) {
  const [content, setContent] = useState("");
  const isPending = useChatStore((state) => state.isPending);

  const handleSend = () => {
    if (!content.trim() || isPending) return;
    onSend(content.trim());
    setContent("");
  };

  return (
    <Box
      sx={{
        height: 72,
        flexShrink: 0,
        px: 2,
        borderTop: 1,
        borderColor: "divider",
        display: "flex",
        gap: 1,
        alignItems: "center",
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Digite uma mensagem..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
      />
      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={!content.trim() || isPending}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
}
