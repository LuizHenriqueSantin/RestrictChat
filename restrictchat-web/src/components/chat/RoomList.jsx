import { useState } from "react";
import {
  Box,
  List,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import RoomItem from "./RoomItem";
import { createRoom } from "../../api/rooms";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function RoomList({ rooms, onRoomCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", topic: "" });
  const [loading, setLoading] = useState(false);
  const { selectedRoom, setSelectedRoom, lastMessageByRoom, unreadRooms } =
    useChatStore();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createRoom(form.name, form.topic);
      setForm({ name: "", topic: "" });
      setOpen(false);
      onRoomCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="primary">
          RestrictChat
        </Typography>
        <Tooltip title="Sair">
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 1,
              color: "primary.main",
              "&:hover": { borderColor: "error.main", color: "error.main" },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
        <List dense>
          {rooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              selected={selectedRoom?.id === room.id}
              onClick={() => setSelectedRoom(room)}
              lastMessage={lastMessageByRoom[room.id]}
              unread={!!unreadRooms[room.id]}
            />
          ))}
        </List>
      </Box>

      <Box
        sx={{
          height: 73,
          flexShrink: 0,
          px: 2,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          variant="outlined"
          size="small"
        >
          Nova sala
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Criar sala</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome da sala"
            margin="normal"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Tema (ex: Futebol)"
            margin="normal"
            value={form.topic}
            onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
            helperText="A IA usará o tema para moderar as mensagens."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
