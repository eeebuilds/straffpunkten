"use client";
import { useEffect, useState } from "react";
import { rpc, GAME } from "@/lib/sb";
import { secs } from "@/lib/dates";

type DayRow = { rank: number; nickname: string; score: number; duration_ms: number; is_me: boolean };
type WeekRow = { rank: number; nickname: string; score: number; days: number; is_me: boolean };

export function DayBoard({ day, league, limit = 50, refresh = 0 }: { day: string; league?: string | null; limit?: number; refresh?: number }) {
  const [rows, setRows] = useState<DayRow[] | null>(null);
  useEffect(() => {
    setRows(null);
    rpc<DayRow[]>("leaderboard_day", { p_game: GAME, p_day: day, p_league: league ?? null, p_limit: limit })
      .then(setRows, () => setRows([]));
  }, [day, league, limit, refresh]);
  if (!rows) return <p className="empty">Hämtar topplistan…</p>;
  if (!rows.length) return <p className="empty">Ingen på listan än idag. Bli först.</p>;
  return (
    <table className="table">
      <thead><tr><th>#</th><th>Spelare</th><th className="r">Tid</th><th className="r">Mål</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.is_me ? "me" : undefined}>
            <td className="pos">{r.rank}</td>
            <td className="name">{r.nickname}</td>
            <td className="r">{secs(r.duration_ms)}</td>
            <td className="r score">{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WeekBoard({ monday, league, limit = 50 }: { monday: string; league?: string | null; limit?: number }) {
  const [rows, setRows] = useState<WeekRow[] | null>(null);
  useEffect(() => {
    setRows(null);
    rpc<WeekRow[]>("leaderboard_week", { p_game: GAME, p_monday: monday, p_league: league ?? null, p_limit: limit })
      .then(setRows, () => setRows([]));
  }, [monday, league, limit]);
  if (!rows) return <p className="empty">Hämtar topplistan…</p>;
  if (!rows.length) return <p className="empty">Ingen har spelat den här veckan än.</p>;
  return (
    <table className="table">
      <thead><tr><th>#</th><th>Spelare</th><th className="r">Dagar</th><th className="r">Mål</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.is_me ? "me" : undefined}>
            <td className="pos">{r.rank}</td>
            <td className="name">{r.nickname}</td>
            <td className="r">{r.days}/7</td>
            <td className="r score">{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type AllRow = { rank: number; nickname: string; score: number; days: number; avg: number | null; is_me: boolean };

/** Topplista över alla dagar: flest mål totalt, vid lika högst snitt. */
export function AllBoard({ league, limit = 50, refresh = 0 }: { league?: string | null; limit?: number; refresh?: number }) {
  const [rows, setRows] = useState<AllRow[] | null>(null);
  useEffect(() => {
    setRows(null);
    rpc<AllRow[]>("leaderboard_all", { p_game: GAME, p_league: league ?? null, p_limit: limit })
      .then(setRows, () => setRows([]));
  }, [league, limit, refresh]);
  if (!rows) return <p className="empty">Hämtar topplistan…</p>;
  if (!rows.length) return <p className="empty">Ingen har tagit plats på listan än. Välj ett smeknamn så hamnar du här.</p>;
  return (
    <table className="table">
      <thead><tr><th>#</th><th>Spelare</th><th className="r">Dagar</th><th className="r">Snitt</th><th className="r">Mål</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.is_me ? "me" : undefined}>
            <td className="pos">{r.rank}</td>
            <td className="name">{r.nickname}</td>
            <td className="r">{r.days}</td>
            <td className="r">{r.avg != null ? String(r.avg).replace(".", ",") : "–"}</td>
            <td className="r score">{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
