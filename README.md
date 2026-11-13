# Straffpunkten

Dagligt fotbollsquiz: 11 frågor från lätt till svår, 20 sekunder per fråga, samma frågor för alla och en chans per dag.

- **Dagens straffpunkt** (`/`): spelet. Gäster kan spela direkt; för topplistan krävs smeknamn och e-post (inloggningslänk, inget lösenord).
- **Topplista** (`/topplista`): dag och vecka, filtrerbar per liga.
- **Ligor** (`/ligor`, `/liga/[kod]`): egna topplistor för kompisgäng, jobb och lag.
- **Delning** (`/r/[id]`, `/api/card/[id]`): delningsbild och landningssida som utmanar mottagaren.
- **Möt en vän och träning** (`/klassisk.html`): den första versionen, helt i webbläsaren.

## Teknik

Next.js på Vercel, Supabase (Postgres + Auth) i eu-north-1. All spellogik och rättning sker i databasfunktioner (`security definer`), så klienten aldrig ser rätt svar i förväg. Tabellerna har RLS utan policies och nås bara via funktionerna.

## Frågebanken

`data/questions.json` är källan. Efter ändringar: publicera och anropa `/api/seed`, som synkar banken till databasen (befintliga frågor uppdateras, inga dubbletter).

Fält: `category`, `q`, `options` (4), `answer` (index), `fact`, `difficulty` (1–3), valfritt `checked_at`, `expires_at`, `source`, `active`.

## Miljövariabler

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` (publik nyckel), `SEED_SECRET` (för `/api/seed`).
