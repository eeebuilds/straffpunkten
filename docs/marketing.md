# Huvudfokus: kompisligor

”Vem kan mest fotboll i kompisgänget?” är huvudbudskapet. Dagens quiz är ingången. Ligans återkommande veckotävling ska ge gänget anledning att återvända och bjuda in fler. Detta är en hypotes att mäta, inte ett påstående om uppnådd tillväxt.

## Flödet

1. Spela dagens elva frågor utan krav på konto.
2. Utmana en kompis med det verkliga resultatet och en delningslänk utan frågor eller facit.
3. Starta en liga, välj smeknamn och skicka den färdiga inbjudan i gruppchatten.
4. Följ dagens och veckans topplista. Återvänd till samma liga för nästa omgång.

Start, resultat, ligasidor och delningssida använder samma budskap. Befintlig matchprogramsstil behålls. Knappar ligger i sidflödet med appens befintliga marginal för mobilens verktygsfält. Delningsmenyn öppnas direkt från trycket; om den saknas erbjuds kopiering och vid nekad urklippsåtkomst visas texten.

## Mätning

Behåll `play_start`, `play_finish`, `share_click`, `share_done`, `league_create`, `league_join` och `league_invite`. Nya `league_cta` skiljer ingångarna `intro`, `result` och `shared`. `league_invite_done` anger om inbjudan delats eller kopierats. Delningslänkar har kampanjparametrar. Dessa signaler visar avsikt och genomförd delningsåtgärd, inte att mottagaren verkligen läst eller gått med.

Nästa analys efter verifierad databasåtkomst: andel slutförda spel som följs av ligaskapande, inbjudningar som leder till inträde, och återkomst efter en respektive sju dagar för ligamedlemmar jämfört med övriga. Vercels kampanjtrafik kan hjälpa till att följa delningsbesök; det finns ännu ingen verifierad attribution mellan en viss avsändare och mottagarens konto.

## Nästa steg

E-postpåminnelser och veckobrev ska fortsätta samma tema med riktiga ligaresultat när databasfrågorna kan verifieras. Enbart spelare med samtycke får utskick. Se `epost.md` för återstående inkoppling. Ingen e-post eller databasändring aktiveras av UI-publiceringen.
