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
  const [joining, setJoining] = useState(false);

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
    if (joining) return;
    setJoining(true);
    setError(null);
    try {
      await rpc("join_league", { p_code: code });
      track("league_join");
      await load();
    } catch (e) { setError(errorText(e)); }
    finally { setJoining(false); }
  }

  function invitation() {
    return {
      url: `${location.origin}/liga/${encodeURIComponent(info!.code)}?utm_source=spelare&utm_medium=delning&utm_campaign=kompisliga`,
      text: `Vem kan mest fotboll i kompisgänget? Gå med i ${info!.name} på Straffpunkten. Samma elva frågor varje dag, egen topplista. Vi tävlar om veckan.`,
    };
  }

  async function copyInvite() {
    const { text, url } = invitation();
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMsg("Inbjudan kopierad. Klistra in den i gruppchatten.");
      track("league_invite_done", { kind: "copy" });
    } catch { setMsg(`${text}\n${url}`); }
  }

  async function invite() {
    const { url, text } = invitation();
    setMsg(null);
    track("league_invite");
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        track("league_invite_done", { kind: "share" });
        return;
      }
    } catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    await copyInvite();
  }

  if (info === undefined) return <main className="page"><p className="empty">Hämtar ligan…</p></main>;
  if (info === null) return <main className="page"><div className="hero"><h1>Hittade ingen liga</h1><p>Kontrollera koden <strong>{code}</strong> och försök igen.</p></div></main>;

  const today = todaySE();
  return (
    <main className="page">
      <div className="hero">
        <span className="kicker">Liga · {info.members} spelare · kod <span className="code" style={{ fontSize: "inherit" }}>{info.code}</span></span>
        <h1>{info.name}</h1>
        <p>{info.is_member ? "Gängets egen topplista. Spela dagens quiz och se vem som kan mest den här veckan." : "Du är inbjuden. Gå med och visa vem i gänget som kan mest fotboll."}</p>
      </div>

      {info.is_member ? (
        <section className="league-pitch" aria-label="Bjud in gänget">
          <h2>{info.members === 1 ? "Nu saknas bara motståndet." : "Alla experter med i ligan?"}</h2>
          <p>Skicka inbjudan i gruppchatten. Alla spelar samma quiz, när det passar dem.</p>
          <div className="btn-row">
            <button className="btn" onClick={invite}>Bjud in gänget</button>
            <button className="btn line" onClick={copyInvite}>Kopiera inbjudan</button>
          </div>
          <a className="league-secondary" href="/">Spela dagens 11 frågor</a>
        </section>
      ) : session && profile ? (
        <button className="btn wide" onClick={join} disabled={joining}>{joining ? "Går med…" : `Gå med i ${info.name}`}</button>
      ) : profile === undefined && session ? (
        <p role="status">Hämtar din profil…</p>
      ) : (
        <SignupForm source="league" signedIn={!!session} join={info.code} title={`Gå med i ${info.name}`} intro="Välj ett smeknamn och logga in med e-post. Sedan är du med i ligan direkt." onDone={join} />
      )}
      {msg && <p className="note share-feedback" role="status">{msg}</p>}
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
