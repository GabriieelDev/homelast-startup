// Host de um projeto Supabase antigo (desativado). Hoje devolve uma página de placeholder
// com status 200, então o onError do <img> não dispara.
const DEAD_HOSTS = ["xnoygmiliuiwkijlhset"];

export function isUsableImageUrl(url?: string | null): url is string {
  if (!url || !url.trim()) return false;
  return !DEAD_HOSTS.some((h) => url.includes(h));
}
