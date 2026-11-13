"use client";
import { useEffect, useState } from "react";
import { sb, rpc, GAME } from "@/lib/sb";
import { guestId, lsGet, lsSet } from "@/lib/local";
import { useSession } from "@/components/useSession";
import SignupForm from "@/components/SignupForm";
import { errorText } from "@/lib/errors";

type Profile = { nickname: string; marketing_consent: boolean } | null;
type Stats = { streak: number; best_streak: number; played: number; avg: number | null; best: number | null };

export default function Konto() {
  const session = useSession();
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);
  const [nick, setNick] = useState("");
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(lsGet<string>("profile_error") ? errorText(lsGet<string>("profile_error")) : null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { lsSet("profile_error", null); }, []);

  useEffect(() => {
    if (session === undefined) return;
    rpc<Stats>("my_stats", { p_game: GAME, p_guest: guestId() }).then(setStats, () => {});
    if (!session) return setProfile(null);
    rpc<Profile>("get_profile").then(p => {
      setProfile(p ?? null);
      if (p) { setNick(p.nickname); setConsent(p.marketing_consent); }
    }, () => setProfile(null));
  }, [session]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMsg(null);
    try {
      const p = await rpc<Profile>("set_profile", { p_nickname: nick, p_consent: consent, p_guest: guestId() });
      setProfile(p); setMsg("Sparat.");
    } catch (err) { setError(errorText(err)); }
  }

  async function del() {
    try {
      await rpc("delete_account");
      await sb().auth.signOut();
      location.href = "/";
    } catch (err) { setError(errorText(err)); }
  }

  return (
    <main className="page">
      <div className="hero">
        <span className="kicker">{session?.user.email ?? "Inte inloggad"}</span>
        <h1>Mitt konto</h1>
      </div>

      {stats && stats.played > 0 && (
        <div className="stats">
          <div><b>{stats.streak}</b><span>dagar i rad</span></div>
          <div><b>{stats.best_streak}</b><span>längsta svit</span></div>
          <div><b>{stats.played}</b><span>spelade</span></div>
          <div><b>{stats.best ?? "–"}</b><span>bästa</span></div>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      {session === null && (
        <SignupForm source="account" title="Logga in" intro="Har du redan ett konto loggar du in med samma e-post. Smeknamnet byter du sedan här." next="/konto" />
      )}

      {session && profile === null && (
        <SignupForm source="account" signedIn title="Välj smeknamn" intro="Det här namnet syns på topplistan." onDone={() => location.reload()} />
      )}

      {session && profile && (
        <>
          <form className="save" onSubmit={save}>
            <h3>Profil</h3>
            <div className="field">
              <label htmlFor="nick">Smeknamn</label>
              <input id="nick" value={nick} onChange={e => setNick(e.target.value)} maxLength={20} />
            </div>
            <label className="check">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
              <span>Påminn mig om dagens straffpunkt och skicka veckans resultat via e-post.</span>
            </label>
            <button className="btn wide">Spara</button>
            {msg && <p className="ok-msg">{msg}</p>}
          </form>
          <div className="btn-row">
            <button className="btn line" onClick={() => sb().auth.signOut().then(() => (location.href = "/"))}>Logga ut</button>
          </div>
          <div className="section">
            <div className="section-head"><h3>Radera kontot</h3></div>
            <p className="note">Tar bort ditt konto, alla dina resultat och ligor du har skapat. Det går inte att ångra.</p>
            {confirmDelete ? (
              <div className="btn-row">
                <button className="btn dark" onClick={del}>Ja, radera allt</button>
                <button className="btn line" onClick={() => setConfirmDelete(false)}>Avbryt</button>
              </div>
            ) : (
              <button className="link" onClick={() => setConfirmDelete(true)}>Radera mitt konto</button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
