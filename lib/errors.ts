const MESSAGES: Record<string, string> = {
  nickname_taken: "Smeknamnet är upptaget. Välj ett annat.",
  bad_nickname: "Smeknamnet ska vara 2–20 tecken: bokstäver, siffror, mellanslag, punkt eller bindestreck.",
  not_signed_in: "Du behöver logga in först.",
  no_profile: "Välj ett smeknamn på kontosidan först.",
  not_found: "Hittade inte det du letade efter. Kontrollera koden.",
  not_enough_questions: "Dagens frågor är inte på plats än. Försök igen om en stund.",
};

export function errorText(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  for (const key of Object.keys(MESSAGES)) if (raw.includes(key)) return MESSAGES[key];
  return "Något gick fel. Ladda om sidan och försök igen.";
}
