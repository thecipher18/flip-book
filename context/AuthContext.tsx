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
  /** GIS has loaded, so signIn() can open its popup without being blocked. */
  gisReady: boolean;
  signIn: () => Promise<void>;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [gisReady, setGisReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Waiting here, rather than inside signIn(), is what keeps the sign-in
        // click synchronous — see the comment in signIn.
        await waitForGis();
        if (!alive) return;
        setGisReady(true);

        if (localStorage.getItem(SIGNED_OUT_KEY)) return;
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
    if (!gisReady) throw new Error("Google sign-in is still loading");

    // requestToken must be reached synchronously from the click handler.
    // Any await before it (waiting on the GIS script, say) ends the browser's
    // user-gesture window and the consent popup gets blocked.
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
    <AuthContext.Provider value={{ user, loading, gisReady, signIn, logOut }}>
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
