import type { Metadata } from "next";
import Link from "next/link";
import { serverRpc, type Card } from "@/lib/server";
import { Kicks, Pitch } from "@/components/Pitch";

type Props = { params: Promise<{ id: string }> };

async function getCard(id: string) {
  return /^[0-9a-f-]{36}$/.test(id) ? serverRpc<Card>("result_card", { p_play: id }) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  const who = card?.nickname ?? "En kompis";
  const title = card ? `${who} satte ${card.score} av 11 på dagens straffpunkt` : "Straffpunkten";
  return {
    title,
    description: "Klarar du fler? Elva fotbollsfrågor, 20 sekunder per skott, en chans per dag.",
    openGraph: { title, description: "Klarar du fler? Elva fotbollsfrågor, en chans per dag.", images: [`/api/card/${id}`] },
    twitter: { card: "summary_large_image", title, images: [`/api/card/${id}`] },
  };
}

/** Landningssida för delade resultat: visar resultatet och utmanar mottagaren att spela. */
export default async function SharedResult({ params }: Props) {
  const { id } = await params;
  const card = await getCard(id);
  return (
    <main className="page">
      <div className="scene bleed"><Pitch /></div>
      <div className="hero">
        <span className="kicker">Utmaning</span>
        <h1>{card ? `${card.score} av 11` : "Straffpunkten"}</h1>
        <p>
          {card
            ? `${card.nickname ?? "En kompis"} satte ${card.score} straffar på dagens straffpunkt${card.players > 1 && card.beaten_pct != null ? ` och slog ${card.beaten_pct} % av alla som spelat` : ""}. Klarar du fler?`
            : "Elva fotbollsfrågor varje dag. Klarar du alla?"}
        </p>
      </div>
      {card && (
        <Kicks results={card.results} big />
      )}
      <Link href="/" className="btn wide">Ta dagens straffar</Link>
      <p className="note">Elva frågor från lätt till svår. 20 sekunder per skott. Samma frågor för alla, en chans per dag.</p>
    </main>
  );
}
