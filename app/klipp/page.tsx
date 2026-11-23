import type { Metadata } from "next";
import { Ball, Pitch } from "@/components/Pitch";
import { serverRpc } from "@/lib/server";
import { addDays, todaySE } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dagens klipp – Straffpunkten", robots: { index: false, follow: false } };

type Clip = {
  day: string; index: number; category: string; difficulty: number; q: string; options: string[];
  answer: number; fact: string; pct: number | null; answered_by: number;
};

const KEYS = ["A", "B", "C", "D"];

/** Håller ihop siffror kring tankstreck, så att "8–0" inte bryts över två rader. */
const keep = (t: string) => t.replace(/(\d)\s*–\s*(\d)/g, "$1\u2060–\u2060$2");

/** Kroken överst. En andel används bara när minst 20 svarat (se clip_question); annars en utmaning utan påståenden. */
function hook(c: Clip): string {
  if (c.pct != null && c.pct < 50) return `Bara ${c.pct} % klarade den här`;
  return "Klarar du den här på 5 sekunder?";
}

/**
 * Dagens klipp för TikTok och Reels, 1080×1920 och 15 sekunder, byggt för räckvidd:
 * frågan syns från första bildrutan, nedräkning 5–1 med uppmaning att svara i kommentarerna, skottet och
 * svaret efter 5 sekunder, sedan uppmaningen. Viktig text hålls borta från högerkanten och nederkanten där
 * appens knappar och bildtext ligger. Allt rör sig med CSS-animationer med fasta tider, så att
 * scripts/klipp.mjs kan spela in bildruta för bildruta.
 *
 *   /klipp            gårdagens bästa klippfråga
 *   /klipp?dag=…      en viss avslutad dag
 *   /klipp?id=…       en viss fråga som redan spelats (för att förhandsgranska)
 */
export default async function Klipp({ searchParams }: { searchParams: Promise<{ dag?: string; id?: string }> }) {
  const { dag, id } = await searchParams;
  const day = dag && /^\d{4}-\d{2}-\d{2}$/.test(dag) ? dag : addDays(todaySE(), -1);
  const clip = id && /^\d+$/.test(id)
    ? await serverRpc<Clip>("clip_by_id", { p_game: "straffpunkten", p_id: Number(id) })
    : await serverRpc<Clip>("clip_question", { p_game: "straffpunkten", p_day: day });
  if (!clip) return <main className="page"><p className="empty">Ingen fråga att visa.</p></main>;

  const right = clip.options[clip.answer];
  const data = { day: clip.day, id: id ?? null, q: clip.q, answer: right, hook: hook(clip), pct: clip.pct, answered_by: clip.answered_by, category: clip.category };
  return (
    <div className="clip-stage" data-ready="1">
      <script id="clip-data" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />

      <header className="clip-top">
        <p className="clip-hook">{hook(clip)}</p>
        <p className="clip-sub">Svara i kommentarerna innan bollen går in</p>
      </header>

      <div className="clip-scene">
        <Pitch shot="goal" target={clip.answer} compact />
        <div className="clip-count" aria-hidden="true">
          {[5, 4, 3, 2, 1].map((n, i) => <b key={n} style={{ animationDelay: `${0.3 + i}s` }}>{n}</b>)}
        </div>
        <div className="clip-timer"><i /></div>
        <p className="clip-stamp">Mål!</p>
        <p className="clip-answer"><b>{right}.</b> {keep(clip.fact)}</p>
      </div>

      <section className="clip-card">
        <div className="clip-band"><span>{clip.category}</span><span className="clip-brand"><Ball size={34} id="cl" />Straffpunkten</span></div>
        <h1>{keep(clip.q)}</h1>
        <div className="clip-opts">
          {clip.options.map((o, i) => (
            <div key={i} className={`clip-opt ${i === clip.answer ? "right" : "wrong"}`}>
              <span className="key">{KEYS[i]}</span><span className="txt">{o}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="clip-end">
        <p className="clip-end-title">Klarar du dagens 11 frågor?</p>
        <p className="clip-end-sub">Gratis. Ingen app. Länk i bio.</p>
        <p className="clip-end-club">Vilket lag håller du på? Skriv i kommentarerna.</p>
      </div>
    </div>
  );
}
