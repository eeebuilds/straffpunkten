"use client";
import { useEffect, useState } from "react";
import { DayBoard, WeekBoard } from "@/components/Leaderboard";
import { addDays, mondayOf, prettyDay, todaySE } from "@/lib/dates";
import { rpc, GAME } from "@/lib/sb";
import { useSession } from "@/components/useSession";

type League = { name: string; code: string; id?: string };

export default function Topplista() {
  const today = todaySE();
  const [tab, setTab] = useState<"day" | "week">("day");
  const [day, setDay] = useState(today);
  const [league, setLeague] = useState<string>("");
  const [leagues, setLeagues] = useState<(League & { id: string })[]>([]);
  const session = useSession();

  useEffect(() => {
    if (!session) return;
    rpc<League[]>("my_leagues", { p_game: GAME }).then(async ls => {
      const withIds = await Promise.all(ls.map(async l => ({ ...l, id: (await rpc<{ id: string }>("league_info", { p_code: l.code })).id })));
      setLeagues(withIds);
    }, () => {});
  }, [session]);

  const monday = mondayOf(day);
  return (
    <main className="page">
      <div className="hero">
        <span className="kicker">{tab === "day" ? prettyDay(day) : `Vecka från ${prettyDay(monday, false)}`}</span>
        <h1>Topplista</h1>
      </div>
      <div className="tabs" role="group" aria-label="Period">
        <button aria-pressed={tab === "day"} onClick={() => setTab("day")}>Dagen</button>
        <button aria-pressed={tab === "week"} onClick={() => setTab("week")}>Veckan</button>
      </div>
      <div className="btn-row" style={{ alignItems: "center" }}>
        <button className="btn line" onClick={() => setDay(addDays(day, tab === "day" ? -1 : -7))}>Föregående</button>
        <button className="btn line" disabled={day >= today} onClick={() => setDay(addDays(day, tab === "day" ? 1 : 7) > today ? today : addDays(day, tab === "day" ? 1 : 7))}>Nästa</button>
      </div>
      {leagues.length > 0 && (
        <div className="field">
          <label htmlFor="league">Visa</label>
          <select id="league" value={league} onChange={e => setLeague(e.target.value)}
            style={{ minHeight: 48, padding: "8px 10px", border: "2px solid var(--line)", borderRadius: 4, background: "var(--surface)" }}>
            <option value="">Alla spelare</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}
      {tab === "day" ? <DayBoard day={day} league={league || null} /> : <WeekBoard monday={monday} league={league || null} />}
      <p className="note">Flest mål vinner. Vid lika avgör den sammanlagda svarstiden. Bara spelare med konto syns på listan.</p>
    </main>
  );
}
