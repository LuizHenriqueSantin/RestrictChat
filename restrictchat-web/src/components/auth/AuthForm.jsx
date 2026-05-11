import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import { login, register } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const isLogin = tab === 0;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const { data } = isLogin
        ? await login(form.email, form.password)
        : await register(form.username, form.email, form.password);

      setAuth(
        { id: data.id, username: data.username, email: data.email },
        data.token,
      );
      navigate("/");
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401) {
        setErrors(["E-mail ou senha inválidos."]);
      } else if (status === 409) {
        setErrors([data?.message || "E-mail já está em uso."]);
      } else if (data?.errors) {
        const msgs = Object.values(data.errors).flat();
        setErrors(
          msgs.length ? msgs : ["Dados inválidos. Verifique os campos."],
        );
      } else {
        setErrors([data?.message || "Ocorreu um erro. Tente novamente."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: 380,
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          color="primary"
          mb={8}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          RestrictChat
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setErrors([]);
          }}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Login" />
          <Tab label="Cadastro" />
        </Tabs>

        {!isLogin && (
          <TextField
            fullWidth
            label="Nome de usuário"
            name="username"
            value={form.username}
            onChange={handleChange}
            margin="normal"
            required
          />
        )}
        <TextField
          fullWidth
          label="E-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Senha"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          margin="normal"
          required
        />

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.length === 1 ? (
              errors[0]
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3 }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : isLogin ? (
            "Entrar"
          ) : (
            "Cadastrar"
          )}
        </Button>
      </Box>
    </Box>
  );
}
