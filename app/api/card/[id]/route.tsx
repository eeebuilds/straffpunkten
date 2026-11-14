import { ImageResponse } from "next/og";
import { svgString } from "@/lib/svgString";
import { serverRpc, type Card } from "@/lib/server";
import { Ball, Pitch } from "@/components/Pitch";

export const runtime = "nodejs";

const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

const svgUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
/** Samma plan och boll som i spelet, renderade till bilder. Bollen sitter i krysset. */
const SCENE = svgUrl(
  svgString(<Pitch shot="goal" target={1} still />)
    .replace('width="100%"', 'width="470" height="562"')
    .replace('preserveAspectRatio="xMidYMid meet"', 'preserveAspectRatio="xMidYMid slice"')
    .replace(/ style="[^"]*"/, "")
);
const BALL = svgUrl(svgString(<Ball size={44} id="cb" />).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));

/** Archivo hämtas från Google Fonts; går det inte används standardtypsnittet. */
async function font(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,${weight}&display=swap`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

function kickImg(r: boolean | undefined) {
  if (r === true) return BALL;
  const inner = r === false
    ? '<circle cx="11" cy="11" r="9.5" fill="#B6422F" stroke="#1E2A22" stroke-width="1.5"/><path d="M7.5 7.5l7 7m0-7l-7 7" stroke="#F4EBD9" stroke-width="2.2" stroke-linecap="round"/>'
    : '<circle cx="11" cy="11" r="9" fill="none" stroke="#B9A57E" stroke-width="1.5" stroke-dasharray="2 2.5"/>';
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="44" height="44">${inner}</svg>`);
}

/** Delningsbild 1200×630 i matchprogramstil: sifferskylt, elva bollar och planen med bollen i krysset. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = /^[0-9a-f-]{36}$/.test(id) ? await serverRpc<Card>("result_card", { p_play: id }) : null;
  const score = card?.score ?? 0;
  const results = card?.results ?? [];
  const d = card ? new Date(card.day + "T12:00:00Z") : new Date();
  const date = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  const beaten = card && card.players > 1 && card.beaten_pct != null ? `Bättre än ${card.beaten_pct} % av dagens spelare` : "Dagens fotbollsquiz";
  const [heavy, bold] = await Promise.all([font(900), font(700)]);
  const fonts = [
    ...(heavy ? [{ name: "Archivo", data: heavy, weight: 900 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Archivo", data: bold, weight: 700 as const, style: "normal" as const }] : []),
  ];
  const ink = "#1E2A22";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F4EBD9", color: ink, padding: 34, gap: 30, fontFamily: fonts.length ? "Archivo" : "sans-serif" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={BALL} width={38} height={38} alt="" />
            <span style={{ fontSize: 30, fontWeight: 900, textTransform: "uppercase" }}>Straffpunkten</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24, padding: 22, gap: 16, background: "#1F5A3A", color: "#F4EBD9", border: `3px solid ${ink}`, borderRadius: 20, boxShadow: `6px 6px 0 ${ink}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700 }}>
              <span>Dagens straffpunkt</span>
              <span>{date}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 130, height: 150, padding: "0 14px", background: "#F4EBD9", color: ink, borderRadius: 14, position: "relative" }}>
                <span style={{ fontSize: 132, fontWeight: 900, lineHeight: 1 }}>{String(score)}</span>
                <div style={{ position: "absolute", left: 0, right: 0, top: 74, height: 3, background: "#1F5A3A", display: "flex" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900 }}>av 11</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#DDEBD3" }}>{card?.nickname ?? "Klarar du fler?"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, padding: 10, background: "#F4EBD9", borderRadius: 12 }}>
              {Array.from({ length: 11 }, (_, i) => <img key={i} src={kickImg(results[i])} width={40} height={40} alt="" />)}
            </div>
          </div>
          <span style={{ marginTop: 22, fontSize: 24, fontWeight: 700 }}>{beaten}</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "auto" }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#1F5A3A" }}>Klarar du fler?</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#5B5A48" }}>straffpunkten.vercel.app</span>
          </div>
        </div>
        <div style={{ display: "flex", width: 470, height: 562, border: `3px solid ${ink}`, borderRadius: 20, overflow: "hidden", boxShadow: `6px 6px 0 ${ink}` }}>
          <img src={SCENE} width={470} height={562} alt="" style={{ objectFit: "cover" }} />
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": "public, max-age=300" } }
  );
}
