"use client";
import Link from "next/link";
import { useState } from "react";
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

export default function SignupForm({ title, intro, next, join, signedIn, onDone, source }: Props) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      {!signedIn && (
        <div className="field">
          <label htmlFor={`mail-${source}`}>E-post</label>
          <input id={`mail-${source}`} type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="namn@exempel.se" />
        </div>
      )}
      <label className="check">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <span>Påminn mig om dagens straffpunkt och skicka veckans resultat via e-post. Du kan avsluta när du vill.</span>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn wide" disabled={busy}>{signedIn ? "Spara" : busy ? "Skickar…" : "Skicka inloggningslänk"}</button>
      <p className="note">
        Smeknamnet syns på topplistan. E-postadressen visas aldrig. Inget lösenord behövs. <Link href="/integritet">Så hanterar vi dina uppgifter</Link>.
      </p>
    </form>
  );
}
