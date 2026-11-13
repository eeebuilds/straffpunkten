import { NextResponse } from "next/server";
import questions from "@/data/questions.json";
import { serverRpc } from "@/lib/server";

export const dynamic = "force-dynamic";

/** Synkar frågebanken i data/questions.json till databasen. Ofarlig att anropa flera gånger: befintliga frågor uppdateras. */
export async function GET() {
  const secret = process.env.SEED_SECRET;
  if (!secret) return NextResponse.json({ error: "SEED_SECRET saknas" }, { status: 500 });
  let total = 0;
  const rows = questions as unknown[];
  for (let i = 0; i < rows.length; i += 500) {
    const n = await serverRpc<number>("seed_questions", { p_secret: secret, p_rows: rows.slice(i, i + 500) });
    if (n == null) return NextResponse.json({ error: "Synken misslyckades", done: total }, { status: 500 });
    total += n;
  }
  return NextResponse.json({ synced: total, inFile: rows.length });
}
