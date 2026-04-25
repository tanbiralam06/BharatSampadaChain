// GuestProvider silently acquires a PUBLIC-role JWT on mount.
// No login screen — the token is transparent to the user.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { guestLogin } from '@bsc/shared';
import { PageSpinner } from '@bsc/shared';

interface GuestState { ready: boolean; error: boolean; }
const GuestContext = createContext<GuestState>({ ready: false, error: false });

const TOKEN_KEY = 'bsc_token';

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuestState>({ ready: false, error: false });

  useEffect(() => {
    const acquire = async () => {
      // Re-use a stored guest token if it is still valid (< 1h old).
      const stored = sessionStorage.getItem(TOKEN_KEY);
      if (stored) { setState({ ready: true, error: false }); return; }

      try {
        const data = await guestLogin();
        sessionStorage.setItem(TOKEN_KEY, data.token);
        setState({ ready: true, error: false });
      } catch {
        setState({ ready: true, error: true }); // still render — API may come up
      }
    };

    void acquire();
  }, []);

  if (!state.ready) {
    return (
      <div className="min-h-screen bg-[#03070f] flex items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  return <GuestContext.Provider value={state}>{children}</GuestContext.Provider>;
}

export function useGuest() { return useContext(GuestContext); }
