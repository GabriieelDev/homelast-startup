import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitializedRef = useRef(false);
  // Refs mirror latest state so the listener can compare without re-subscribing
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const applySession = (newSession: Session | null) => {
      // Only update React state when identity actually changes — prevents cascade
      // re-fetches on TOKEN_REFRESHED (new access_token but same user).
      const prevUserId = userRef.current?.id ?? null;
      const nextUserId = newSession?.user?.id ?? null;
      if (prevUserId !== nextUserId) {
        userRef.current = newSession?.user ?? null;
        setUser(newSession?.user ?? null);
      }
      const prevToken = sessionRef.current?.access_token ?? null;
      const nextToken = newSession?.access_token ?? null;
      if (prevToken !== nextToken) {
        sessionRef.current = newSession;
        setSession(newSession);
      }
    };

    // 1) Listener registered first so we don't miss events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      const houveMudanca =
        (userRef.current?.id ?? null) !== (newSession?.user?.id ?? null) ||
        (sessionRef.current?.access_token ?? null) !== (newSession?.access_token ?? null);
      console.log("[Auth] evento:", event, "setUser chamado:", houveMudanca);

      if (event === "SIGNED_OUT" && newSession === null) {
        userRef.current = null;
        sessionRef.current = null;
        setSession(null);
        setUser(null);
        return;
      }
      if (newSession) {
        applySession(newSession);
      }
      // Ignore transient null sessions from non-SIGNED_OUT events during init.
    });

    // 2) Restore any persisted session, then unblock the app.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
      isInitializedRef.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
