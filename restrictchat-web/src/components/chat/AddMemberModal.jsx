import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { searchUserByEmail } from "../../api/users";
import { addMember, getMembers } from "../../api/rooms";

export default function AddMemberModal({ open, onClose, room }) {
  const [email, setEmail] = useState("");
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleClose = () => {
    setEmail("");
    setFound(null);
    setError("");
    setSuccess("");
    onClose();
  };

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setFound(null);
    setError("");
    setSuccess("");
    try {
      const { data: user } = await searchUserByEmail(email.trim());

      const { data: members } = await getMembers(room.id);
      const alreadyMember = members.some((m) => m.id === user.id);
      if (alreadyMember) {
        setError("Este usuário já é membro da sala.");
        return;
      }

      setFound(user);
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 404
          ? "Nenhum usuário encontrado com esse e-mail."
          : "Erro ao pesquisar. Tente novamente.",
      );
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!found) return;
    setAdding(true);
    setError("");
    try {
      await addMember(room.id, found.username);
      setSuccess(`${found.username} adicionado com sucesso!`);
      setFound(null);
      setEmail("");
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "Erro ao adicionar membro.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <PersonAddIcon color="primary" />
        Adicionar membro
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Sala: <strong>{room?.name}</strong>
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <TextField
            fullWidth
            label="E-mail do usuário"
            type="email"
            size="small"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFound(null);
              setError("");
              setSuccess("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            disabled={searching || !email.trim()}
            sx={{ whiteSpace: "nowrap", minWidth: 90 }}
          >
            {searching ? <CircularProgress size={18} /> : "Buscar"}
          </Button>
        </Box>

        {found && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "primary.main",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="body2" fontWeight="bold" color="primary">
              {found.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {found.email}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!found || adding}
          startIcon={
            adding ? <CircularProgress size={16} /> : <PersonAddIcon />
          }
        >
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
