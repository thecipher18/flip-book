"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getProfile, type Profile } from "@/lib/drive";
import {
  cachedToken,
  clearToken,
  requestToken,
  waitForGis,
} from "@/lib/driveToken";

// Signing out only drops the local token; the Google grant is left in place so
// the next sign-in stays silent. This flag stops the silent re-grant from
// signing the user straight back in on reload.
const SIGNED_OUT_KEY = "flipbook:signedOut";

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (localStorage.getItem(SIGNED_OUT_KEY)) return;
        await waitForGis();
        await requestToken(false);
        const profile = await getProfile();
        if (alive) setUser(profile);
      } catch {
        // No silent grant available — the user signs in from /login.
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const signIn = async () => {
    await waitForGis();
    await requestToken(true);
    localStorage.removeItem(SIGNED_OUT_KEY);
    setUser(await getProfile());
  };

  const logOut = () => {
    localStorage.setItem(SIGNED_OUT_KEY, "1");
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * Client-side gate. There is no server-side data to protect any more — Drive
 * rejects any request without a valid token — so this is UX, not enforcement.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  return { user, loading, ready: !loading && !!user && !!cachedToken() };
}
