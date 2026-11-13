"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sb, rpc } from "@/lib/sb";
import { guestId, lsGet, lsSet } from "@/lib/local";
import { track } from "@/lib/track";

type Pending = { nickname: string; consent: boolean; next?: string; join?: string };

/** När man kommer tillbaka från inloggningslänken: spara smeknamn och samtycke, flytta över gästspel och gå vidare. */
export default function AuthSync() {
  const router = useRouter();
  useEffect(() => {
    const { data } = sb().auth.onAuthStateChange(async (event, session) => {
      if (!session || (event !== "SIGNED_IN" && event !== "INITIAL_SESSION")) return;
      const pending = lsGet<Pending>("pending");
      if (!pending) return;
      lsSet("pending", null);
      try {
        await rpc("set_profile", { p_nickname: pending.nickname, p_consent: pending.consent, p_guest: guestId() });
        track("signup_done", { consent: pending.consent });
        if (pending.join) {
          await rpc("join_league", { p_code: pending.join }).catch(() => {});
          router.replace("/liga/" + pending.join);
          return;
        }
        router.replace(pending.next || "/?sparad=1");
      } catch (e) {
        lsSet("profile_error", e instanceof Error ? e.message : "error");
        router.replace("/konto");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);
  return null;
}
