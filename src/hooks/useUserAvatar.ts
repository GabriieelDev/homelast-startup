import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { gravatarUrl } from "@/lib/avatar";

// Returns the avatar URL to display for the current user, with Gravatar fallback.
// Listens for "avatar-updated" custom events to refresh after a change.
export function useUserAvatar() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [gravatar, setGravatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setAvatarUrl(null); setGravatar(null); return; }

    if (user.email) gravatarUrl(user.email).then((u) => { if (!cancelled) setGravatar(u); });

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setAvatarUrl((data?.avatar_url as string | null) ?? null);
    };
    load();

    const onUpdated = () => load();
    window.addEventListener("avatar-updated", onUpdated);
    return () => { cancelled = true; window.removeEventListener("avatar-updated", onUpdated); };
  }, [user]);

  return { url: avatarUrl || gravatar, uploadedUrl: avatarUrl, gravatarUrl: gravatar };
}
