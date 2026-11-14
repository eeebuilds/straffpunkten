# Överlämning: Straffpunkten och portfolion (14 november 2026)

## Läge just nu

### Straffpunkten – https://straffpunkten.vercel.app
- Repo: `eeebuilds/straffpunkten`, gren `main`. Vercel-projektet `straffpunkten` (team galaxxyeriks-projects) bygger automatiskt vid push till `main`.
- Next.js 16 (App Router) + Supabase (projekt `straffpunkten`, ref `lduqdfqrwtzewkgkbhpi`, eu-north-1).
- **All spellogik ligger i databasfunktioner** (`security definer`): `start_play`, `get_question`, `answer_question` (rättar på servern, 20 s per fråga), `play_review`, `result_card`, `leaderboard_day`, `leaderboard_week`, `my_stats`, `get_profile`, `set_profile`, `claim_guest`, `create_league`/`join_league`/`leave_league`/`league_info`/`my_leagues`, `log_event`, `seed_questions`, `delete_account`, samt `ensure_daily` (11 frågor/dag: 4 lätta, 4 medel, 3 svåra). Trigger `on_auth_user_created` skapar profil från metadata i inloggningslänken och flyttar över gästspel.
- Tabellerna har RLS utan policies och nås bara via funktionerna. **Schemat finns inte som migrationsfiler i repot** – hämta det med `supabase db pull` (Supabase CLI, inloggad mot projektet) innan du ändrar i databasen.
- Miljövariabler i Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` (publik nyckel), `SEED_SECRET` (hemlig, används av `/api/seed`).
- Inloggning: magisk länk via e-post (implicit flow), smeknamn + frivilligt samtycke till utskick. Gäster kan spela utan konto.
- Sidor: `/` (dagens), `/topplista`, `/ligor`, `/liga/[kod]`, `/konto`, `/integritet`, `/r/[id]` (delningssida), `/api/card/[id]` (delningsbild), `/klassisk.html` (möt en vän + träning).

### Frågebanken
- `data/questions.json`, cirka 3 000 frågor i åtta kategorier. Riskfrågor (siffror, rekord, sentida händelser) är faktakollade mot källor; fältet `checked_at`/`source` visar vilka.
- Synk till databasen: Vercel Cron kör `/api/seed` varje natt 02:40 UTC (`vercel.json`). Öppna `/api/seed` för att synka direkt.
- Regler för nya frågor: `docs/fragor.md`. Validering: `node scripts/validate.mjs`.
- En schemalagd Claude-körning lägger till ~80 frågor varje måndag 02:17 (svensk tid). Stäng av den i claude.ai om du tar över frågeflödet helt.

### Portfolion – https://eeebuilds.vercel.app
- En enda statisk `index.html` i Vercel-projektet `eeebuilds`, uppladdad direkt (inget GitHub-repo än). Källan är den publicerade filen. Skapa gärna repot `eeebuilds/portfolio`, lägg in filen och koppla projektet till repot.
- Design: Geist, egentecknade SVG-omslag per projekt, inga påhittade siffror.

## Öppna punkter (ungefär i prioritetsordning)
1. **E-postutskick:** samtycke samlas in (`profiles.marketing_consent`) men inga påminnelser eller veckobrev skickas än. Resend finns för VM-tipset. Varje utskick ska ha avregistreringslänk.
2. **SMTP i Supabase:** avsändaren ska vara "Straffpunkten" och inte "Supabase Auth" (Authentication → Emails → SMTP och mallar).
3. **Mätning:** tratten finns i tabellen `events` (play_start, play_finish, share_click, share_done, signup_email_sent, signup_done, league_*). Bygg en enkel översikt över dagliga spelare, retention dag 1/7 och andel som lämnar e-post.
4. **Portfolion i ett repo** (se ovan).
5. Senare: fler spel på samma plattform (geografi först; musik kräver annan ljudkälla än Spotify, vars API kräver 250 000 MAU för full åtkomst).

## Arbetsregler från Erik
- Allt på svenska. Tänk kommersiellt (retention, delning, e-postlista, sponsorvärde).
- Inga påhittade fakta, siffror eller citat. Frågor ska vara stabil fotbollskunskap, inga pågående säsonger.
- Design som inte ser AI-genererad ut. På mobil får knappar inte hamna vid Safaris verktygsfält.
- En annan Claude-session har jobbat med Straffpunktens utseende och pushat till `main`; hämta alltid senaste innan du ändrar och undvik att skriva över deras stil.
