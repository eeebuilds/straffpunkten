"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { rpc, GAME } from "@/lib/sb";
import { shortDay } from "@/lib/dates";
import { useSession } from "@/components/useSession";

type Day = {
  d: string; players: number; finished: number; new_players: number; avg_score: number | null;
  with_club: number; share_click: number; share_done: number; signups: number; league_events: number;
};
type Cohort = { d: string; new_players: number; back_d1: number; back_w1: number; d1_ready: boolean; w1_ready: boolean };
type Stats = {
  today: string;
  totals: { players: number; finished: number; accounts: number; leagues: number; share_done: number };
  daily: Day[];
  cohorts: Cohort[];
};

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : "–");
const num = (n: number | null) => (n == null ? "–" : String(n).replace(".", ","));

/** Mätsidan: dagliga spelare, återkomst och delningar. Bara för admin-kontot. */
export default function Statistik() {
  const session = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!session) return;
    setStats(null);
    rpc<Stats>("admin_stats", { p_game: GAME, p_days: days }).then(setStats, e => setError(e instanceof Error ? e.message : "error"));
  }, [session, days]);

  if (session === undefined) return <main className="page"><p className="empty">Laddar…</p></main>;
  if (!session) return <main className="page"><div className="hero"><h1>Statistik</h1><p>Logga in med ditt konto för att se siffrorna.</p></div><Link className="btn wide" href="/konto">Logga in</Link></main>;
  if (error) return <main className="page"><div className="hero"><h1>Statistik</h1><p>{error === "forbidden" ? "Ditt konto har inte tillgång till statistiken." : "Kunde inte hämta statistiken."}</p></div></main>;
  if (!stats) return <main className="page"><p className="empty">Hämtar statistik…</p></main>;

  const today = stats.daily.find(x => x.d === stats.today);
  const active = stats.daily.filter(x => x.players > 0);
  // Staplarna börjar den första dagen någon spelade under perioden.
  const first = active.length ? active[active.length - 1].d : stats.today;
  const shown = stats.daily.filter(x => x.d >= first);
  const max = Math.max(1, ...stats.daily.map(x => x.players));
  const ready = stats.cohorts.filter(c => c.d1_ready);
  const d1 = ready.reduce((s, c) => s + c.back_d1, 0), d1n = ready.reduce((s, c) => s + c.new_players, 0);
  const readyW = stats.cohorts.filter(c => c.w1_ready);
  const w1 = readyW.reduce((s, c) => s + c.back_w1, 0), w1n = readyW.reduce((s, c) => s + c.new_players, 0);

  return (
    <main className="page stats-page">
      <div className="hero">
        <span className="kicker">Bara för dig</span>
        <h1>Statistik</h1>
        <p>Spelare räknas en gång per dag, med konto eller som gäst i en webbläsare. Delningar räknas från loggen och visar att någon delat, inte att mottagaren öppnat.</p>
      </div>

      <section className="stat-tiles" aria-label="Nyckeltal">
        <div className="stat"><span>Spelare idag</span><b>{today?.players ?? 0}</b><small>{today?.new_players ?? 0} nya</small></div>
        <div className="stat"><span>Spelade klart idag</span><b>{today?.finished ?? 0}</b><small>snitt {num(today?.avg_score ?? null)} mål</small></div>
        <div className="stat"><span>Tillbaka dagen efter</span><b>{pct(d1, d1n)}</b><small>{d1} av {d1n} nya spelare</small></div>
        <div className="stat"><span>Tillbaka inom en vecka</span><b>{pct(w1, w1n)}</b><small>{w1n ? `${w1} av ${w1n} nya spelare` : "Klart efter en vecka"}</small></div>
        <div className="stat"><span>Delningar idag</span><b>{today?.share_done ?? 0}</b><small>{today?.share_click ?? 0} tryck på dela</small></div>
        <div className="stat"><span>Totalt</span><b>{stats.totals.players}</b><small>spelare, {stats.totals.accounts} konton, {stats.totals.leagues} ligor</small></div>
      </section>

      <div className="tabs" role="group" aria-label="Period">
        {[7, 30, 90].map(n => <button key={n} aria-pressed={days === n} onClick={() => setDays(n)}>{n} dagar</button>)}
      </div>

      <section className="section">
        <div className="section-head"><h2>Spelare per dag</h2><span>Senaste {days} dagarna</span></div>
        {active.length === 0 ? <p className="empty">Inga spelare under perioden.</p> : (
          <div className="bars" role="list">
            {shown.map(x => (
              <div key={x.d} className="bar-row" role="listitem" title={`${shortDay(x.d)}: ${x.players} spelare, ${x.new_players} nya, ${x.finished} spelade klart`}>
                <span className="bar-day">{shortDay(x.d)}</span>
                <span className="bar-track">{x.players > 0 && <i style={{ width: `${(100 * x.players) / max}%` }} />}</span>
                <span className="bar-n">{x.players}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head"><h2>Återkomst</h2><span>Per dag för nya spelare</span></div>
        {stats.cohorts.length === 0 ? <p className="empty">Inga nya spelare att följa ännu.</p> : (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Första dag</th><th className="r">Nya</th><th className="r">Dagen efter</th><th className="r">Inom en vecka</th></tr></thead>
              <tbody>
                {stats.cohorts.map(c => (
                  <tr key={c.d}>
                    <td>{shortDay(c.d)}</td>
                    <td className="r">{c.new_players}</td>
                    <td className="r">{c.d1_ready ? `${pct(c.back_d1, c.new_players)} (${c.back_d1})` : `pågår (${c.back_d1})`}</td>
                    <td className="r">{c.w1_ready ? `${pct(c.back_w1, c.new_players)} (${c.back_w1})` : `pågår (${c.back_w1})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="note">"Pågår" betyder att perioden inte är slut än, så siffran kan växa.</p>
      </section>

      <section className="section">
        <div className="section-head"><h2>Dag för dag</h2></div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Dag</th><th className="r">Spelare</th><th className="r">Klara</th><th className="r">Nya</th><th className="r">Snitt</th><th className="r">Med lag</th><th className="r">Delat</th><th className="r">Konton</th><th className="r">Liga</th></tr></thead>
            <tbody>
              {active.map(x => (
                <tr key={x.d}>
                  <td>{shortDay(x.d)}</td>
                  <td className="r">{x.players}</td>
                  <td className="r">{x.finished}</td>
                  <td className="r">{x.new_players}</td>
                  <td className="r">{num(x.avg_score)}</td>
                  <td className="r">{x.with_club}</td>
                  <td className="r">{x.share_done}</td>
                  <td className="r">{x.signups}</td>
                  <td className="r">{x.league_events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Liga = händelser kring ligor (knapptryck, nya ligor, inbjudningar och anslutningar). Konton = slutförda registreringar.</p>
      </section>
    </main>
  );
}
