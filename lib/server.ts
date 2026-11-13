import "server-only";

/** Anropar en databasfunktion från servern med den publika nyckeln. */
export async function serverRpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export type Card = {
  day: string; score: number; finished: boolean; results: boolean[];
  nickname: string | null; players: number; beaten_pct: number | null;
};
