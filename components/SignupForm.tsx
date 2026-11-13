"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sb, rpc } from "@/lib/sb";
import { guestId, lsSet } from "@/lib/local";
import { track } from "@/lib/track";
import { errorText } from "@/lib/errors";

type Props = {
  title: string;
  intro: string;
  /** Vart man skickas efter inloggning. */
  next?: string;
  /** Ligakod att gå med i efter inloggning. */
  join?: string;
  /** Inloggad men saknar smeknamn: visa bara smeknamn och samtycke. */
  signedIn?: boolean;
  onDone?: () => void;
  source: string;
};

/** Är Google-inloggning påslagen i Supabase? Läses från den publika inställningssidan, en gång per sidladdning. */
let googleCheck: Promise<boolean> | null = null;
function googleEnabled(): Promise<boolean> {
  googleCheck ??= fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY! },
  })
    .then(r => (r.ok ? r.json() : null))
    .then(s => !!s?.external?.google)
    .catch(() => false);
  return googleCheck;
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function SignupForm({ title, intro, next, join, signedIn, onDone, source }: Props) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    if (!signedIn) googleEnabled().then(setGoogle);
  }, [signedIn]);

  async function withGoogle() {
    setError(null);
    const nick = nickname.trim();
    // Smeknamnet är frivilligt här: saknas det får man välja ett på kontosidan efter inloggningen.
    lsSet("pending", { nickname: nick.length >= 2 ? nick : null, consent, next, join });
    track("signup_google_click", { consent, source });
    const { error } = await sb().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + (join ? "/liga/" + join : next || "/") },
    });
    if (error) setError(errorText(error));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nick = nickname.trim();
    if (nick.length < 2) return setError("Välj ett smeknamn på minst två tecken.");
    setBusy(true);
    try {
      if (signedIn) {
        await rpc("set_profile", { p_nickname: nick, p_consent: consent, p_guest: guestId() });
        track("signup_done", { consent, source });
        onDone?.();
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("bad_email");
      lsSet("pending", { nickname: nick, consent, next, join });
      const { error } = await sb().auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin + (join ? "/liga/" + join : next || "/"),
          // Följer med kontot, så att smeknamn och dagens resultat sparas även om länken öppnas på en annan enhet.
          data: { nickname: nick, consent, guest: guestId() },
        },
      });
      if (error) throw error;
      track("signup_email_sent", { consent, source });
      setSentTo(email.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "bad_email") setError("Kontrollera e-postadressen.");
      else if (/rate|limit/i.test(msg)) setError("För många försök just nu. Vänta en minut och försök igen.");
      else setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="save" aria-live="polite">
        <h3>Kolla mejlen</h3>
        <p>
          Vi har skickat en länk till <strong>{sentTo}</strong>. Klicka på den, så hamnar du på topplistan som{" "}
          <strong>{nickname.trim()}</strong>. Ditt resultat från idag följer med.
        </p>
        <p className="note">Hittar du inget? Titta i skräpposten eller <button className="link" onClick={() => setSentTo(null)}>försök igen</button>.</p>
      </div>
    );
  }

  return (
    <form className="save" onSubmit={submit} noValidate>
      <h3>{title}</h3>
      <p>{intro}</p>
      <div className="field">
        <label htmlFor={`nick-${source}`}>Smeknamn på topplistan</label>
        <input id={`nick-${source}`} value={nickname} onChange={e => setNickname(e.target.value)} maxLength={20} autoComplete="nickname" placeholder="T.ex. Zlatans moster" />
      </div>
      <label className="check">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <span>Påminn mig om dagens straffpunkt och skicka veckans resultat via e-post. Du kan avsluta när du vill.</span>
      </label>
      {!signedIn && google && (
        <>
          <button type="button" className="btn google wide" onClick={withGoogle}>
            <GoogleLogo /> Fortsätt med Google
          </button>
          <p className="or"><span>eller få en inloggningslänk</span></p>
        </>
      )}
      {!signedIn && (
        <div className="field">
          <label htmlFor={`mail-${source}`}>E-post</label>
          <input id={`mail-${source}`} type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="namn@exempel.se" />
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn wide" disabled={busy}>{signedIn ? "Spara" : busy ? "Skickar…" : "Skicka inloggningslänk"}</button>
      <p className="note">
        Smeknamnet syns på topplistan. E-postadressen visas aldrig. Inget lösenord behövs. <Link href="/integritet">Så hanterar vi dina uppgifter</Link>.
      </p>
    </form>
  );
}
