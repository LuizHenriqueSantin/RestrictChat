import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import RoomList from "../components/chat/RoomList";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import AddMemberModal from "../components/chat/AddMemberModal";
import MembersModal from "../components/chat/MembersModal";
import { getRooms, deleteRoom } from "../api/rooms";
import { useSignalR } from "../hooks/useSignalR";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

export default function ChatPage() {
  const [rooms, setRooms] = useState([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { selectedRoom, setSelectedRoom } = useChatStore();
  const { sendMessage, subscribeToRooms, rejectedMessage, clearRejected } =
    useSignalR();
  const user = useAuthStore((state) => state.user);

  const fetchRooms = async () => {
    const { data } = await getRooms();
    setRooms(data);
    subscribeToRooms(data.map((r) => r.id));
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const isOwner = selectedRoom && user && selectedRoom.ownerId === user.id;

  const handleDeleteRoom = async () => {
    setDeleting(true);
    try {
      await deleteRoom(selectedRoom.id);
      setDeleteOpen(false);
      setSelectedRoom(null);
      fetchRooms();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <RoomList rooms={rooms} onRoomCreated={fetchRooms} />

      {selectedRoom ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: 64,
              px: 2,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {isOwner && (
              <Tooltip title="Excluir sala">
                <IconButton
                  onClick={() => setDeleteOpen(true)}
                  size="small"
                  sx={{
                    position: "absolute",
                    left: 16,
                    border: "1px solid",
                    borderColor: "error.main",
                    borderRadius: 1,
                    color: "error.main",
                    "&:hover": { borderColor: "error.dark", color: "error.dark" },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {selectedRoom.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "#FFB347" }}>
                {selectedRoom.topic}
              </Typography>
            </Box>
            {isOwner && (
              <Tooltip title="Adicionar membro">
                <IconButton
                  onClick={() => setAddMemberOpen(true)}
                  size="small"
                  sx={{
                    position: "absolute",
                    right: 52,
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 1,
                    color: "primary.main",
                    "&:hover": { borderColor: "primary.light", color: "primary.light" },
                  }}
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Ver membros">
              <IconButton
                onClick={() => setMembersOpen(true)}
                size="small"
                sx={{
                  position: "absolute",
                  right: 16,
                  border: "1px solid",
                  borderColor: "primary.main",
                  borderRadius: 1,
                  color: "primary.main",
                  "&:hover": { borderColor: "primary.light", color: "primary.light" },
                }}
              >
                <GroupIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />

          <MessageList />
          <MessageInput onSend={sendMessage} />

          <MembersModal
            open={membersOpen}
            onClose={() => setMembersOpen(false)}
            room={selectedRoom}
          />
          <AddMemberModal
            open={addMemberOpen}
            onClose={() => setAddMemberOpen(false)}
            room={selectedRoom}
          />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Typography color="text.secondary">
            Selecione uma sala para começar a conversar
          </Typography>
        </Box>
      )}

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Excluir sala</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir <strong>{selectedRoom?.name}</strong>? Todo o histórico de mensagens será perdido permanentemente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteRoom} color="error" variant="contained" disabled={deleting}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!rejectedMessage}
        autoHideDuration={4000}
        onClose={clearRejected}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={clearRejected}>
          ⚠️ {rejectedMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
