/* Lagen man kan välja i supportertabellen. Samma id:n finns i databasfunktionen sp_clubs().
   Listan är svenska klubbar med stor publik, oavsett vilken serie de spelar i just nu. */
export const CLUBS: { id: string; name: string }[] = [
  { id: "aik", name: "AIK" },
  { id: "bp", name: "IF Brommapojkarna" },
  { id: "degerfors", name: "Degerfors IF" },
  { id: "djurgarden", name: "Djurgården" },
  { id: "elfsborg", name: "IF Elfsborg" },
  { id: "gais", name: "GAIS" },
  { id: "hacken", name: "BK Häcken" },
  { id: "halmstad", name: "Halmstads BK" },
  { id: "hammarby", name: "Hammarby" },
  { id: "hif", name: "Helsingborgs IF" },
  { id: "ifkgoteborg", name: "IFK Göteborg" },
  { id: "jonkoping", name: "Jönköpings Södra" },
  { id: "kalmar", name: "Kalmar FF" },
  { id: "landskrona", name: "Landskrona BoIS" },
  { id: "mff", name: "Malmö FF" },
  { id: "mjallby", name: "Mjällby AIF" },
  { id: "norrkoping", name: "IFK Norrköping" },
  { id: "orebro", name: "Örebro SK" },
  { id: "orgryte", name: "Örgryte IS" },
  { id: "oster", name: "Östers IF" },
  { id: "ostersund", name: "Östersunds FK" },
  { id: "sirius", name: "IK Sirius" },
  { id: "sundsvall", name: "GIF Sundsvall" },
  { id: "trelleborg", name: "Trelleborgs FF" },
  { id: "varnamo", name: "IFK Värnamo" },
  { id: "vasteras", name: "Västerås SK" },
];
export const OTHER = { id: "annat", name: "Annat lag" };

export function clubName(id: string | null | undefined): string | null {
  if (!id) return null;
  return CLUBS.find(c => c.id === id)?.name ?? (id === OTHER.id ? OTHER.name : null);
}
