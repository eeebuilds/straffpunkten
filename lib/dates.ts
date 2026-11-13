const TZ = "Europe/Stockholm";

/** Dagens datum i Sverige som YYYY-MM-DD. */
export function todaySE(d = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function mondayOf(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function prettyDay(iso: string, withWeekday = true): string {
  const d = new Date(iso + "T12:00:00Z");
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "UTC",
    weekday: withWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
  }).format(d);
}

export function shortDay(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "UTC", day: "numeric", month: "short" }).format(d).replace(".", "");
}

/** Millisekunder kvar till midnatt svensk tid. */
export function msToNextDay(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0);
  const passed = (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000 + now.getMilliseconds();
  return 86400000 - passed;
}

export function hms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return [h, m, r].map(n => String(n).padStart(2, "0")).join(":");
}

export function secs(ms: number | null | undefined): string {
  if (ms == null) return "–";
  return (ms / 1000).toFixed(1).replace(".", ",") + " s";
}
