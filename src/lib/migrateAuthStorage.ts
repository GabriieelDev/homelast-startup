// One-shot migration: removes the legacy custom Supabase auth storage key
// (`sb-<project-id>-auth-token`) so it doesn't fight the SDK default key.
// Safe to call on every boot — it no-ops after the first successful run
// and also no-ops for users who never had the custom key.

const MIGRATION_FLAG = "hl_auth_storage_migrated_v1";

export function migrateAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MIGRATION_FLAG) === "1") return;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    if (projectId) {
      const legacyKey = `sb-${projectId}-auth-token`;
      // Only remove if the legacy entry actually exists — never touch the
      // SDK's own key (which lives under a different, SDK-managed name).
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue !== null) {
        window.localStorage.removeItem(legacyKey);
      }
    }

    window.localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    // localStorage disabled / quota — ignore, will retry next boot.
  }
}
