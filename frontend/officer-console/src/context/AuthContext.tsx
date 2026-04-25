import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin } from '@bsc/shared';
import type { JWTPayload, AccessorRole } from '@bsc/shared';

const OFFICER_ROLES: AccessorRole[] = ['IT_DEPT', 'ED', 'CBI'];
const TOKEN_KEY = 'bsc_token';

interface AuthState { token: string | null; user: JWTPayload | null; }
interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string, role: AccessorRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): JWTPayload | null {
  try { return jwtDecode<JWTPayload>(token); }
  catch { return null; }
}

function isExpired(p: JWTPayload) { return !!p.exp && p.exp * 1000 < Date.now(); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (!stored) return { token: null, user: null };
    const decoded = decodeToken(stored);
    if (!decoded || isExpired(decoded) || !OFFICER_ROLES.includes(decoded.role)) {
      sessionStorage.removeItem(TOKEN_KEY);
      return { token: null, user: null };
    }
    return { token: stored, user: decoded };
  });

  useEffect(() => {
    const check = () => {
      if (state.user && isExpired(state.user)) {
        sessionStorage.removeItem(TOKEN_KEY);
        setState({ token: null, user: null });
      }
    };
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [state.user]);

  const login = useCallback(async (identifier: string, password: string, role: AccessorRole) => {
    const data = await apiLogin(identifier, password, role);
    const decoded = decodeToken(data.token);
    if (!decoded) throw new Error('Malformed token');
    if (!OFFICER_ROLES.includes(decoded.role)) throw new Error('Access denied: officer roles only');
    sessionStorage.setItem(TOKEN_KEY, data.token);
    setState({ token: data.token, user: decoded });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setState({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
