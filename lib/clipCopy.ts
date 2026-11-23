/**
 * Copy för klippen på TikTok och Reels. Kroken ska väcka nyfikenhet på kunskapen, inte på tidspress:
 * spelet handlar om vad man kan. Påståenden om hur många som klarade en fråga görs bara med data.
 */

/** Handskrivna krokar för enskilda frågor (fråga-id → rubrik). Saknas en används en allmän krok. */
export const HOOKS: Record<number, string> = {
  169: "Sverige vann en VM-kvartsfinal med 8–0. Mot vem?",
  1116: "VM-pokalen stals 1966. En hund hittade den.",
  2603: "Brian Clough tog över Leeds 1974. Det höll inte länge.",
};

/** Serier med tre frågor, från lätt till svår. Frågorna måste redan ha spelats, så att inget avslöjas. */
export const SERIES: Record<string, { title: string; ids: number[]; tag: string }> = {
  blagult: { title: "3 frågor om blågult", ids: [23, 1645, 228], tag: "#blågult" },
  vm: { title: "3 VM-frågor", ids: [48, 40, 1088], tag: "#vm" },
};

/** Resultatskalan i slutet av en serie. Tittaren räknar själv och skriver i kommentarerna. */
export const SCALE: [string, string][] = [
  ["3 av 3", "Expertkommentator. Ta över tv-soffan."],
  ["2 av 3", "Given i startelvan."],
  ["1 av 3", "Inhoppare. Det finns hopp."],
  ["0 av 3", "Domare."],
];

export const TAGS: Record<string, string> = {
  Allsvenskan: "#allsvenskan", Landslaget: "#blågult", VM: "#vm", "EM & OS": "#em", Ligor: "#premierleague", Europacuper: "#championsleague",
};

/** Bildtextens fasta del: vad spelet är, varför man ska tävla med kompisar och var det finns. */
export const PITCH_LINES =
  "Straffpunkten är ett nytt fotbollsquiz varje dag: 11 frågor, samma för alla. Som Wordle, fast fotboll. " +
  "Starta en liga med kompisarna och se vem som kan mest. Gratis, ingen app: länk i bio.";
