export const metadata = { title: "Integritet – Straffpunkten" };

export default function Integritet() {
  return (
    <main className="page prose">
      <h1>Så hanterar vi dina uppgifter</h1>
      <p>Straffpunkten sparar så lite som möjligt. Här står vad, varför och hur du blir av med det.</p>

      <h2>Utan konto</h2>
      <p>Spelar du utan konto sparas ett slumpat id i din webbläsare. Det kopplar ihop dina resultat så att du kan se din svit. Vi vet inte vem du är.</p>

      <h2>Med konto</h2>
      <ul>
        <li><strong>E-postadress</strong> – för att du ska kunna logga in med en länk. Den visas aldrig för andra.</li>
        <li><strong>Smeknamn</strong> – syns på topplistor och i ligor.</li>
        <li><strong>Resultat</strong> – dina svar, mål och svarstider per dag.</li>
        <li><strong>Samtycke till utskick</strong> – om du har kryssat i rutan. Då kan vi skicka påminnelser och veckans resultat. Du kan ta tillbaka samtycket när du vill under Mitt konto, och varje utskick har en avregistreringslänk.</li>
      </ul>

      <h2>Statistik</h2>
      <p>Vi mäter hur sajten används (till exempel hur många som spelar klart och delar sitt resultat) med Vercel Analytics, som inte använder kakor, och med egna händelser kopplade till ditt slumpade id eller konto.</p>

      <h2>Var datan finns</h2>
      <p>Databasen ligger hos Supabase i EU (Stockholm). Sajten körs hos Vercel.</p>

      <h2>Radera</h2>
      <p>Under Mitt konto kan du radera ditt konto. Då försvinner e-post, smeknamn, resultat och ligor du skapat direkt.</p>
    </main>
  );
}
