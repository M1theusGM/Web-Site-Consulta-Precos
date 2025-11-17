// src/pages/auth/Register.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Avatar, Box, Button, Checkbox, Container, CssBaseline, FormControlLabel,
  Grid, IconButton, InputAdornment, Link, Paper, TextField, Typography, Alert
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accept, setAccept] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    if (!name.trim()) return "Informe seu nome completo.";
    if (!email.trim()) return "Informe um e‑mail válido.";
    if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    if (password !== confirm) return "As senhas não conferem.";
    if (!accept) return "Você deve aceitar os termos para continuar.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password }, true);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Não foi possível criar a conta.");
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
            <PersonAddAlt1Icon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5">Criar conta</Typography>

          {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirm"
              label="Confirmar senha"
              type={showPw2 ? "text" : "password"}
              id="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPw2 ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPw2((v) => !v)}
                      edge="end"
                    >
                      {showPw2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <FormControlLabel
              control={<Checkbox color="primary" checked={accept} onChange={(e) => setAccept(e.target.checked)} />}
              label={
                <span>
                  Li e aceito os <Link component={RouterLink} to="#" underline="hover">termos de uso</Link>.
                </span>
              }
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 1.5, mb: 2, py: 1.2 }}
            >
              {loading ? "Criando..." : "Criar conta"}
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link component={RouterLink} to="/login" underline="hover" variant="body2">
                  Já tem conta? Entrar
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
