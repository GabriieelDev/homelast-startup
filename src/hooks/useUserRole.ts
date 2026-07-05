import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "cliente" | "entregador";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    // Safety timeout: never block UI more than 4s on role resolution.
    const timeout = setTimeout(() => {
      if (cancelled) return;
      console.warn("[useUserRole] timeout — falling back to 'cliente'");
      setRoles(["cliente"]);
      setLoading(false);
    }, 4000);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (error) console.error("[useUserRole] error:", error);
        console.log("[useUserRole] loaded roles:", data);
        if (data && data.length > 0) {
          setRoles(data.map((r) => r.role as AppRole));
        } else {
          setRoles(["cliente"]);
        }
        setLoading(false);
      });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [user]);

  const isAdmin = roles.includes("admin");
  const isCourier = roles.includes("entregador");
  const primaryRole: AppRole = isAdmin ? "admin" : isCourier ? "entregador" : "cliente";

  return { role: primaryRole, roles, isAdmin, isCourier, loading };
};
