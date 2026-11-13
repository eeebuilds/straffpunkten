"use client";
import { useEffect } from "react";
import { sb, rpc } from "@/lib/sb";
import { guestId, lsGet, lsSet } from "@/lib/local";
import { track } from "@/lib/track";

type Pending = { nickname: string; consent: boolean; next?: string; join?: string };

// Läses innan Supabase hinner rensa adressen: kom användaren hit via inloggningslänken?
const FROM_LINK = typeof window !== "undefined" && /access_token=/.test(window.location.hash);

/**
 * Efter inloggning: flytta över den här webbläsarens gästspel till kontot och spara smeknamn
 * om det finns lokalt. Nya konton får profil och gästspel även via databasen, så det fungerar
 * också när länken öppnas på en annan enhet än den man spelade på.
 */
export default function AuthSync() {
  useEffect(() => {
    let done = false;
    const { data } = sb().auth.onAuthStateChange((event, session) => {
      if (!session || done) return;
      const pending = lsGet<Pending>("pending");
      if (!pending && !(FROM_LINK && (event === "SIGNED_IN" || event === "INITIAL_SESSION"))) return;
      done = true;
      lsSet("pending", null);
      // Kör utanför callbacken, som inte får vänta på andra Supabase-anrop.
      setTimeout(async () => {
        let target = pending?.join ? "/liga/" + pending.join : pending?.next || "/?sparad=1";
        try {
          await rpc("claim_guest", { p_guest: guestId() });
          if (pending) {
            await rpc("set_profile", { p_nickname: pending.nickname, p_consent: pending.consent, p_guest: guestId() });
            if (pending.join) await rpc("join_league", { p_code: pending.join }).catch(() => {});
          } else {
            const profile = await rpc("get_profile");
            if (!profile) target = "/konto";
          }
          track("signup_done", { consent: pending?.consent ?? null, sameDevice: !!pending });
        } catch (e) {
          lsSet("profile_error", e instanceof Error ? e.message : "error");
          target = "/konto";
        }
        // Full omladdning så att alla delar av sidan hämtar kontots data.
        window.location.replace(target);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return null;
}
