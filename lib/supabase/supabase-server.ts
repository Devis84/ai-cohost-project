 import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let cachedSupabaseServer: SupabaseClient | null = null;

function createSupabaseServerClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function getSupabaseServerClient() {
  if (!cachedSupabaseServer) {
    cachedSupabaseServer =
      createSupabaseServerClient();
  }

  return cachedSupabaseServer;
}

export const supabaseServer =
  new Proxy({} as SupabaseClient, {
    get(_target, property) {
      const client =
        getSupabaseServerClient();

      const value =
        client[property as keyof SupabaseClient];

      if (typeof value === "function") {
        return value.bind(client);
      }

      return value;
    },
  });