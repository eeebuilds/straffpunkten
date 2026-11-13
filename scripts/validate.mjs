// Kontrollerar frågebanken: format, dubbletter och fördelning. Kör: node scripts/validate.mjs [fil]
import fs from "node:fs";

const file = process.argv[2] || "data/questions.json";
const rows = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const norm = s => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9åäö ]/g, "").replace(/\s+/g, " ").trim();
const seen = new Map();
const byCat = {}, byDiff = {}, byAns = {};

rows.forEach((r, i) => {
  const at = `#${i} "${String(r.q).slice(0, 50)}"`;
  if (typeof r.q !== "string" || r.q.length < 10) errors.push(`${at}: frågetext saknas`);
  if (!Array.isArray(r.options) || r.options.length !== 4) errors.push(`${at}: ska ha 4 alternativ`);
  else if (new Set(r.options.map(o => norm(String(o)))).size !== 4) errors.push(`${at}: alternativen är inte unika`);
  if (![0, 1, 2, 3].includes(r.answer)) errors.push(`${at}: answer måste vara 0–3`);
  if (![1, 2, 3].includes(r.difficulty)) errors.push(`${at}: difficulty måste vara 1–3`);
  if (typeof r.fact !== "string" || r.fact.length < 10) errors.push(`${at}: fact saknas`);
  if (typeof r.category !== "string") errors.push(`${at}: category saknas`);
  const k = norm(String(r.q));
  if (seen.has(k)) errors.push(`${at}: dubblett av #${seen.get(k)}`);
  seen.set(k, i);
  byCat[r.category] = (byCat[r.category] || 0) + 1;
  byDiff[r.difficulty] = (byDiff[r.difficulty] || 0) + 1;
  byAns[r.answer] = (byAns[r.answer] || 0) + 1;
});

console.log(`${rows.length} frågor`);
console.log("Kategorier:", byCat);
console.log("Svårighet:", byDiff);
console.log("Rätt svar per index:", byAns);
if (errors.length) {
  console.error(`\n${errors.length} fel:\n` + errors.slice(0, 50).join("\n"));
  process.exit(1);
}
console.log("Inga fel.");
