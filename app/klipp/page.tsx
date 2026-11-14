import type { Metadata } from "next";
import { Ball, Pitch } from "@/components/Pitch";
import { serverRpc } from "@/lib/server";
import { addDays, prettyDay, todaySE } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dagens klipp – Straffpunkten", robots: { index: false, follow: false } };

type Clip = {
  day: string; index: number; category: string; difficulty: number; q: string; options: string[];
  answer: number; fact: string; pct: number | null; answered_by: number;
};

const KEYS = ["A", "B", "C", "D"];
const LEVEL = ["", "lätt", "medel", "svår"];

/** Rubriken i klippet. Andelen visas bara när tillräckligt många svarat (se clip_question). */
function verdict(c: Clip): string {
  if (c.pct == null) return "Klarar du den?";
  if (c.pct === 0) return "Ingen av gårdagens spelare visste";
  if (c.pct < 50) return `Bara ${c.pct}\u00a0% visste`;
  return `${c.pct}\u00a0% visste`;
}

/**
 * Dagens klipp, 1080×1920 och 12 sekunder: gårdagens svåraste fråga, skottet, rätt svar och uppmaningen.
 * Allt rör sig med CSS-animationer med fasta fördröjningar, så att scripts/klipp.mjs kan spela in bildruta för bildruta.
 */
export default async function Klipp({ searchParams }: { searchParams: Promise<{ dag?: string }> }) {
  const { dag } = await searchParams;
  const day = dag && /^\d{4}-\d{2}-\d{2}$/.test(dag) ? dag : addDays(todaySE(), -1);
  const clip = await serverRpc<Clip>("clip_question", { p_game: "straffpunkten", p_day: day });
  if (!clip) return <main className="page"><p className="empty">Ingen avslutad omgång för {day}.</p></main>;

  const data = { day: clip.day, q: clip.q, answer: clip.options[clip.answer], verdict: verdict(clip), pct: clip.pct, answered_by: clip.answered_by };
  return (
    <div className="clip-stage" data-ready="1">
      <script id="clip-data" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <header className="clip-top clip-in" style={{ animationDelay: "0s" }}>
        <span className="clip-brand"><Ball size={64} id="cl" /><b>Straffpunkten</b></span>
        <span className="clip-kicker">Gårdagens svåraste straff · {prettyDay(clip.day, false)}</span>
      </header>

      <div className="clip-scene clip-in" style={{ animationDelay: ".15s" }}>
        <Pitch shot="goal" target={clip.answer} />
        <div className="clip-timer"><i /></div>
      </div>

      <section className="clip-card clip-in" style={{ animationDelay: ".45s" }}>
        <div className="clip-band"><span>Straff {clip.index + 1} av 11</span><span>{clip.category} · {LEVEL[clip.difficulty]}</span></div>
        <h1>{clip.q}</h1>
        <div className="clip-opts">
          {clip.options.map((o, i) => (
            <div key={i} className={`clip-opt ${i === clip.answer ? "right" : "wrong"}`} style={{ ["--d" as string]: `${0.9 + i * 0.12}s` }}>
              <span className="key">{KEYS[i]}</span><span className="txt">{o}</span>
            </div>
          ))}
        </div>
      </section>

      {clip.fact && (
        <p className="clip-fact"><b>Visste du?</b> {clip.fact}</p>
      )}

      <p className="clip-verdict">{verdict(clip)}</p>

      <div className="clip-end">
        <Ball size={180} id="ce" />
        <p className="clip-end-title">Klarar du dagens elva?</p>
        <p className="clip-end-sub">Elva straffar. 20 sekunder per skott. Samma frågor för alla.</p>
        <p className="clip-end-url">straffpunkten.vercel.app</p>
      </div>
    </div>
  );
}
