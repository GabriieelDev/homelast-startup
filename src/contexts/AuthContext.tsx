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

  useEffect(() => {
    // 1) Listener registered first so we don't miss events.
    //    Only trust a "no user" state after initial getSession() completes
    //    and only when the event is an explicit SIGNED_OUT with null session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // On mobile, TOKEN_REFRESHED / INITIAL_SESSION can fire during hydration —
      // never treat those as logout. Only SIGNED_OUT + null session clears the user.
      if (event === "SIGNED_OUT" && newSession === null) {
        setSession(null);
        setUser(null);
        return;
      }

      // For any other event with a session, update state.
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
      // Ignore transient null sessions from non-SIGNED_OUT events during init.
    });

    // 2) Restore any persisted session, then unblock the app.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
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
