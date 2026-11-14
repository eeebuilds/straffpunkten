import type { Metadata } from "next";
import Link from "next/link";
import { serverRpc, type Card } from "@/lib/server";
import { Kicks, Pitch } from "@/components/Pitch";
import LeaguePitch from "@/components/LeaguePitch";
import { prettyDay, todaySE } from "@/lib/dates";

type Props = { params: Promise<{ id: string }> };

async function getCard(id: string) {
  return /^[0-9a-f-]{36}$/.test(id) ? serverRpc<Card>("result_card", { p_play: id }) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  const who = card?.nickname ?? "En kompis";
  const title = card ? `${who} fick ${card.score} av 11 den ${prettyDay(card.day, false)}. Slår du det?` : "Vem kan mest fotboll i kompisgänget?";
  return {
    title,
    description: "Spela dagens quiz och utmana gänget i en egen liga. Elva frågor, en chans per dag.",
    openGraph: { title, description: "Vem kan mest fotboll i kompisgänget? Samma quiz. Egen liga.", images: [`/api/card/${id}`] },
    twitter: { card: "summary_large_image", title, images: [`/api/card/${id}`] },
  };
}

/** Landningssida för delade resultat: visar resultatet och utmanar mottagaren att spela. */
export default async function SharedResult({ params }: Props) {
  const { id } = await params;
  const card = await getCard(id);
  const isToday = card?.day === todaySE();
  return (
    <main className="page">
      <div className="scene"><Pitch /></div>
      <div className="hero">
        <span className="kicker">{card ? `Kompisutmaning · ${prettyDay(card.day, false)}` : "Kompisutmaning"}</span>
        <h1>{card ? `${card.score} av 11` : "Straffpunkten"}</h1>
        <p>
          {card
            ? `${card.nickname ?? "En kompis"} satte ${card.score} av 11${isToday ? " i dag. Slår du det?" : `. Resultatet är från ${prettyDay(card.day, false)}. Spela dagens quiz och skicka din egen utmaning.`}`
            : "Vem kan mest fotboll i kompisgänget? Börja med dagens elva frågor."}
        </p>
      </div>
      {card && (
        <Kicks results={card.results} big />
      )}
      <Link href="/?utm_source=utmaning&utm_medium=delning&utm_campaign=kompisutmaning" className="btn wide">{isToday ? "Försök slå resultatet" : "Spela dagens 11 frågor"}</Link>
      <p className="note">Elva frågor från lätt till svår. 20 sekunder per skott. Samma frågor för alla, en chans per dag.</p>
      <LeaguePitch source="shared" />
    </main>
  );
}
