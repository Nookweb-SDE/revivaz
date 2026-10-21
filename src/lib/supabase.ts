import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url ?? "", anon ?? "", {
  db: { schema: "revivaz" },
  auth: { persistSession: true, autoRefreshToken: true },
});

export const supabaseConfigured = Boolean(url && anon);
