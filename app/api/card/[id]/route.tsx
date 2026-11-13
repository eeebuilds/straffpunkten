import { ImageResponse } from "next/og";
import { serverRpc, type Card } from "@/lib/server";
import { PATCHES, SEAMS } from "@/components/Pitch";

export const runtime = "nodejs";

const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

const ball = (id: string) =>
  `<clipPath id="${id}"><circle r="20"/></clipPath><circle r="20" fill="#F6F7F2"/>` +
  `<g clip-path="url(#${id})" fill="#0B1A12">${PATCHES.map(p => `<polygon points="${p}"/>`).join("")}</g>` +
  `<circle r="19.4" fill="none" stroke="#0B1A12" stroke-width="1.2"/>` +
  `<path d="${SEAMS}" stroke="#0B1A12" stroke-width="1" stroke-opacity="0.55" fill="none"/>`;

const svgUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const BALL = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-21 -21 42 42">${ball("b")}</svg>`);
const MISS = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9.5" fill="#FF6B57"/><path d="M6.5 6.5l7 7m0-7l-7 7" stroke="#06120D" stroke-width="2.2" stroke-linecap="round"/></svg>`
);
const OPEN = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#14301F"/></svg>`);

/** Planen under strålkastarna med bollen uppe i krysset, samma bild som i spelet. */
const SCENE = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 20 310 300" width="620" height="630" preserveAspectRatio="xMidYMid slice">
  <defs>
    <pattern id="net" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0L7 7M7 0L0 7" stroke="#F3F5EF" stroke-opacity="0.3" stroke-width="0.8"/></pattern>
    <radialGradient id="flood" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4C8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="-400" width="1190" height="330" fill="#06120D"/>
  <rect x="-400" y="64" width="1190" height="76" fill="#0B1E16"/>
  <path d="M-400 82H790M-400 100H790M-400 118H790" stroke="#13301F"/>
  <circle cx="60" cy="22" r="120" fill="url(#flood)" opacity="0.7"/>
  <circle cx="330" cy="22" r="120" fill="url(#flood)" opacity="0.7"/>
  ${[[140, 12, 0], [152, 14, 1], [166, 17, 0], [183, 20, 1], [203, 24, 0], [227, 29, 1], [256, 35, 0], [291, 39, 1]]
    .map(([y, h, b]) => `<rect x="-400" y="${y}" width="1190" height="${h}" fill="${b ? "#22703F" : "#1B5C34"}"/>`).join("")}
  <g stroke="#F3F5EF" stroke-opacity="0.75" stroke-width="2" fill="none">
    <path d="M-400 140H790"/><path d="M92 140L80 162H310L298 140"/><path d="M40 140L4 226H386L350 140"/><path d="M150 226Q195 250 240 226"/>
  </g>
  <ellipse cx="195" cy="294" rx="4" ry="2" fill="#F3F5EF" fill-opacity="0.8"/>
  <rect x="104" y="78" width="182" height="62" fill="#0A1A12"/>
  <rect x="104" y="78" width="182" height="62" fill="url(#net)"/>
  <path d="M104 78L120 90H270L286 78M120 90V130M270 90V130" stroke="#F3F5EF" stroke-opacity="0.4" stroke-width="1.2" fill="none"/>
  <path d="M195 290Q228 170 262 98" stroke="#FFD23F" stroke-opacity="0.85" stroke-width="2.4" stroke-dasharray="2 7" stroke-linecap="round" fill="none"/>
  <g transform="translate(262 98) scale(0.62)">${ball("s")}</g>
  <path d="M104 140V78H286V140" stroke="#F6F7F2" stroke-width="5" stroke-linecap="square" fill="none"/>
</svg>`);

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

/** Delningsbild 1200×630: siffran, elva bollar och planen med bollen i nätet. Används som delad bild och som förhandsvisning av länkar. */
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

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#06120D", color: "#F3F5EF", fontFamily: fonts.length ? "Archivo" : "sans-serif" }}>
        <div style={{ width: 640, height: "100%", display: "flex", flexDirection: "column", padding: "52px 0 48px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src={BALL} width={40} height={40} alt="" />
            <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>Straffpunkten</span>
          </div>
          <span style={{ marginTop: 34, fontSize: 24, fontWeight: 700, color: "#9FB8A8" }}>{`Dagens straffpunkt · ${date}`}</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 6 }}>
            <span style={{ fontSize: 190, fontWeight: 900, lineHeight: 0.9, letterSpacing: -8 }}>{String(score)}</span>
            <span style={{ fontSize: 48, fontWeight: 900, color: "#9FB8A8", paddingBottom: 20 }}>av 11</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 26 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <img key={i} src={results[i] === true ? BALL : results[i] === false ? MISS : OPEN} width={42} height={42} alt="" />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, gap: 2 }}>
            {card?.nickname ? <span style={{ fontSize: 28, fontWeight: 900 }}>{card.nickname}</span> : null}
            <span style={{ fontSize: 22, fontWeight: 700, color: "#C9D6CD" }}>{beaten}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 4 }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: "#FFD23F" }}>Klarar du fler?</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#9FB8A8" }}>straffpunkten.vercel.app</span>
          </div>
        </div>
        <img src={SCENE} width={560} height={630} alt="" style={{ objectFit: "cover" }} />
      </div>
    ),
    { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": "public, max-age=300" } }
  );
}
