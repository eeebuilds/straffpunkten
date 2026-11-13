"use client";
import { track as vercelTrack } from "@vercel/analytics";
import { sb, GAME } from "./sb";
import { guestId } from "./local";

/** Loggar en händelse både i Vercel Analytics och i egen tabell (för tratt och retention). */
export function track(name: string, props?: Record<string, string | number | boolean | null>) {
  try {
    vercelTrack(name, props ?? undefined);
  } catch {}
  sb()
    .rpc("log_event", { p_name: name, p_game: GAME, p_guest: guestId(), p_props: props ?? null })
    .then(() => {}, () => {});
}
