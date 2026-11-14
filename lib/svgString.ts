import { Fragment, type ReactNode, type ReactElement } from "react";

/* Gör om en liten React-SVG (som planen och bollen) till en sträng, för delningsbilden.
   Next.js tillåter inte react-dom/server i en route, och komponenterna här är rena funktioner
   utan state, så en enkel genomgång räcker. */

const KEEP_CAMEL = new Set(["viewBox", "preserveAspectRatio", "patternUnits", "patternTransform", "stdDeviation", "gradientUnits", "gradientTransform"]);

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function attrName(k: string) {
  if (k === "className") return "class";
  if (KEEP_CAMEL.has(k)) return k;
  return k.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}

function styleString(style: Record<string, string | number>) {
  return Object.entries(style)
    .map(([k, v]) => `${k.startsWith("--") ? k : k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}:${v}`)
    .join(";");
}

export function svgString(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return esc(String(node));
  if (Array.isArray(node)) return node.map(svgString).join("");
  const el = node as ReactElement<Record<string, unknown>>;
  if (el.type === Fragment) return svgString(el.props.children as ReactNode);
  if (typeof el.type === "function") return svgString((el.type as (p: unknown) => ReactNode)(el.props));
  const tag = el.type as string;
  let attrs = "";
  for (const [k, v] of Object.entries(el.props)) {
    if (k === "children" || v == null || v === false) continue;
    if (k === "style") attrs += ` style="${esc(styleString(v as Record<string, string | number>))}"`;
    else attrs += ` ${attrName(k)}="${esc(String(v))}"`;
  }
  return `<${tag}${attrs}>${svgString(el.props.children as ReactNode)}</${tag}>`;
}
