# Frågeflödet

Varje vecka tas cirka 80 nya frågor fram och verifieras automatiskt innan de hamnar i spelet. Ingen människa behöver godkänna dem, men alla beslut loggas i commit-meddelandet.

## Vilka frågor vi vill ha

- Fotbollskunskap som håller över tid: historia, mästerskap, rekord, regler, legendariska spelare och klubbar.
- **Inga färska resultat.** Inga matcher, tabeller eller övergångar från innevarande eller förra säsongen, inga "nuvarande" tränare, skador eller trupper. Sådant blir fel snabbt och ger inget mervärde.
- Uppgifter som kan ändras ("flest", "rekord") låses i tiden: "före VM 2026", "efter säsongen 2023/24".
- Svårighetsfördelning ungefär 35 % lätta, 40 % medel, 25 % svåra. Rätt svar jämnt fördelat på A–D.
- Stil: se `data/questions.json`. Korta frågor (max cirka 110 tecken), fyra rimliga alternativ av samma typ, en faktamening som tillför något.

## Steg

1. **Planera.** Kör `node scripts/validate.mjs` och se vilka kategorier som är tunnast. Fördela veckans 80 frågor därefter.
2. **Skriv.** Två skribentagenter tar 40 frågor var, i olika kategorier, till `tmp/kandidater-A.json` och `tmp/kandidater-B.json`.
3. **Verifiera.** Två verifieringsagenter granskar *alla* kandidater oberoende av varandra, med webbsökning. För varje fråga kontrolleras:
   - att det markerade svaret är rätt och att inget av de andra alternativen också kan anses rätt,
   - att faktameningen stämmer i varje detalj (årtal, siffror, namn),
   - att källan är daterad och att uppgiften inte har ändrats senare (en äldre artikel kan vara inaktuell; sök efter nyare uppgifter om rekord, statistik och titlar),
   - att frågan inte bygger på färska eller föränderliga uppgifter,
   - att frågan inte är en dubblett av en befintlig fråga.
   Varje agent lämnar `godkänd`, `rättad` (med ändringen) eller `avvisad` (med skäl) och en käll-URL.
4. **Besluta.** Bara frågor som båda verifierarna godkänner tas med. En `rättad` fråga måste godkännas av den andra verifieraren i sin rättade form. Oenighet = avvisad.
5. **Lägg in.** Lägg till godkända frågor i `data/questions.json` med `checked_at` (dagens datum) och `source` (URL). Kör `node scripts/validate.mjs`.
6. **Publicera.** Committa med en sammanfattning (antal skrivna, godkända, rättade, avvisade och skälen) och pusha till `main`. Vercel bygger automatiskt, och ett nattligt Vercel-jobb (`vercel.json`, 02:40 UTC) anropar `/api/seed` som synkar banken till databasen. Vill du synka direkt kan du öppna `https://straffpunkten.vercel.app/api/seed` i webbläsaren.

## Rätta en fråga i efterhand

Ändra frågan i `data/questions.json` (frågetexten är nyckeln; ändras texten blir det en ny fråga) eller sätt `"active": false` för att plocka bort den. Publicera och anropa `/api/seed`.
