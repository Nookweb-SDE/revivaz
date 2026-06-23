import { useState, useEffect } from "react";
import { onAuthChange, getSessionUserId } from "../lib/auth";

export interface SessionState {
  userId: string | null;
  loading: boolean;
}

/**
 * Hook that tracks the current Supabase auth session.
 * - `loading: true` while the initial session check is in flight.
 * - `userId: string` when authenticated, `null` when not.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    userId: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    // Seed the state from the current session before subscribing to changes
    getSessionUserId().then((id) => {
      if (mounted) {
        setState({ userId: id, loading: false });
      }
    });

    // Subscribe to future auth state changes
    const unsub = onAuthChange((id) => {
      if (mounted) {
        setState({ userId: id, loading: false });
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return state;
}
