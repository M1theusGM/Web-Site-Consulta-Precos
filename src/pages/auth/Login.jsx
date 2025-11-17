// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Avatar, Box, Button, Checkbox, Container, CssBaseline, FormControlLabel,
  Grid, IconButton, InputAdornment, Link, Paper, TextField, Typography, Alert
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";

import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container component="main" maxWidth="xs" sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <CssBaseline />
      <Paper elevation={6} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5">Entrar</Typography>

          {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type={showPw ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPw((v) => !v)}
                      edge="end"
                    >
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControlLabel
              control={<Checkbox color="primary" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label="Lembrar-me neste dispositivo"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 1.5, mb: 2, py: 1.2 }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 1 }}
            >
            <Grid item>
                <Link component={RouterLink} to="#" variant="body2" underline="hover">
                Esqueci minha senha
                </Link>
            </Grid>
            <Grid item>
                <Link
                component={RouterLink}
                to="/registrar"
                state={{ from }}
                variant="body2"
                underline="hover"
                >
                Criar conta
                </Link>
            </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
