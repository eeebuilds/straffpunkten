"use client";
import { use, useEffect, useState } from "react";
import { rpc } from "@/lib/sb";
import { useSession } from "@/components/useSession";
import SignupForm from "@/components/SignupForm";
import { AllBoard, DayBoard, WeekBoard } from "@/components/Leaderboard";
import { mondayOf, todaySE } from "@/lib/dates";
import { errorText } from "@/lib/errors";
import { track } from "@/lib/track";

type Info = { id: string; name: string; code: string; members: number; is_member: boolean };

export default function Liga({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const session = useSession();
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
  const [profile, setProfile] = useState<unknown>(undefined);
  const [tab, setTab] = useState<"day" | "week" | "all">("week");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const i = await rpc<Info | null>("league_info", { p_code: code }).catch(() => null);
    setInfo(i);
  }

  useEffect(() => {
    if (session === undefined) return;
    load();
    if (!session) return setProfile(null);
    rpc("get_profile").then(p => setProfile(p ?? null), () => setProfile(null));
  }, [session, code]); // eslint-disable-line react-hooks/exhaustive-deps

  async function join() {
    setError(null);
    try {
      await rpc("join_league", { p_code: code });
      track("league_join");
      load();
    } catch (e) { setError(errorText(e)); }
  }

  async function invite() {
    const url = `${location.origin}/liga/${code}`;
    const text = `Gå med i ${info?.name} på Straffpunkten. Elva fotbollsfrågor om dagen, vi tävlar om veckan.`;
    track("league_invite");
    try {
      if (navigator.share) return void (await navigator.share({ text, url }));
    } catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); setMsg("Länken är kopierad."); } catch { setMsg(url); }
  }

  if (info === undefined) return <main className="page"><p className="empty">Hämtar ligan…</p></main>;
  if (info === null) return <main className="page"><div className="hero"><h1>Hittade ingen liga</h1><p>Kontrollera koden <strong>{code}</strong> och försök igen.</p></div></main>;

  const today = todaySE();
  return (
    <main className="page">
      <div className="hero">
        <span className="kicker">Liga · {info.members} spelare · kod <span className="code" style={{ fontSize: "inherit" }}>{info.code}</span></span>
        <h1>{info.name}</h1>
      </div>

      {info.is_member ? (
        <div className="btn-row">
          <button className="btn yellow" onClick={invite}>Bjud in fler</button>
          <a className="btn line" href="/">Spela dagens</a>
        </div>
      ) : session && profile ? (
        <button className="btn wide" onClick={join}>Gå med i {info.name}</button>
      ) : (
        <SignupForm source="league" signedIn={!!session} join={info.code} title={`Gå med i ${info.name}`} intro="Välj ett smeknamn och logga in med e-post. Sedan är du med i ligan direkt." onDone={join} />
      )}
      {msg && <p className="note">{msg}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <div className="tabs" role="group" aria-label="Period">
        <button aria-pressed={tab === "day"} onClick={() => setTab("day")}>Idag</button>
        <button aria-pressed={tab === "week"} onClick={() => setTab("week")}>Veckan</button>
        <button aria-pressed={tab === "all"} onClick={() => setTab("all")}>Totalt</button>
      </div>
      {tab === "day" && <DayBoard day={today} league={info.id} />}
      {tab === "week" && <WeekBoard monday={mondayOf(today)} league={info.id} />}
      {tab === "all" && <AllBoard league={info.id} />}
    </main>
  );
}
