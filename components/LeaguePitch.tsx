"use client";
import Link from "next/link";
import { track } from "@/lib/track";

/** Nästa steg efter en omgång: samla samma gäng kring veckans topplista. */
export default function LeaguePitch({ source }: { source: "intro" | "result" | "shared" }) {
  return (
    <section className="league-pitch" aria-label="Spela i en kompisliga">
      <span className="kicker">Samma quiz. Egen liga.</span>
      <h2>Vem kan mest fotboll i kompisgänget?</h2>
      <p>Ta diskussionen till topplistan. Spela dagens elva frågor, bjud in gänget och tävla om veckan.</p>
      <Link className="btn wide" href="/ligor#skapa" onClick={() => track("league_cta", { source })}>Starta en liga med gänget</Link>
      <Link className="league-secondary" href="/ligor" onClick={() => track("league_cta", { source, action: "existing" })}>Redan med? Till dina ligor</Link>
    </section>
  );
}
