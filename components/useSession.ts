"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { sb } from "@/lib/sb";

/** undefined = laddar, null = utloggad */
export function useSession(): Session | null | undefined {
  const [s, setS] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    sb().auth.getSession().then(({ data }) => setS(data.session));
    const { data } = sb().auth.onAuthStateChange((_e, session) => setS(session));
    return () => data.subscription.unsubscribe();
  }, []);
  return s;
}
