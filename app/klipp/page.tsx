import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Ball, Pitch } from "@/components/Pitch";
import { serverRpc } from "@/lib/server";
import { addDays, todaySE } from "@/lib/dates";
import { HOOKS, PITCH_LINES, SCALE, SERIES, TAGS } from "@/lib/clipCopy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Klipp – Straffpunkten", robots: { index: false, follow: false } };

type Clip = {
  id?: number; day: string; index: number; category: string; difficulty: number; q: string; options: string[];
  answer: number; fact: string; pct: number | null; answered_by: number;
};

const KEYS = ["A", "B", "C", "D"];
const SITE = "straffpunkten.vercel.app";

/** Håller ihop siffror kring tankstreck, så att "8–0" inte bryts över två rader. */
const keep = (t: string) => t.replace(/(\d)\s*–\s*(\d)/g, "$1⁠–⁠$2");

/** Krok för en enskild fråga: handskriven, annars andelen som klarade den (minst 20 svar), annars kompisvinkeln. */
function hook(c: Clip, id?: number): string {
  if (id && HOOKS[id]) return HOOKS[id];
  if (c.pct != null && c.pct < 50) return `Bara ${c.pct} % klarade den här. Gör du?`;
  return "Kan du mer fotboll än dina kompisar?";
}

const tags = (extra: string) => ["#fotboll", "#fotbollsquiz", extra, "#quiz", "#straffpunkten"].join(" ");

/** En fråga: planen, kortet och svaret. `s` är när den syns och `t` när skottet går. */
function Slot({ c, s, t, first, last = true, label }: { c: Clip; s: number; t: number; first: boolean; last?: boolean; label?: string }) {
  const right = c.options[c.answer];
  return (
    <div className={`clip-slot${first ? " first" : ""}${last ? " last" : ""}`} style={{ "--s": `${s}s`, "--t": `${t}s`, "--think": `${t - s}s` } as CSSProperties}>
      <div className="clip-scene">
        <Pitch shot="goal" target={c.answer} compact uid={`s${Math.round(s * 10)}-`} />
        <div className="clip-timer"><i /></div>
        <p className="clip-stamp">Mål!</p>
        <p className="clip-answer"><b>{right}.</b> {keep(c.fact)}</p>
      </div>
      <section className="clip-card">
        <div className="clip-band"><span>{label ?? c.category}</span><span className="clip-brand"><Ball size={34} id={`cl${s}`} />Straffpunkten</span></div>
        <h1>{keep(c.q)}</h1>
        <div className="clip-opts">
          {c.options.map((o, i) => (
            <div key={i} className={`clip-opt ${i === c.answer ? "right" : "wrong"}`}>
              <span className="key">{KEYS[i]}</span><span className="txt">{o}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Slutkortet: vad spelet är, kompisligan och var man hittar det. */
function Pitchline() {
  return (
    <>
      <p className="clip-end-title">Ett nytt fotbollsquiz varje dag</p>
      <p className="clip-end-line">11 frågor om dagen, samma för alla. <b>Som Wordle, fast fotboll.</b></p>
      <p className="clip-end-line">Starta en liga och se vem i gänget som kan mest.</p>
      <p className="clip-end-cta">Spela gratis: {SITE}</p>
    </>
  );
}

/**
 * Klipp för TikTok och Reels i 1080×1920. Kroken handlar om kunskap, inte tid: frågan syns från första
 * bildrutan, tittaren uppmanas skriva sitt svar i kommentarerna, sedan går skottet in och svaret visas.
 * Slutkortet förklarar spelet och säljer kompisligan. Viktig text hålls inom x 60–930 och y 110–1520,
 * där appens knappar och bildtext inte ligger. Allt rör sig med CSS-animationer med fasta tider, så att
 * scripts/klipp.mjs kan spela in bildruta för bildruta.
 *
 *   /klipp               gårdagens bästa klippfråga
 *   /klipp?dag=…         en viss avslutad dag
 *   /klipp?id=…          en viss fråga som redan spelats
 *   /klipp?serie=…       tre frågor och en resultatskala (se lib/clipCopy.ts)
 */
export default async function Klipp({ searchParams }: { searchParams: Promise<{ dag?: string; id?: string; serie?: string }> }) {
  const { dag, id, serie } = await searchParams;
  const series = serie ? SERIES[serie] : undefined;

  if (series) {
    const qs = await Promise.all(series.ids.map(i => serverRpc<Clip>("clip_by_id", { p_game: "straffpunkten", p_id: i })));
    if (qs.some(q => !q)) return <main className="page"><p className="empty">En av frågorna har inte spelats än.</p></main>;
    const clips = qs as Clip[];
    // Första frågan får längst betänketid, eftersom rubriken också ska läsas.
    const starts = [0, 7.6, 14.1], shots = [5.4, 11.8, 18.3], end = 20.6, seconds = 29;
    const data = {
      name: `klipp-serie-${serie}`, seconds,
      caption: `${series.title}. Hur många fick du? Skriv i kommentarerna 👇\n\n${PITCH_LINES}\n\n${tags(series.tag)}`,
    };
    return (
      <div className="clip-stage" data-ready="1" style={{ "--end": `${end}s` } as CSSProperties}>
        <script id="clip-data" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
        <header className="clip-top">
          <p className="clip-hook">{series.title}</p>
          <p className="clip-sub">Hur många klarar du? Räkna dina rätt. Inget googlande.</p>
        </header>
        <div className="clip-slots">
          {clips.map((c, i) => (
            <Slot key={i} c={c} s={starts[i]} t={shots[i]} first={i === 0} last={i === clips.length - 1} label={`Fråga ${i + 1} av 3`} />
          ))}
        </div>
        <div className="clip-end full">
          <p className="clip-end-kicker">Hur många fick du?</p>
          <ol className="clip-scale">
            {SCALE.map(([k, v]) => <li key={k}><b>{k}</b><span>{v}</span></li>)}
          </ol>
          <p className="clip-end-ask">Skriv ditt resultat i kommentarerna 👇</p>
          <Pitchline />
        </div>
      </div>
    );
  }

  const day = dag && /^\d{4}-\d{2}-\d{2}$/.test(dag) ? dag : addDays(todaySE(), -1);
  const qid = id && /^\d+$/.test(id) ? Number(id) : undefined;
  const clip = qid
    ? await serverRpc<Clip>("clip_by_id", { p_game: "straffpunkten", p_id: qid })
    : await serverRpc<Clip>("clip_question", { p_game: "straffpunkten", p_day: day });
  if (!clip) return <main className="page"><p className="empty">Ingen fråga att visa.</p></main>;

  const h = hook(clip, qid);
  const shot = 6.5, end = 11.6, seconds = 18;
  const data = {
    name: qid ? `klipp-fraga-${qid}` : `klipp-${clip.day}`, day: clip.day, seconds,
    caption: `${qid && HOOKS[qid] ? (h.endsWith("?") ? h : `${h} ${clip.q}`) : clip.q} Skriv ditt svar i kommentarerna, inget googlande 👇\n\n${PITCH_LINES}\n\n${tags(TAGS[clip.category] || "#fotbollstiktok")}`,
  };
  return (
    <div className="clip-stage" data-ready="1" style={{ "--end": `${end}s` } as CSSProperties}>
      <script id="clip-data" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <header className="clip-top">
        <p className="clip-hook">{keep(h)}</p>
        <p className="clip-sub">Skriv ditt svar i kommentarerna. Inget googlande.</p>
      </header>
      <div className="clip-slots"><Slot c={clip} s={0} t={shot} first /></div>
      <div className="clip-end">
        <Pitchline />
      </div>
    </div>
  );
}
