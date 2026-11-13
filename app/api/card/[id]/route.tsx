import { ImageResponse } from "next/og";
import { serverRpc, type Card } from "@/lib/server";

export const runtime = "nodejs";

const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

/** Delningsbild 1200×630: resultattavla med elva lampor. Används både som delad bild och som förhandsvisning av länkar. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = /^[0-9a-f-]{36}$/.test(id) ? await serverRpc<Card>("result_card", { p_play: id }) : null;
  const score = card?.score ?? 0;
  const results = card?.results ?? [];
  const d = card ? new Date(card.day + "T12:00:00Z") : new Date();
  const date = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  const beaten = card && card.players > 1 && card.beaten_pct != null ? `Bättre än ${card.beaten_pct} % av dagens ${card.players} spelare` : "Dagens fotbollsquiz · 11 frågor · 20 sekunder per skott";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#1d5b38", color: "#ffffff", padding: "56px 64px", fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", left: 600 - 260, top: -260, width: 520, height: 520, borderRadius: 520, border: "4px solid rgba(255,255,255,0.18)", display: "flex" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, height: 4, background: "rgba(255,255,255,0.18)", display: "flex" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 34, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
          <span>Straffpunkten</span>
          <span style={{ color: "#cfe3d6", fontWeight: 600 }}>{date}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginTop: 70 }}>
          <span style={{ fontSize: 230, fontWeight: 900, lineHeight: 0.8, color: "#f4d23a" }}>{score}</span>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#cfe3d6", paddingBottom: 6 }}>/ 11 mål</span>
          {card?.nickname ? <span style={{ fontSize: 40, fontWeight: 700, marginLeft: "auto", paddingBottom: 12 }}>{card.nickname}</span> : null}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 56, background: "#10170f", padding: "26px 28px", borderRadius: 10 }}>
          {Array.from({ length: 11 }, (_, i) => {
            const r = results[i];
            const bg = r === true ? "#47d17f" : r === false ? "#ff5a4a" : "#2a3326";
            return <div key={i} style={{ width: 72, height: 72, borderRadius: 72, background: bg, display: "flex" }} />;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 30, color: "#e6f0ea" }}>
          <span>{beaten}</span>
          <span style={{ fontWeight: 700 }}>straffpunkten.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=300" } }
  );
}
