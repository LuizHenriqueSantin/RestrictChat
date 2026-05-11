import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  CssBaseline,
  GlobalStyles,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#FF6B00" },
    background: { default: "#121212", paper: "#1E1E1E" },
  },
});

const globalStyles = {
  "html, body, #root": {
    height: "100%",
    margin: 0,
    padding: 0,
    overflow: "hidden",
  },
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
