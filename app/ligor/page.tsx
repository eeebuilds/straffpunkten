"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rpc, GAME } from "@/lib/sb";
import { useSession } from "@/components/useSession";
import SignupForm from "@/components/SignupForm";
import { errorText } from "@/lib/errors";
import { track } from "@/lib/track";

type League = { name: string; code: string; members: number };

export default function Ligor() {
  const session = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<unknown>(undefined);
  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) return setProfile(null);
    rpc("get_profile").then(p => setProfile(p ?? null), () => setProfile(null));
    rpc<League[]>("my_leagues", { p_game: GAME }).then(setLeagues, () => setLeagues([]));
  }, [session]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (creating || name.trim().length < 2) return;
    setCreating(true);
    setError(null);
    try {
      const l = await rpc<{ code: string }>("create_league", { p_game: GAME, p_name: name.trim() });
      track("league_create");
      router.push("/liga/" + l.code);
    } catch (err) { setError(errorText(err)); }
    finally { setCreating(false); }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (/^[A-Z0-9]{4,8}$/.test(c)) router.push("/liga/" + c);
    else setError("Skriv ligakoden med 4–8 bokstäver eller siffror.");
  }

  return (
    <main className="page">
      <div className="hero">
        <span className="kicker">Kompisligor · Tävla om veckan</span>
        <h1>Vem kan mest fotboll i kompisgänget?</h1>
        <p>Gruppchatten har åsikter. Nu får den en topplista. Samla kompisarna, kollegorna eller laget i en egen liga.</p>
      </div>

      <ol className="league-steps" aria-label="Så fungerar en kompisliga">
        <li><strong>Starta en liga.</strong> Ge gängets topplista ett namn.</li>
        <li><strong>Skicka länken i gruppchatten.</strong> Kompisarna går med via sin inloggning.</li>
        <li><strong>Spela dagens elva frågor.</strong> Alla får samma quiz. Följ vem som leder dagen och veckan.</li>
      </ol>

      {session === undefined || profile === undefined ? (
        <p className="empty" role="status">Hämtar dina ligor…</p>
      ) : session === null || profile === null ? (
        <div id="skapa">
          <SignupForm source="leagues" signedIn={!!session} title="Samla gänget i en egen liga" intro="Välj ett smeknamn och logga in för att starta ligan. Inget lösenord behövs." next="/ligor#skapa" onDone={() => location.reload()} />
        </div>
      ) : (
        <>
          {leagues && leagues.length > 0 && (
            <div className="section">
              <div className="section-head"><h2>Dina ligor</h2></div>
              <ul className="card-list">
                {leagues.map(l => (
                  <li key={l.code}><Link href={`/liga/${l.code}`}><b>{l.name}</b><span>{l.members} {l.members === 1 ? "spelare" : "spelare"}</span></Link></li>
                ))}
              </ul>
            </div>
          )}
          <form id="skapa" className="save" onSubmit={create} aria-busy={creating}>
            <h3>Vad heter gängets liga?</h3>
            <div className="field">
              <label htmlFor="lname">Namn på ligan</label>
              <input id="lname" value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="T.ex. Soffexperterna" required minLength={2} />
            </div>
            <button className="btn wide" disabled={creating || name.trim().length < 2}>{creating ? "Skapar ligan…" : "Skapa liga och bjud in gänget"}</button>
            <p className="note">Nästa steg: kopiera inbjudan och skicka den i gruppchatten.</p>
          </form>
        </>
      )}

      <form className="section" onSubmit={join}>
        <div className="section-head"><h3>Har du en kod?</h3></div>
        <div className="field">
          <label htmlFor="lcode">Ligakod</label>
          <input id="lcode" value={code} onChange={e => setCode(e.target.value)} maxLength={8} autoCapitalize="characters" placeholder="ABC123" />
        </div>
        <button className="btn line wide" disabled={code.trim().length < 4}>Gå till ligan</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}
