/* Planen under strålkastarna: målet, straffområdet och bollen på straffpunkten.
   Bollen skjuts mot hörnet som motsvarar svaret (A uppe vänster, B uppe höger, C nere vänster, D nere höger).
   Rätt svar: mål i det hörnet. Fel svar: bollen går mot hörnet men räddas ut åt sidan. */

const SEAMS =
  "M0 -6.2L0 -12.5M0 -12.5L8.3 -11.5M0 -12.5L-8.3 -11.5M5.9 -1.9L11.9 -3.9M11.9 -3.9L13.5 4.4M11.9 -3.9L8.3 -11.5M3.6 5L7.3 10.1M7.3 10.1L0 14.2M7.3 10.1L13.5 4.4M-3.6 5L-7.3 10.1M-7.3 10.1L-13.5 4.4M-7.3 10.1L0 14.2M-5.9 -1.9L-11.9 -3.9M-11.9 -3.9L-8.3 -11.5M-11.9 -3.9L-13.5 4.4";
const PATCHES = [
  "0,-6.2 5.9,-1.9 3.6,5 -3.6,5 -5.9,-1.9",
  "8.3,-11.5 5.9,-19.1 12.3,-23.8 18.8,-19.1 16.3,-11.5",
  "13.5,4.4 20,-0.3 26.4,4.4 24,12 16,12",
  "0,14.2 6.5,18.9 4,26.5 -4,26.5 -6.5,18.9",
  "-13.5,4.4 -16,12 -24,12 -26.4,4.4 -20,-0.3",
  "-8.3,-11.5 -16.3,-11.5 -18.8,-19.1 -12.3,-23.8 -5.9,-19.1",
];

/** Bollen ritad kring (0,0) med radie 20. */
export function BallShape({ id }: { id: string }) {
  return (
    <g>
      <clipPath id={id}><circle r="20" /></clipPath>
      <circle r="20" fill="#F6F7F2" />
      <g clipPath={`url(#${id})`} fill="#0B1A12">
        {PATCHES.map((p, i) => <polygon key={i} points={p} />)}
      </g>
      <circle r="19.4" fill="none" stroke="#0B1A12" strokeWidth="1.2" />
      <path d={SEAMS} stroke="#0B1A12" strokeWidth="1" strokeOpacity="0.55" fill="none" />
    </g>
  );
}

export function Ball({ size = 22, id = "b" }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="-21 -21 42 42" aria-hidden="true" className="ball-ico">
      <BallShape id={id} />
    </svg>
  );
}

/** Elva straffar: boll för mål, rött kryss för räddning, gul ring för straffen som skjuts nu. */
export function Kicks({ results, current = -1, total = 11, big = false }: { results: boolean[]; current?: number; total?: number; big?: boolean }) {
  const goals = results.filter(Boolean).length;
  return (
    <div className={`kicks ${big ? "big" : ""}`} role="img" aria-label={`${goals} mål på ${results.length} straffar`}>
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        if (r === true) return <Ball key={i} id={`k${i}`} size={big ? 30 : 20} />;
        if (r === false)
          return (
            <svg key={i} viewBox="0 0 20 20" aria-hidden="true" className="kick">
              <circle cx="10" cy="10" r="9" fill="var(--bad)" />
              <path d="M6.5 6.5l7 7m0-7l-7 7" stroke="var(--night)" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          );
        return (
          <svg key={i} viewBox="0 0 20 20" aria-hidden="true" className="kick">
            {i === current
              ? <circle cx="10" cy="10" r="8" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
              : <circle cx="10" cy="10" r="8" fill="var(--dim)" />}
          </svg>
        );
      })}
    </div>
  );
}

const TARGETS = [
  { x: 130, y: 96 },
  { x: 260, y: 96 },
  { x: 130, y: 126 },
  { x: 260, y: 126 },
];

export type Shot = "aim" | "goal" | "save" | "late" | "idle";

/**
 * Scenen. `compact` beskär himlen så att frågan får plats under.
 * `timeLeft` (0–1) ritar klockan som en ring runt bollen.
 */
export function Pitch({ shot = "idle", target = 0, timeLeft, compact = false }: { shot?: Shot; target?: number; timeLeft?: number; compact?: boolean }) {
  const t = TARGETS[Math.max(0, Math.min(3, target))];
  const out = { x: t.x < 195 ? 62 : 328, y: 150 };
  const ring = 2 * Math.PI * 31;
  const style = {
    "--tx": `${t.x}px`, "--ty": `${t.y}px`,
    "--ox": `${out.x}px`, "--oy": `${out.y}px`,
  } as React.CSSProperties;
  return (
    <svg
      className={`pitch shot-${shot}`}
      viewBox={compact ? "0 56 390 270" : "0 0 390 330"}
      width="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={style}
    >
      <defs>
        <pattern id="net" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 0L7 7M7 0L0 7" stroke="#F3F5EF" strokeOpacity="0.28" strokeWidth="0.8" />
        </pattern>
        <radialGradient id="flood" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4C8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF4C8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="390" height="330" fill="#06120D" />
      <rect y="64" width="390" height="76" fill="#0B1E16" />
      <path d="M0 82H390M0 100H390M0 118H390" stroke="#13301F" />
      <circle cx="44" cy="22" r="110" fill="url(#flood)" opacity="0.7" />
      <circle cx="346" cy="22" r="110" fill="url(#flood)" opacity="0.7" />
      <g fill="#FFF6D6" className="lamps-top">
        <rect x="24" y="14" width="40" height="16" rx="2" />
        <rect x="326" y="14" width="40" height="16" rx="2" />
      </g>
      <path d="M34 14V30M44 14V30M54 14V30M24 22H64M336 14V30M346 14V30M356 14V30M326 22H366" stroke="#06120D" strokeWidth="1.5" />
      {[[140, 12, 0], [152, 14, 1], [166, 17, 0], [183, 20, 1], [203, 24, 0], [227, 29, 1], [256, 35, 0], [291, 39, 1]].map(([y, h, b]) => (
        <rect key={y} y={y} width="390" height={h} fill={b ? "#22703F" : "#1B5C34"} />
      ))}
      <g stroke="#F3F5EF" strokeOpacity="0.75" strokeWidth="2" fill="none">
        <path d="M0 140H390" />
        <path d="M92 140L80 162H310L298 140" />
        <path d="M40 140L4 226H386L350 140" />
        <path d="M150 226Q195 250 240 226" />
      </g>
      <ellipse cx="195" cy="294" rx="4" ry="2" fill="#F3F5EF" fillOpacity="0.8" />
      <rect x="104" y="78" width="182" height="62" fill="#0A1A12" />
      <rect x="104" y="78" width="182" height="62" fill="url(#net)" className="netfill" />
      <path d="M104 78L120 90H270L286 78M120 90V130M270 90V130" stroke="#F3F5EF" strokeOpacity="0.4" strokeWidth="1.2" fill="none" />

      {(shot === "goal" || shot === "save") && (
        <path
          className="trail"
          d={`M195 272Q${(195 + t.x) / 2} ${t.y + 70} ${t.x} ${t.y}`}
          stroke="#FFD23F" strokeOpacity="0.85" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" fill="none"
        />
      )}

      <ellipse cx="197" cy="296" rx="23" ry="5" fill="#000" fillOpacity="0.35" className="shadow" />
      {shot === "aim" && timeLeft != null && (
        <g>
          <circle cx="195" cy="272" r="31" fill="none" stroke="#06120D" strokeOpacity="0.45" strokeWidth="5" />
          <circle
            cx="195" cy="272" r="31" fill="none"
            stroke={timeLeft < 0.25 ? "#FF6B57" : "#FFD23F"} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${(ring * Math.max(0, timeLeft)).toFixed(1)} ${ring.toFixed(1)}`}
            transform="rotate(-90 195 272)"
          />
        </g>
      )}
      <g className="ball">
        <BallShape id="pb" />
      </g>
      <path d="M104 140V78H286V140" stroke="#F6F7F2" strokeWidth="5" strokeLinecap="square" fill="none" />
    </svg>
  );
}
