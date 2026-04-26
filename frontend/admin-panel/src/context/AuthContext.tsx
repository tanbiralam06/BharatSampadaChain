import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { adminLogin, totpVerify } from '@bsc/shared';
import type { JWTPayload } from '@bsc/shared';

const TOKEN_KEY = 'bsc_token';

interface AuthState {
  token:          string | null;
  user:           JWTPayload | null;
  // Held between step-1 (password OK) and step-2 (TOTP code) — never stored in sessionStorage
  challengeToken: string | null;
}

export interface AuthContextValue extends AuthState {
  // Step 1: username + password. Returns 'complete' or 'totp_required'.
  login:      (identifier: string, password: string) => Promise<'complete' | 'totp_required'>;
  // Step 2: 6-digit TOTP code (only callable after login returns 'totp_required')
  loginTotp:  (code: string) => Promise<void>;
  logout:     () => void;
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
    if (!stored) return { token: null, user: null, challengeToken: null };
    const decoded = decodeToken(stored);
    if (!decoded || isExpired(decoded) || decoded.role !== 'ADMIN') {
      sessionStorage.removeItem(TOKEN_KEY);
      return { token: null, user: null, challengeToken: null };
    }
    return { token: stored, user: decoded, challengeToken: null };
  });

  useEffect(() => {
    const check = () => {
      if (state.user && isExpired(state.user)) {
        sessionStorage.removeItem(TOKEN_KEY);
        setState({ token: null, user: null, challengeToken: null });
      }
    };
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [state.user]);

  const login = useCallback(async (identifier: string, password: string): Promise<'complete' | 'totp_required'> => {
    const data = await adminLogin(identifier, password);

    if ('step' in data && data.step === 'totp_required') {
      setState((prev) => ({ ...prev, challengeToken: data.challenge_token }));
      return 'totp_required';
    }

    const decoded = decodeToken(data.token);
    if (!decoded) throw new Error('Malformed token');
    if (decoded.role !== 'ADMIN') throw new Error('ADMIN credentials required');
    sessionStorage.setItem(TOKEN_KEY, data.token);
    setState({ token: data.token, user: decoded, challengeToken: null });
    return 'complete';
  }, []);

  const loginTotp = useCallback(async (code: string): Promise<void> => {
    if (!state.challengeToken) throw new Error('No pending TOTP challenge');
    const data = await totpVerify(state.challengeToken, code);
    const decoded = decodeToken(data.token);
    if (!decoded) throw new Error('Malformed token');
    sessionStorage.setItem(TOKEN_KEY, data.token);
    setState({ token: data.token, user: decoded, challengeToken: null });
  }, [state.challengeToken]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setState({ token: null, user: null, challengeToken: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginTotp, logout, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
