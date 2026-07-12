import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  reconnecting: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  reconnecting: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const isInitializedRef = useRef(false);
  const signOutRequestedRef = useRef(false);
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const applySession = (newSession: Session | null) => {
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

    const clearAuth = () => {
      userRef.current = null;
      sessionRef.current = null;
      setSession(null);
      setUser(null);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // NOTE: never call supabase.auth.getSession()/getUser()/refreshSession()
      // from inside this callback — doing so re-enters the SDK's refresh path
      // and, on refresh failures, produces a SIGNED_OUT → getSession →
      // refresh → SIGNED_OUT infinite loop. 429s are already handled
      // transparently by the retrying fetch wrapper in the client.
      if (event === "SIGNED_OUT") {
        signOutRequestedRef.current = false;
        clearAuth();
        return;
      }
      if (newSession) {
        applySession(newSession);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
      isInitializedRef.current = true;
      setLoading(false);
    });

    const onReconnecting = (e: Event) => {
      const detail = (e as CustomEvent<{ active: boolean }>).detail;
      setReconnecting(!!detail?.active);
    };
    window.addEventListener('supabase:reconnecting', onReconnecting);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('supabase:reconnecting', onReconnecting);
    };
  }, []);

  const signOut = async () => {
    signOutRequestedRef.current = true;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, reconnecting, signOut }}>
      {children}
      {reconnecting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] px-3 py-1.5 rounded-full bg-black/80 text-white text-xs shadow-lg backdrop-blur-sm flex items-center gap-2"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Reconectando...
        </div>
      )}
    </AuthContext.Provider>
  );
};
