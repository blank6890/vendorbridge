import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "@/api";
import { normalizeUserFromApi, ROLE_TO_API } from "@/lib/roles";

const AuthContext = createContext(null);

const STORAGE_KEY = "vendorbridge_auth";

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, token: null };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null,
    };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredAuth();
    setUser(stored.user);
    setToken(stored.token);
    setLoading(false);
  }, []);

  const persist = useCallback((nextUser, nextToken) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken })
    );
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await authAPI.login(email, password);
      const nextUser = normalizeUserFromApi(data.user);
      setUser(nextUser);
      setToken(data.token);
      persist(nextUser, data.token);
      return nextUser;
    },
    [persist]
  );

  const signup = useCallback(async (payload) => {
    const name = `${payload.firstName ?? ""} ${payload.lastName ?? ""}`.trim();
    const role = ROLE_TO_API[payload.role] ?? "vendor";

    const data = await authAPI.register(name, payload.email, payload.password, role, {
      phone: payload.phone,
      country: payload.country,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });
    return normalizeUserFromApi({
      id: data.userId,
      name,
      email: payload.email,
      role: data.role,
      status: data.status,
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateUser = useCallback(
    (updates) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        persist(next, token);
        return next;
      });
    },
    [persist, token]
  );

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout, updateUser }),
    [user, token, loading, login, signup, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
