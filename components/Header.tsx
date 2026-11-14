"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Ball } from "./Pitch";

const LINKS: { href: string; label: string; sub: string }[] = [
  { href: "/", label: "Dagens straffpunkt", sub: "11 frågor" },
  { href: "/topplista", label: "Topplista", sub: "Spelare och lag" },
  { href: "/topplista?flik=lag", label: "Supportertabellen", sub: "Vilka kan mest?" },
  { href: "/ligor", label: "Ligor", sub: "Spela mot gänget" },
  { href: "/klassisk.html#van", label: "Möt en vän", sub: "Samma mobil" },
  { href: "/klassisk.html#traning", label: "Träning", sub: "Välj kategori" },
  { href: "/konto", label: "Mitt konto", sub: "" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="top">
      <div className="top-in">
        <Link
          href="/"
          className="brand"
          aria-label="Straffpunkten, till dagens spel"
          onClick={e => {
            // På startsidan gör en länk till samma sida ingenting, så vi ber spelet börja om i stället.
            if (path !== "/") return;
            e.preventDefault();
            window.dispatchEvent(new Event("straffpunkten:home"));
            window.scrollTo(0, 0);
          }}
        >
          <Ball size={22} id="logo" />
          <b>Straffpunkten</b>
        </Link>
        <button className="menu-btn" aria-label="Öppna menyn" aria-expanded={open} onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h12" />
          </svg>
        </button>
      </div>
      {open && (
        <>
          <div className="drawer-scrim" onClick={() => setOpen(false)} />
          <div className="drawer" role="dialog" aria-modal="true" aria-label="Meny">
            <div className="drawer-head">
              <span>Meny</span>
              <button className="menu-btn" aria-label="Stäng menyn" onClick={() => setOpen(false)} autoFocus>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>
            <nav>
              {LINKS.map(l => (
                <a key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined} onClick={() => setOpen(false)}>
                  {l.label}
                  {l.sub && <small>{l.sub}</small>}
                </a>
              ))}
            </nav>
            <div className="fine">
              <Link href="/integritet">Integritet</Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
