"use client";

const PREFIX = "sp:";

export function lsGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

/** Slumpat id per webbläsare, så att man kan spela utan konto. */
export function guestId(): string {
  let id = lsGet<string>("guest");
  if (!id) {
    id = crypto.randomUUID();
    lsSet("guest", id);
  }
  return id;
}
