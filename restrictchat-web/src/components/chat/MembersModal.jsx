import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import { getMembers } from "../../api/rooms";

export default function MembersModal({ open, onClose, room }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !room) return;
    setLoading(true);
    getMembers(room.id)
      .then(({ data }) => setMembers(data))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [open, room]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GroupIcon color="primary" />
        Membros da sala
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : members.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Nenhum membro encontrado.
          </Typography>
        ) : (
          <List>
            {members.map((member) => (
              <ListItem key={member.id} divider>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: member.isOwner ? "primary.main" : "grey.700",
                      width: 36,
                      height: 36,
                      fontSize: 14,
                    }}
                  >
                    {member.username[0].toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={member.isOwner ? "bold" : "normal"}
                      >
                        {member.username}
                      </Typography>
                      {member.isOwner && (
                        <Chip
                          label="Dono"
                          size="small"
                          color="primary"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={member.email}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
