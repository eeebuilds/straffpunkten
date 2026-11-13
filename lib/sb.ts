"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!, {
      // Implicit flow: inloggningslänken fungerar även om den öppnas i en annan webbläsare än den man spelade i.
      auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
    });
  }
  return client;
}

export const GAME = "straffpunkten";

/** Anropar en databasfunktion och kastar ett Error med funktionens felkod. */
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await sb().rpc(fn, args);
  if (error) throw new Error(error.message || "rpc_error");
  return data as T;
}
