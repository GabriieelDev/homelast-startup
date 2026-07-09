import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const INACTIVITY_MS = 60 * 60 * 1000; // 60 min
const WARNING_BEFORE_MS = 2 * 60 * 1000; // aviso 2 min antes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "click"] as const;

const SessionTimeoutProvider = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [warnOpen, setWarnOpen] = useState(false);
  const [remaining, setRemaining] = useState(WARNING_BEFORE_MS);

  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    warnTimer.current = null;
    logoutTimer.current = null;
    countdownTimer.current = null;
  };

  const doLogout = useCallback(async () => {
    clearTimers();
    setWarnOpen(false);
    await signOut();
    navigate("/auth", { replace: true });
  }, [navigate, signOut]);

  const startCountdown = useCallback(() => {
    setRemaining(WARNING_BEFORE_MS);
    setWarnOpen(true);
    const startedAt = Date.now();
    countdownTimer.current = setInterval(() => {
      const left = WARNING_BEFORE_MS - (Date.now() - startedAt);
      setRemaining(Math.max(0, left));
    }, 1000);
    logoutTimer.current = setTimeout(doLogout, WARNING_BEFORE_MS);
  }, [doLogout]);

  const resetTimers = useCallback(() => {
    if (!userId) return;
    clearTimers();
    setWarnOpen(false);
    warnTimer.current = setTimeout(startCountdown, INACTIVITY_MS - WARNING_BEFORE_MS);
  }, [userId, startCountdown]);

  useEffect(() => {
    if (!userId) {
      clearTimers();
      setWarnOpen(false);
      return;
    }
    resetTimers();
    const handler = () => {
      if (!warnOpen) resetTimers();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handler));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, warnOpen]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");

  return (
    <>
      {children}
      <AlertDialog open={warnOpen} onOpenChange={(o) => !o && resetTimers()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sua sessão está prestes a expirar</AlertDialogTitle>
            <AlertDialogDescription>
              Por inatividade, você será desconectado em <strong>{mins}:{secs}</strong>.
              Clique em "Continuar conectado" para permanecer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={doLogout}>Sair agora</AlertDialogCancel>
            <AlertDialogAction onClick={resetTimers}>Continuar conectado</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SessionTimeoutProvider;
