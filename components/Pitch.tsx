/* Planen i dagsljus, som på en söndagsmatch: suddig läktare bakom målet, plåtskyltar, genomskinligt nät och
   bollen på straffpunkten. Bollen skjuts mot hörnet som motsvarar svaret (A uppe vänster, B uppe höger,
   C nere vänster, D nere höger). Rätt svar: mål. Fel svar: bollen räddas ut åt sidan. */
import { BALL_PENTAGONS, BALL_SEAMS } from "./ballPaths";

/** Bollen ritad kring (0,0) med radie 20, med ljus uppe till vänster och skugga i kanten. */
export function BallShape({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-sh`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.75" stopColor="#1E2A22" stopOpacity="0.08" />
          <stop offset="1" stopColor="#1E2A22" stopOpacity="0.45" />
        </radialGradient>
        <clipPath id={`${id}-c`}><circle r="20" /></clipPath>
      </defs>
      <circle r="20" fill="#F7F8F4" />
      <g clipPath={`url(#${id}-c)`}>
        {BALL_SEAMS.map((d, i) => <path key={`s${i}`} d={d} fill="none" stroke="#B9C1BA" strokeWidth="0.7" strokeLinejoin="round" />)}
        {BALL_PENTAGONS.map((d, i) => <path key={`p${i}`} d={d} fill="#141A16" />)}
      </g>
      <circle r="20" fill={`url(#${id}-sh)`} />
      <circle r="19.7" fill="none" stroke="#1E2A22" strokeOpacity="0.4" strokeWidth="0.6" />
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

/** Elva straffar: boll för mål, rött kryss för räddning, gul markering för straffen som skjuts nu. */
export function Kicks({ results, current = -1, total = 11, big = false }: { results: boolean[]; current?: number; total?: number; big?: boolean }) {
  const goals = results.filter(Boolean).length;
  return (
    <div className={`kicks ${big ? "big" : ""}`} role="img" aria-label={`${goals} mål på ${results.length} straffar`}>
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        if (r === true) return <Ball key={i} id={`k${i}`} size={big ? 30 : 22} />;
        if (r === false)
          return (
            <svg key={i} viewBox="0 0 22 22" aria-hidden="true" className="kick">
              <circle cx="11" cy="11" r="9.5" fill="var(--red)" stroke="var(--ink)" strokeWidth="1.5" />
              <path d="M7.5 7.5l7 7m0-7l-7 7" stroke="var(--paper)" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          );
        return (
          <svg key={i} viewBox="0 0 22 22" aria-hidden="true" className="kick">
            {i === current ? (
              <>
                <circle cx="11" cy="11" r="9" fill="var(--mustard)" stroke="var(--ink)" strokeWidth="1.5" />
                <circle cx="11" cy="11" r="3" fill="var(--ink)" />
              </>
            ) : (
              <circle cx="11" cy="11" r="9" fill="none" stroke="var(--tan)" strokeWidth="1.5" strokeDasharray="2 2.5" />
            )}
          </svg>
        );
      })}
    </div>
  );
}

const TARGETS = [
  { x: 136, y: 78 },
  { x: 254, y: 78 },
  { x: 136, y: 104 },
  { x: 254, y: 104 },
];
const SPOT = { x: 195, y: 260 };

export type Shot = "aim" | "goal" | "save" | "late" | "idle";

/* ---------- Målvakten: platt retrofigur med tryckt kontur ---------- */
const INK = "#1E2A22";
const KIT = "#B6422F";
const GLOVE = "#F4EBD9";
const SKIN = "#C98C5A";

/** En arm eller ett ben: mörk kontur under och tröjfärg ovanpå. */
function Limb({ d, w }: { d: string; w: number }) {
  return (
    <>
      <path d={d} stroke={INK} strokeWidth={w + 2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={KIT} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

/** Redo i knäböj, fötterna i (0,0). */
function KeeperReady() {
  return (
    <>
      <ellipse cx="0" cy="0.5" rx="13" ry="2" fill={INK} fillOpacity="0.25" />
      <Limb d="M-3 -17L-8 -9L-9 -2" w={4.6} />
      <Limb d="M3 -17L8 -9L9 -2" w={4.6} />
      <ellipse cx="-10" cy="-1" rx="3.2" ry="1.7" fill={INK} />
      <ellipse cx="10" cy="-1" rx="3.2" ry="1.7" fill={INK} />
      <rect x="-7.5" y="-24" width="15" height="9" rx="2.2" fill={INK} />
      <Limb d="M-7 -34Q-13 -31 -17.5 -25" w={4} />
      <Limb d="M7 -34Q13 -31 17.5 -25" w={4} />
      <path d="M-8 -37.5Q0 -40 8 -37.5L7.6 -21.5H-7.6Z" fill={KIT} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M-3 -38.3L0 -34.5L3 -38.3" stroke={GLOVE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="-18" cy="-24.5" r="3.3" fill={GLOVE} stroke={INK} strokeWidth="1.2" />
      <circle cx="18" cy="-24.5" r="3.3" fill={GLOVE} stroke={INK} strokeWidth="1.2" />
      <circle cx="0" cy="-43" r="4.8" fill={SKIN} stroke={INK} strokeWidth="1.2" />
      <path d="M-4.6 -44A4.8 4.8 0 0 1 4.6 -44Q0 -46 -4.6 -44Z" fill={INK} />
    </>
  );
}

/** Utsträckt i en dykning åt höger, höften i (0,0). Handskarna når ungefär (32,-5). */
function KeeperDive() {
  return (
    <>
      <Limb d="M-1 -1.5L-10 -3.5L-18.5 -2" w={4.6} />
      <Limb d="M-1 2L-10 4L-18 7.5" w={4.6} />
      <ellipse cx="-20" cy="-2" rx="1.8" ry="3.2" fill={INK} />
      <ellipse cx="-19.5" cy="8" rx="1.8" ry="3.2" fill={INK} transform="rotate(20 -19.5 8)" />
      <rect x="-5.5" y="-5" width="9" height="10" rx="2.2" fill={INK} />
      <Limb d="M15 -4.5L29 -8.5" w={4} />
      <Limb d="M15 4L30 -0.5" w={4} />
      <path d="M2 -6.5L16.5 -6Q19.5 0 16.5 6L2 6.5Z" fill={KIT} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M16.5 -2.8L13.5 0L16.5 2.8" stroke={GLOVE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="31" cy="-9.2" r="3.3" fill={GLOVE} stroke={INK} strokeWidth="1.2" />
      <circle cx="32" cy="-1" r="3.3" fill={GLOVE} stroke={INK} strokeWidth="1.2" />
      <circle cx="22.5" cy="0" r="4.8" fill={SKIN} stroke={INK} strokeWidth="1.2" />
      <path d="M23.5 -4.6A4.8 4.8 0 0 1 23.5 4.6Q25.5 0 23.5 -4.6Z" fill={INK} />
    </>
  );
}

/** Var höften hamnar och hur kroppen vrids när handskarna ska nå ett hörn. Högt hörn: kroppen lutar uppåt. */
function diveTo(corner: { x: number; y: number }) {
  const sx = corner.x < 195 ? -1 : 1;
  const high = corner.y < 90;
  const r = high ? -18 : 5;
  const reach = high ? { x: 28.9, y: -14.6 } : { x: 32.3, y: -2.2 };
  return { x: corner.x - sx * reach.x, y: corner.y - reach.y, r, sx };
}

const ADS: [string, string, string][] = [
  ["#1F5A3A", "#F4EBD9", "STRAFFPUNKTEN"],
  ["#F4EBD9", "#B6422F", "11 STRAFFAR"],
  ["#E2A72E", "#1E2A22", "20 SEKUNDER"],
  ["#B6422F", "#F4EBD9", "VARJE DAG"],
];
const CROWD_A: [number, number, number, string][] = [
  [3, 4, 2.2, "#B6422F"], [11, 3, 1.9, "#F8F2E4"], [18, 6, 2.3, "#2F5D8A"], [27, 3, 2, "#E2A72E"], [34, 5, 2.2, "#3F3A33"],
  [43, 2, 1.8, "#C98C5A"], [50, 6, 2.1, "#1F5A3A"], [58, 4, 2.3, "#F8F2E4"], [6, 13, 2, "#E2A72E"], [14, 16, 2.3, "#7A4A2E"],
  [22, 12, 1.9, "#B6422F"], [30, 15, 2.2, "#F8F2E4"], [38, 13, 2, "#2F5D8A"], [46, 16, 2.3, "#E2A72E"], [55, 12, 2, "#3F3A33"],
  [2, 22, 2.1, "#C98C5A"], [10, 24, 1.8, "#1F5A3A"], [19, 21, 2.3, "#F8F2E4"], [26, 24, 2, "#B6422F"], [35, 22, 2.2, "#E2A72E"],
  [42, 25, 1.9, "#2F5D8A"], [51, 21, 2.3, "#B6422F"], [59, 24, 2, "#7A4A2E"],
];
const CROWD_B: [number, number, number, string][] = [
  [5, 5, 2.2, "#F8F2E4"], [20, 11, 2, "#B6422F"], [33, 4, 2.3, "#E2A72E"], [12, 24, 2.1, "#2F5D8A"], [28, 29, 2, "#F8F2E4"], [41, 19, 2.2, "#1F5A3A"],
];
const GRASS = [[118, 8], [126, 9], [135, 11], [146, 13], [159, 15], [174, 18], [192, 21], [213, 25], [238, 29], [267, 33], [300, 38]];

/**
 * Scenen. `compact` beskär läktaren så att frågan får plats under.
 * Bakgrunden ritas bredare än bildytan så att planen fyller ut sidorna när höjden begränsas.
 */
export function Pitch({ shot = "idle", target = 0, compact = false, still = false }: { shot?: Shot; target?: number; compact?: boolean; still?: boolean }) {
  const t = TARGETS[Math.max(0, Math.min(3, target))];
  const out = { x: t.x < 195 ? 84 : 306, y: 112 };
  // Fel svar: målvakten dyker mot bollen och räddar. Rätt svar: han kastar sig åt andra hållet.
  const k = diveTo(shot === "save" ? t : TARGETS[Math.max(0, Math.min(3, target)) ^ 1]);
  const diving = shot === "goal" || shot === "save";
  const style = {
    "--kx": `${k.x}px`, "--ky": `${k.y}px`, "--kr": `${k.r}deg`, "--ksx": k.sx,
    "--sx": `${SPOT.x}px`, "--sy": `${SPOT.y}px`,
    "--tx": `${t.x}px`, "--ty": `${t.y}px`,
    "--ox": `${out.x}px`, "--oy": `${out.y}px`,
  } as React.CSSProperties;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`pitch shot-${shot}`}
      viewBox={compact ? "0 36 390 286" : "0 0 390 300"}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={style}
    >
      <defs>
        <pattern id="crowdA" width="62" height="26" patternUnits="userSpaceOnUse">
          {CROWD_A.map(([cx, cy, r, f], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={f} />)}
        </pattern>
        <pattern id="crowdB" width="46" height="34" patternUnits="userSpaceOnUse" patternTransform="translate(9 5)">
          {CROWD_B.map(([cx, cy, r, f], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={f} />)}
        </pattern>
        <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.5" /></filter>
        <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2A22" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#2B2A22" stopOpacity="0.12" />
          <stop offset="1" stopColor="#2B2A22" stopOpacity="0" />
        </linearGradient>
        <pattern id="net" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0H6M0 0V6" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="0.6" fill="none" />
        </pattern>
      </defs>

      {/* Läktaren, oskarp som i ett foto med fokus på målet */}
      <rect x="-400" y="0" width="1190" height="104" fill="#DCCBA6" />
      <g filter="url(#soft)">
        <rect x="-410" y="-4" width="1210" height="110" fill="url(#crowdA)" opacity="0.75" />
        <rect x="-410" y="-4" width="1210" height="110" fill="url(#crowdB)" opacity="0.55" />
        <path d="M-410 34H800M-410 70H800" stroke="#A8936B" strokeWidth="5" strokeOpacity="0.6" />
      </g>
      <rect x="-400" y="0" width="1190" height="104" fill="url(#roof)" />

      {/* Plåtskyltar */}
      <rect x="-400" y="100" width="1190" height="18" fill="#1E2A22" />
      {[-388, -291, -194, -97, 0, 97, 194, 291, 388, 485].map((x, i) => {
        const [bg, fg, txt] = ADS[i % 4];
        return (
          <g key={x}>
            <rect x={x + 2} y="102" width="93" height="14" rx="1.5" fill={bg} />
            <text x={x + 48.5} y="112.4" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="900" fontSize="8.5" fill={fg} style={{ fontStretch: "125%" }}>{txt}</text>
          </g>
        );
      })}

      {/* Gräs i perspektiv och linjer */}
      {GRASS.map(([y, h], i) => <rect key={y} x="-400" y={y} width="1190" height={h + 0.4} fill={i % 2 ? "#5DA957" : "#529C4D"} />)}
      <g stroke="#FBF7EC" strokeWidth="2" fill="none">
        <path d="M-400 118H790" />
        <path d="M96 118L85 136H305L294 118" />
        <path d="M42 118L-4 202H394L348 118" />
        <path d="M152 202Q195 224 238 202" />
      </g>
      <ellipse cx="195" cy="276" rx="4.2" ry="1.7" fill="#FBF7EC" />

      {/* Målet: genomskinligt nät så att läktaren syns bakom */}
      <path d="M124 72H266V110H124Z" fill="#FFFFFF" fillOpacity="0.12" />
      <g className="netfill">
        <path d="M124 72H266V110H124Z" fill="url(#net)" />
        <path d="M110 60H280L266 72H124Z" fill="url(#net)" />
        <path d="M110 60L124 72V110L110 118Z" fill="url(#net)" />
        <path d="M280 60L266 72V110L280 118Z" fill="url(#net)" />
      </g>
      <path d="M110 60L124 72H266L280 60M124 72V110H266V72M110 118L124 110M280 118L266 110" stroke="#FFFFFF" strokeWidth="1" fill="none" />

      {(shot === "goal" || shot === "save") && (
        <path
          className="trail"
          d={`M${SPOT.x} ${SPOT.y}Q${(SPOT.x + t.x) / 2 + (t.x > 195 ? -8 : 8)} ${t.y + 80} ${t.x} ${t.y}`}
          stroke="#1E2A22" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="1.5 5" strokeLinecap="round" fill="none"
        />
      )}
      {!(still && shot === "goal") && <ellipse cx="198" cy="276" rx="20" ry="3.8" fill="#1E2A22" fillOpacity="0.3" className="shadow" />}
      {/* still: bollen på fast plats (delningsbilden), annars styrs den av CSS-animationen */}
      <g
        className={still ? undefined : "ball"}
        transform={still ? (shot === "goal" ? `translate(${t.x} ${t.y}) scale(0.42)` : `translate(${SPOT.x} ${SPOT.y}) scale(0.85)`) : undefined}
      >
        <BallShape id="pb" />
      </g>

      {/* Målvakten står på mållinjen och dyker när skottet går */}
      {!(still && diving) && (
        <g transform="translate(195 117)">
          <g className={still ? undefined : "k-ready"}><KeeperReady /></g>
        </g>
      )}
      {diving && (
        <g
          className={still ? undefined : "k-dive"}
          transform={still ? `translate(${k.x} ${k.y}) scale(${k.sx} 1) rotate(${k.r})` : undefined}
        >
          <KeeperDive />
        </g>
      )}
      <path d="M110 118V60H280V118" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="square" fill="none" />
      <path d="M112.3 118V62.3H278" stroke="#C9CFC8" strokeWidth="0.9" fill="none" />
    </svg>
  );
}
