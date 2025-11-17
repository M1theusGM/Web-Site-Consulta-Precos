// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

// Lê variáveis do Vite
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
// ATENÇÃO: mock só se explicitamente "true"
const USE_MOCK = String(import.meta.env.VITE_MOCK_AUTH || "false").toLowerCase() === "true";

// Helper para requests
async function apiFetch(path, { method = "GET", token, body } = {}) {
  if (!API_URL) throw new Error("VITE_API_URL não definido.");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // tenta JSON sempre que possível
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch (_) { /* mantém txt */ }

  if (!res.ok) {
    const msg = data?.message || data?.erro || data || `HTTP ${res.status}`;
    const error = new Error(typeof msg === "string" ? msg : "Erro na requisição.");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

function saveToken(token, remember) {
  // limpa o outro storage para evitar ambiguidades
  localStorage.removeItem("auth:token");
  sessionStorage.removeItem("auth:token");
  if (remember) localStorage.setItem("auth:token", token);
  else sessionStorage.setItem("auth:token", token);
}
function readToken() {
  return localStorage.getItem("auth:token") || sessionStorage.getItem("auth:token") || null;
}
function clearToken() {
  localStorage.removeItem("auth:token");
  sessionStorage.removeItem("auth:token");
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken());
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Bootstrap da sessão (token -> /auth/me)
  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        if (!token) {
          setUser(null);
          return;
        }
        if (USE_MOCK) {
          // modo mock: finge que está logado
          if (alive) setUser({ id: "mock", name: "Usuário Mock", email: "mock@exemplo.com" });
          return;
        }
        const data = await apiFetch("/auth/me", { token });
        if (alive) setUser(data?.user || null);
      } catch {
        // token inválido/expirado
        clearToken();
        if (alive) { setToken(null); setUser(null); }
      } finally {
        if (alive) setBooting(false);
      }
    }

    bootstrap();
    return () => { alive = false; };
  }, [token]);

  // Funções públicas
  async function login(email, password, remember = true) {
    if (USE_MOCK) {
      const fakeToken = "mock-token";
      saveToken(fakeToken, remember);
      setToken(fakeToken);
      setUser({ id: "mock", name: "Usuário Mock", email });
      return { token: fakeToken, user: { id: "mock", name: "Usuário Mock", email } };
    }
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    saveToken(data.token, remember);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(payload, autoLogin = true) {
    const { name, email, password } = payload || {};
    if (!name || !email || !password) {
      throw new Error("Nome, e-mail e senha são obrigatórios.");
    }
    if (USE_MOCK) {
      const fakeToken = "mock-token";
      if (autoLogin) {
        saveToken(fakeToken, true);
        setToken(fakeToken);
        setUser({ id: "mock", name, email });
      }
      return { token: fakeToken, user: { id: "mock", name, email } };
    }
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    if (autoLogin) {
      saveToken(data.token, true);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }

  function logout() {
    clearToken();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!token && !!user,
    loading: booting,
    login,
    register,     // <- expõe "register" (usado no seu Register.jsx)
    logout,
  }), [user, token, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext não encontrado. Envolva sua árvore com <AuthProvider>.");
  return ctx;
}
