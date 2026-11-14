"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { rpc, GAME } from "@/lib/sb";
import { guestId } from "@/lib/local";
import { track } from "@/lib/track";
import { errorText } from "@/lib/errors";
import { hms, msToNextDay, prettyDay, shortDay } from "@/lib/dates";
import { useSession } from "./useSession";
import SignupForm from "./SignupForm";
import { AllBoard, DayBoard } from "./Leaderboard";
import { Ball, Kicks, Pitch, type Shot } from "./Pitch";

const TOTAL = 11;
const LIMIT = 20000;
const KEYS = ["A", "B", "C", "D"];

type PlayState = { play_id: string; day: string; total: number; index: number; score: number; finished: boolean; duration_ms: number | null; results: boolean[] };
type Question = { index: number; category: string; difficulty: number; q: string; options: string[]; ms_left: number };
type Answer = { correct: boolean; late: boolean; answer: number; fact: string; pct_correct: number | null; answered_by: number; state: PlayState; choice: number };
type Card = { score: number; players: number; beaten_pct: number | null; nickname: string | null; results: boolean[] };
type Stats = { streak: number; best_streak: number; played: number; avg: number | null; best: number | null; dist: Record<string, number> | null };
type Review = { q: string; options: string[]; answer: number; choice: number; correct: boolean; category: string }[];
type Profile = { nickname: string; marketing_consent: boolean } | null;

export default function Daily() {
  const session = useSession();
  const [st, setSt] = useState<PlayState | null>(null);
  const [q, setQ] = useState<Question | null>(null);
  const [ans, setAns] = useState<Answer | null>(null);
  const [msLeft, setMsLeft] = useState(LIMIT);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const deadline = useRef(0);
  const answering = useRef(false);
  const nextRef = useRef<HTMLButtonElement>(null);

  const loading = useRef(false);
  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const s = await rpc<PlayState>("start_play", { p_game: GAME, p_guest: guestId() });
      setSt(s);
    } catch (e) {
      setError(errorText(e));
    } finally {
      loading.current = false;
    }
  }, []);

  // Klick på logotypen: tillbaka till startvyn. Servern håller ställningen och klockan,
  // så ett påbörjat spel fortsätter där det var ("Fortsätt med straff N").
  useEffect(() => {
    const onHome = () => {
      setQ(null);
      setAns(null);
      setError(null);
      answering.current = false;
      load();
    };
    window.addEventListener("straffpunkten:home", onHome);
    return () => window.removeEventListener("straffpunkten:home", onHome);
  }, [load]);

  // Ladda om spelet när inloggningen ändras, så att gästspel flyttas över till kontot.
  const userId = session === undefined ? undefined : session?.user.id ?? null;
  useEffect(() => {
    if (userId === undefined) return;
    load();
  }, [userId, load]);

  const nextQuestion = useCallback(async () => {
    if (!st) return;
    setBusy(true);
    setError(null);
    try {
      const nq = await rpc<Question & { finished?: boolean }>("get_question", { p_play: st.play_id, p_guest: guestId() });
      if (nq.finished) return load();
      setAns(null);
      setQ(nq);
      window.scrollTo(0, 0);
      deadline.current = performance.now() + nq.ms_left;
      setMsLeft(nq.ms_left);
      answering.current = false;
      if (nq.index === 0) track("play_start");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }, [st, load]);

  const answer = useCallback(async (choice: number) => {
    if (!st || !q || ans || answering.current) return;
    answering.current = true;
    try {
      const a = await rpc<Omit<Answer, "choice">>("answer_question", { p_play: st.play_id, p_guest: guestId(), p_choice: choice });
      setAns({ ...a, choice });
      // Kort vibration vid mål, två korta vid räddning. Saknas stöd (t.ex. iPhone) händer inget.
      try { navigator.vibrate?.(a.correct ? [40, 30, 90] : [25, 60, 25]); } catch {}
      setSt(a.state);
      if (a.state.finished) track("play_finish", { score: a.state.score });
    } catch (e) {
      answering.current = false;
      setError(errorText(e));
    }
  }, [st, q, ans]);

  // Klockan: 20 sekunder per straff. När tiden är slut räknas skottet som räddat.
  useEffect(() => {
    if (!q || ans) return;
    const t = setInterval(() => {
      const left = Math.max(0, deadline.current - performance.now());
      setMsLeft(left);
      if (left <= 0) {
        clearInterval(t);
        answer(-1);
      }
    }, 100);
    return () => clearInterval(t);
  }, [q, ans, answer]);

  // Tangentbord: A–D eller 1–4 för svar, Enter för nästa.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.matches?.("input, textarea")) return;
      if (q && !ans) {
        const i = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
        if (i >= 0 && e.key.length === 1) answer(i);
      } else if (ans && e.key === "Enter" && !ans.state.finished) {
        e.preventDefault();
        nextQuestion();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [q, ans, answer, nextQuestion]);

  // Efter svaret: håll scenen i bild så att man ser bollen gå in, och fokusera Nästa utan att sidan hoppar.
  useEffect(() => {
    if (!ans) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    nextRef.current?.focus({ preventScroll: true });
  }, [ans]);

  if (error && !st) return <p className="error" role="alert">{error}</p>;
  if (!st) return <Skeleton />;

  // Under spelet visas frågan (även sista svaret). Därefter resultat eller start.
  if (!q) return st.finished ? <Results st={st} session={session} /> : <Intro st={st} busy={busy} onStart={nextQuestion} error={error} />;

  const low = msLeft < 5000;
  const sec = Math.ceil(msLeft / 1000);
  const shot: Shot = ans ? (ans.correct ? "goal" : ans.late ? "late" : "save") : "aim";
  const goalsNow = st.results.filter(Boolean).length;
  return (
    <div className="play">
      <div className="kick-row">
        <Kicks results={st.results} current={ans ? -1 : q.index} />
        <b>{goalsNow} mål</b>
      </div>
      <div className="scene">
        <Pitch compact shot={shot} target={ans && ans.choice >= 0 ? ans.choice : 0} />
        {!ans && (
          <span className={`timer ${low ? "low" : ""}`} role="timer" aria-label={`${sec} sekunder kvar`}>
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="24" fill="none" stroke="var(--paper-3)" strokeWidth="5" />
              <circle
                cx="30" cy="30" r="24" fill="none" stroke={low ? "var(--red)" : "var(--mustard)"} strokeWidth="5"
                strokeDasharray={`${((2 * Math.PI * 24 * msLeft) / LIMIT).toFixed(1)} 999`} transform="rotate(-90 30 30)"
              />
            </svg>
            <b>{sec}</b>
          </span>
        )}
        {ans && (
          <p className={`call ${ans.correct ? "" : "no"} ${ans.late ? "small" : ""}`} aria-live="polite">
            {ans.correct ? "Mål!" : ans.late ? "Tiden ute" : "Räddad"}
          </p>
        )}
      </div>
      <section className="sheet">
        <div className="q-meta">
          <span>Straff {q.index + 1} av {TOTAL}</span>
          <span>{q.category} · {["", "lätt", "medel", "svår"][q.difficulty]}</span>
        </div>
        <div className="body">
        <h2 className={ans ? "asked" : undefined}>{q.q}</h2>
        <div className={`opts ${ans ? "done" : ""}`}>
          {q.options.map((o, i) => {
            // Efter svaret visas bara rätt svar och ditt eventuella fel, så att allt får plats utan att scrolla.
            if (ans && i !== ans.answer && i !== ans.choice) return null;
            let cls = "opt";
            if (ans) cls += i === ans.answer ? " right" : " wrong";
            return (
              <button key={i} className={cls} disabled={!!ans} onClick={() => answer(i)}>
                <span className="key">{KEYS[i]}</span>
                <span className="txt">{o}</span>
              </button>
            );
          })}
        </div>
        {!ans && <p className="hint-line">Svara innan klockan går ut, annars räddar målvakten.</p>}
        {ans && (
          <div className="after">
            {ans.pct_correct != null && ans.answered_by > 1 && (
              <div className="pct">
                <div className="pct-row"><span>{ans.pct_correct} % av dagens spelare satte den</span><span>{ans.answered_by} svar</span></div>
                <div className="bar"><i style={{ width: `${ans.pct_correct}%` }} /></div>
              </div>
            )}
            {ans.fact && <p className="fact">{ans.fact}</p>}
            {ans.state.finished ? (
              <button ref={nextRef} className="btn wide" onClick={() => { setQ(null); setAns(null); window.scrollTo(0, 0); }}>
                Se dagens resultat <Arrow />
              </button>
            ) : (
              <button ref={nextRef} className="btn wide" onClick={nextQuestion} disabled={busy}>
                Nästa straff <Arrow />
              </button>
            )}
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        </div>
      </section>
    </div>
  );
}

function Arrow() {
  return (
    <svg className="arr" viewBox="0 0 18 14" aria-hidden="true" style={{ width: 18, height: 14 }}>
      <path d="M1 7h15M10 1l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Flame({ size = 16, color = "var(--mustard)" }: { size?: number; color?: string }) {
  return (
    <svg width={size * 0.875} height={size} viewBox="0 0 14 16" aria-hidden="true">
      <path d="M7 1c1 3 5 5 5 9.5a5 5 0 0 1-10 0C2 8 3.5 6.5 4.5 5.5c0 2 1 3 2 3C6.5 6 5.5 3.5 7 1z" fill={color} />
    </svg>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Skeleton() {
  return (
    <>
      <div className="scene"><Pitch /></div>
      <div className="hero" aria-busy="true">
        <span className="kicker">Dagens straffpunkt</span>
        <h1>Laddar…</h1>
      </div>
    </>
  );
}

function Intro({ st, busy, onStart, error }: { st: PlayState; busy: boolean; onStart: () => void; error: string | null }) {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    rpc<Stats>("my_stats", { p_game: GAME, p_guest: guestId() }).then(setStats, () => {});
  }, []);
  const resumed = st.index > 0;
  const played = !!stats && stats.played > 0;
  return (
    <>
      <div className="scene"><Pitch /></div>
      <div className="hero">
        <span className="kicker">{cap(prettyDay(st.day))}</span>
        <h1>Dagens straffpunkt</h1>
        <p>Elva straffar från lätt till svår, 20 sekunder per skott. Samma frågor för alla och en chans per dag.</p>
      </div>
      {resumed && (
        <div className="kick-row">
          <Kicks results={st.results} current={st.index} />
          <b>{st.score} mål</b>
        </div>
      )}
      <button className="btn wide" onClick={onStart} disabled={busy}>
        {resumed ? `Fortsätt med straff ${st.index + 1}` : "Ställ dig vid straffpunkten"} <Arrow />
      </button>
      {resumed && <p className="note">Klockan gick vidare på straffen du lämnade. Den kan redan ha gått ut.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="tiles">
        {played ? (
          <>
            <div className="tile">
              <span className="stub red"><Flame size={14} color="var(--paper)" /></span>
              <span className="txt">
                <b>{stats!.streak} {stats!.streak === 1 ? "dag" : "dagar"}</b>
                <span>{stats!.streak > 0 ? "i rad. Spela idag för att hålla sviten." : "i rad. Starta en ny svit idag."}</span>
              </span>
            </div>
            <div className="tile">
              <span className="stub"><Ball size={16} id="tb" /></span>
              <span className="txt">
                <b>{stats!.best ?? "–"}/{TOTAL}</b>
                <span>ditt bästa{stats!.avg != null ? `, snitt ${String(stats!.avg).replace(".", ",")}` : ""}.</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="tile"><span className="stub"><Ball size={16} id="tb" /></span><span className="txt"><b>11</b><span>straffar, från lätt till svår.</span></span></div>
            <div className="tile"><span className="stub red"><Flame size={14} color="var(--paper)" /></span><span className="txt"><b>20 s</b><span>per skott. Tänk snabbt.</span></span></div>
          </>
        )}
      </div>
      <a href="/klassisk.html#van">Möt en vän på samma mobil</a>
    </>
  );
}

function Results({ st, session }: { st: PlayState; session: ReturnType<typeof useSession> }) {
  const [card, setCard] = useState<Card | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [left, setLeft] = useState(msToNextDay());
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    rpc<Card>("result_card", { p_play: st.play_id }).then(setCard, () => {});
    rpc<Stats>("my_stats", { p_game: GAME, p_guest: guestId() }).then(setStats, () => {});
    rpc<Review>("play_review", { p_play: st.play_id, p_guest: guestId() }).then(setReview, () => {});
    setSaved(new URLSearchParams(window.location.search).has("sparad"));
  }, [st.play_id, refresh]);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) return setProfile(null);
    rpc<Profile>("get_profile").then(p => setProfile(p ?? null), () => setProfile(null));
  }, [session, refresh]);

  useEffect(() => {
    const t = setInterval(() => setLeft(msToNextDay()), 1000);
    return () => clearInterval(t);
  }, []);

  const url = `${window.location.origin}/r/${st.play_id}`;
  const grid = st.results.map(r => (r ? "🟢" : "🔴")).join("");
  const text = `Straffpunkten ${shortDay(st.day)}: ${st.score}/${TOTAL}\n${grid}`;

  async function share() {
    track("share_click", { score: st.score });
    try {
      const res = await fetch(`/api/card/${st.play_id}`);
      const blob = await res.blob();
      const file = new File([blob], `straffpunkten-${st.day}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text}\n${url}` });
        track("share_done", { kind: "image" });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text, url });
        track("share_done", { kind: "link" });
        return;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }
    copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareMsg("Kopierat. Klistra in i chatten med gänget.");
      track("share_done", { kind: "copy" });
    } catch {
      setShareMsg(`${text}\n${url}`);
    }
  }

  const verdict =
    st.score === 11 ? "Fullpott. Du är dagens Panenka." :
    st.score >= 9 ? "Landslagsklass." :
    st.score >= 7 ? "Allsvensk startelva." :
    st.score >= 5 ? "Stabil insats från straffpunkten." :
    st.score >= 3 ? "Målvakten hade en bra dag." : "Ny chans i morgon.";

  const onBoard = !!profile;
  const maxDist = stats?.dist ? Math.max(...Object.values(stats.dist)) : 1;

  return (
    <>
      <section className="board-card">
        <div className="row"><span>Dagens straffpunkt</span><span>{cap(prettyDay(st.day))}</span></div>
        <div className="score-big">
          <div className="flip"><b>{st.score}</b></div>
          <div className="of"><b>av {TOTAL}</b><span>{verdict}</span></div>
        </div>
        {card && card.players > 1 && card.beaten_pct != null && (
          <p>Du slog <span className="hl">{card.beaten_pct} %</span> av dagens {card.players} spelare.</p>
        )}
        <Kicks results={st.results} big />
      </section>

      {saved && onBoard && <p className="ok-msg">Klart. Du är med på topplistan som <strong>{profile!.nickname}</strong>.</p>}

      <div className="btn-row">
        <button className="btn" onClick={share}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3m0 0l-4 4m4-4l4 4M5 12v8h14v-8" /></svg>
          Dela
        </button>
        <button className="btn line" onClick={copy}>Kopiera text</button>
      </div>
      {shareMsg && <p className="note" style={{ whiteSpace: "pre-line" }}>{shareMsg}</p>}

      <div className="streak-card">
        <span className="stub"><Flame size={26} color="var(--paper)" /></span>
        <div className="txt">
          <b>{stats && stats.played > 0 ? `${stats.streak} ${stats.streak === 1 ? "dag" : "dagar"} i rad` : "Kom tillbaka i morgon"}</b>
          <p>
            {stats && stats.played > 0 && <>Ditt rekord är {stats.best_streak}. </>}
            Nya straffar om <strong>{hms(left)}</strong>. Spela mot kompisarna i en egen <Link href="/ligor">liga</Link>.
          </p>
        </div>
      </div>

      {profile === null && (
        <SignupForm
          source="result"
          signedIn={!!session}
          title="Kom med på topplistan"
          intro={`Du satte ${st.score} av ${TOTAL}. Spara resultatet, håll koll på din svit och se var du hamnar mot alla andra.`}
          onDone={() => setRefresh(r => r + 1)}
        />
      )}

      <div className="section">
        <div className="section-head"><h2>Topplistan idag</h2><Link href="/topplista">Hela listan</Link></div>
        <DayBoard day={st.day} limit={10} refresh={refresh} />
      </div>

      <div className="section">
        <div className="section-head"><h2>Topplistan totalt</h2><Link href="/topplista">Alla dagar</Link></div>
        <AllBoard limit={10} refresh={refresh} />
      </div>

      {stats && stats.played > 0 && (
        <div className="section">
          <div className="section-head"><h2>Din statistik</h2>{!onBoard && <span>Sparas bara i den här webbläsaren</span>}</div>
          <div className="stats">
            <div><b>{stats.streak}</b><span>dagar i rad</span></div>
            <div><b>{stats.best_streak}</b><span>längsta svit</span></div>
            <div><b>{stats.played}</b><span>spelade</span></div>
            <div><b>{stats.avg != null ? String(stats.avg).replace(".", ",") : "–"}</b><span>snitt</span></div>
          </div>
          {stats.dist && (
            <div className="dist" aria-label="Fördelning av dina resultat">
              {Array.from({ length: 12 }, (_, s) => 11 - s).map(s => {
                const c = stats.dist?.[String(s)] ?? 0;
                if (!c && s < (stats.best ?? 0) - 6) return null;
                return (
                  <div key={s}><span>{s}</span><i className={s === st.score ? "me" : ""} style={{ width: `${(c / maxDist) * 100}%` }} /></div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {review && (
        <div className="section">
          <div className="section-head"><h3>Dagens frågor</h3></div>
          <ul className="review">
            {review.map((r, i) => (
              <li key={i}>
                <span className={`mk ${r.correct ? "ok" : "no"}`}>{r.correct ? "✓" : "✗"}</span>
                <div>
                  <div className="rq">{r.q}</div>
                  <div className="ra">{r.options[r.answer]}{!r.correct && r.choice >= 0 && ` · du svarade ${r.options[r.choice]}`}{r.choice < 0 && " · tiden gick ut"}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
