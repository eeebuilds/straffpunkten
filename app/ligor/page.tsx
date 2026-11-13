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

  useEffect(() => {
    if (session === undefined) return;
    if (!session) return setProfile(null);
    rpc("get_profile").then(p => setProfile(p ?? null), () => setProfile(null));
    rpc<League[]>("my_leagues", { p_game: GAME }).then(setLeagues, () => setLeagues([]));
  }, [session]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const l = await rpc<{ code: string }>("create_league", { p_game: GAME, p_name: name });
      track("league_create");
      router.push("/liga/" + l.code);
    } catch (err) { setError(errorText(err)); }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length >= 4) router.push("/liga/" + c);
  }

  return (
    <main className="page">
      <div className="hero">
        <span className="kicker">Spela mot gänget</span>
        <h1>Ligor</h1>
        <p>Samla kompisarna, jobbet eller laget i en egen liga. Alla spelar dagens straffpunkt som vanligt, och ligan får en egen topplista för dagen och veckan.</p>
      </div>

      {session === null || profile === null ? (
        <SignupForm source="leagues" signedIn={!!session} title="Skapa konto först" intro="Ligor kräver ett smeknamn, så att alla vet vem som leder." next="/ligor" onDone={() => location.reload()} />
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
          <form className="save" onSubmit={create}>
            <h3>Starta en liga</h3>
            <div className="field">
              <label htmlFor="lname">Namn på ligan</label>
              <input id="lname" value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="T.ex. Fredagsfotbollen" />
            </div>
            <button className="btn wide" disabled={name.trim().length < 2}>Skapa ligan</button>
            <p className="note">Du får en kod och en länk att skicka till gänget.</p>
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
