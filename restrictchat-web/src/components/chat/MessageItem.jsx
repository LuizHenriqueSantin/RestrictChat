import { Box, Typography, Avatar } from "@mui/material";
import { useAuthStore } from "../../store/authStore";

export default function MessageItem({ message }) {
  const user = useAuthStore((state) => state.user);
  const isOwn = message.username === user?.username;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 1,
        mb: 1,
      }}
    >
      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
        {message.username[0].toUpperCase()}
      </Avatar>
      <Box>
        {!isOwn && (
          <Typography variant="caption" color="text.secondary" ml={1}>
            {message.username}
          </Typography>
        )}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: isOwn ? "primary.main" : "grey.800",
            color: "white",
            maxWidth: 400,
          }}
        >
          <Typography variant="body2">{message.content}</Typography>
        </Box>
        <Typography variant="caption" color="text.disabled" ml={1}>
          {new Date(message.sentAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Box>
    </Box>
  );
}
