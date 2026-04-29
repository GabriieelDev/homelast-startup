import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "cliente";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // prefer admin if multiple
          const isAdmin = data.some((r) => r.role === "admin");
          setRole(isAdmin ? "admin" : (data[0].role as AppRole));
        } else {
          setRole("cliente");
        }
        setLoading(false);
      });
  }, [user]);

  return { role, isAdmin: role === "admin", loading };
};
