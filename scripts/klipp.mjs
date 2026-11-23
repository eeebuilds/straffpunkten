// Spelar in ett klipp (1080×1920, 30 bilder/s) från /klipp och gör en MP4 och en bildtext.
// Längd, filnamn och bildtext bestäms av sidan (#clip-data).
// Animationerna pausas och spolas fram till exakt rätt tid för varje bildruta, så resultatet blir jämnt
// oavsett hur snabb datorn är. Kräver Playwright (Chromium) och ffmpeg.
//
//   KLIPP_URL=https://straffpunkten.vercel.app/klipp node scripts/klipp.mjs
//   KLIPP_DAG=2026-11-13 node scripts/klipp.mjs   (annan dag; standard är gårdagen)
//   KLIPP_ID=416 node scripts/klipp.mjs           (en viss fråga som redan spelats)
//   KLIPP_SERIE=blagult node scripts/klipp.mjs    (tre frågor, se lib/clipCopy.ts)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, appendFileSync } from "node:fs";

const base = process.env.KLIPP_URL || "https://straffpunkten.vercel.app/klipp";
const url = process.env.KLIPP_SERIE ? `${base}?serie=${process.env.KLIPP_SERIE}` : process.env.KLIPP_ID ? `${base}?id=${process.env.KLIPP_ID}` : process.env.KLIPP_DAG ? `${base}?dag=${process.env.KLIPP_DAG}` : base;
const FPS = 30, OUT = process.env.KLIPP_UT || "klipp";

rmSync(`${OUT}/bilder`, { recursive: true, force: true });
mkdirSync(`${OUT}/bilder`, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".clip-stage[data-ready]", { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
const data = JSON.parse(await page.locator("#clip-data").textContent());
const name = data.name, SECONDS = data.seconds;

for (let f = 0; f < FPS * SECONDS; f++) {
  const t = (f * 1000) / FPS;
  await page.evaluate(ms => document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; }), t);
  await page.screenshot({ path: `${OUT}/bilder/${String(f).padStart(4, "0")}.png` });
}
await browser.close();

execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${OUT}/bilder/%04d.png`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart",
  `${OUT}/${name}.mp4`,
]);
rmSync(`${OUT}/bilder`, { recursive: true, force: true });

// Bildtext att klistra in på TikTok och Instagram. Den avslöjar aldrig svaret.
const caption = data.caption;
writeFileSync(`${OUT}/${name}.txt`, caption + "\n");
console.log(`Klart: ${OUT}/${name}.mp4`);
if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `KLIPP_NAMN=${name}\n`);
