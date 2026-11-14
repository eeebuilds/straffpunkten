"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { rpc, GAME } from "@/lib/sb";
import { guestId, lsGet, lsSet } from "@/lib/local";
import { track } from "@/lib/track";
import { CLUBS, OTHER, clubName } from "@/lib/clubs";

/**
 * Spelarens lag. Gäster sparar det i webbläsaren, inloggade även i profilen.
 * Dagens spel kopplas till laget när det väljs (eller direkt om det redan är valt).
 */
export function useClub(ready: boolean) {
  const [club, setLocal] = useState<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const local = lsGet<string>("club");
    setLocal(local);
    rpc<string | null>("set_club", { p_game: GAME, p_guest: guestId(), p_club: local }).then(c => {
      if (c && c !== local) { lsSet("club", c); setLocal(c); }
    }, () => {});
  }, [ready]);
  const choose = useCallback(async (c: string) => {
    lsSet("club", c);
    setLocal(c);
    track("club_pick", { club: c });
    try { await rpc("set_club", { p_game: GAME, p_guest: guestId(), p_club: c }); } catch {}
  }, []);
  return { club, choose };
}

export function ClubPicker({ club, onChoose, id = "club" }: { club: string | null; onChoose: (c: string) => void; id?: string }) {
  return (
    <div className="club-pick">
      <label htmlFor={id}>{club ? "Du spelar för" : "Vilket lag håller du på?"}</label>
      <select id={id} value={club ?? ""} onChange={e => e.target.value && onChoose(e.target.value)}>
        <option value="" disabled>Välj ditt lag</option>
        {CLUBS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        <option value={OTHER.id}>{OTHER.name}</option>
      </select>
      <span className="note">
        {club ? "Ditt resultat räknas för laget i supportertabellen. Byter du lag gäller det från nästa omgång." : "Ditt resultat räknas för laget i dagens supportertabell."}
      </span>
    </div>
  );
}

export type ClubRow = { rank: number; club: string; players: number; avg: number; goals: number };
type Row = ClubRow;

/** Dagens supportertabell: vilka supportrar kan mest fotboll? */
export function ClubTable({ day, mine, limit = 30, refresh = 0, onRows }: { day: string; mine?: string | null; limit?: number; refresh?: number; onRows?: (rows: Row[]) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    setRows(null);
    rpc<Row[]>("club_table", { p_game: GAME, p_day: day }).then(r => { setRows(r); onRows?.(r); }, () => setRows([]));
    // onRows ändras inte mellan renderingar på ett sätt som ska hämta om tabellen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, refresh]);
  if (!rows) return <p className="empty">Hämtar supportertabellen…</p>;
  if (!rows.length) return <p className="empty">Inget lag på tabellen än i dag. Välj ditt lag och sätt det först.</p>;
  const leader = rows[0];
  const me = mine ? rows.find(r => r.club === mine) : undefined;
  return (
    <>
      <p className="club-lead">
        <b>{clubName(leader.club)}</b> leder med {String(leader.avg).replace(".", ",")} mål i snitt
        {me && me.club !== leader.club && <>. {clubName(me.club)} ligger {me.rank}:a</>}.
      </p>
      <table className="table">
        <thead><tr><th>#</th><th>Lag</th><th className="r">Spelare</th><th className="r">Snitt</th></tr></thead>
        <tbody>
          {rows.slice(0, limit).map(r => (
            <tr key={r.club} className={r.club === mine ? "mine" : undefined}>
              <td className="pos">{r.rank}</td>
              <td className="name">{clubName(r.club)}</td>
              <td className="r">{r.players}</td>
              <td className="r score">{String(r.avg).replace(".", ",")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > limit && <p className="note"><Link href="/topplista?flik=lag">Hela supportertabellen</Link></p>}
    </>
  );
}
