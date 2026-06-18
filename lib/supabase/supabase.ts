 import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let cachedSupabase: SupabaseClient | null = null;

function createSupabaseBrowserClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

export function getSupabaseClient() {
  if (!cachedSupabase) {
    cachedSupabase =
      createSupabaseBrowserClient();
  }

  return cachedSupabase;
}

export const supabase =
  new Proxy({} as SupabaseClient, {
    get(_target, property) {
      const client =
        getSupabaseClient();

      const value =
        client[property as keyof SupabaseClient];

      if (typeof value === "function") {
        return value.bind(client);
      }

      return value;
    },
  });