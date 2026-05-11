import { ListItem, ListItemButton, Box, Typography } from "@mui/material";

export default function RoomItem({
  room,
  selected,
  onClick,
  lastMessage,
  unread,
}) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={selected}
        onClick={onClick}
        sx={{
          borderRadius: 1,
          alignItems: "flex-start",
          py: 1,
          ...(unread &&
            !selected && {
              border: "1px solid",
              borderColor: "primary.main",
              boxShadow: "0 0 6px rgba(255,107,0,0.3)",
            }),
        }}
      >
        <Box sx={{ minWidth: 0, width: "100%" }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            noWrap
            color={
              selected ? "primary" : unread ? "primary.light" : "text.primary"
            }
          >
            {room.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lastMessage
              ? `${lastMessage.username}: ${lastMessage.content}`
              : room.topic}
          </Typography>
        </Box>
      </ListItemButton>
    </ListItem>
  );
}
