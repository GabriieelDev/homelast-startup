import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "cliente" | "entregador";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRoles([]);
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
          setRoles(data.map((r) => r.role as AppRole));
        } else {
          setRoles(["cliente"]);
        }
        setLoading(false);
      });
  }, [user?.id]);

  const isAdmin = roles.includes("admin");
  const isCourier = roles.includes("entregador");
  const primaryRole: AppRole = isAdmin ? "admin" : isCourier ? "entregador" : "cliente";

  return { role: primaryRole, roles, isAdmin, isCourier, loading };
};
