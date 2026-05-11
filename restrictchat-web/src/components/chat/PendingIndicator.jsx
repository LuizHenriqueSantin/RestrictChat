import { Box, Typography } from "@mui/material";

export default function PendingIndicator() {
  return (
    <Box display="flex" justifyContent="flex-end" mb={1}>
      <Box
        sx={{
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: "grey.300",
          color: "text.secondary",
          fontStyle: "italic",
        }}
      >
        <Typography variant="body2">Validando mensagem...</Typography>
      </Box>
    </Box>
  );
}
