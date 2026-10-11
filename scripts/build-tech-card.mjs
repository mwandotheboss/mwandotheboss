// Builds assets/tech.svg, the "Languages and tools" card in README.md.
// Edit AREAS below, then run `node scripts/build-tech-card.mjs` (needs network access to fetch the icons).
//
// Icon sources, written as "source:name":
//   skill:   https://skillicons.dev            e.g. "skill:java"
//   simple:  https://simpleicons.org           e.g. "simple:mqtt"
//   devicon: https://devicon.dev               e.g. "devicon:oracle/oracle-original"
//   lucide:  https://lucide.dev (line glyphs)  e.g. "lucide:cctv"
//   file:    an SVG, or a transparent PNG or WebP, in assets/tech-icons/, e.g. "file:hikcentral.webp"
//   null     no icon yet, draws the item's initials
import { readFile, writeFile } from "node:fs/promises";

const AREAS = [
  ["Languages", [
    ["Java", "skill:java"], ["Kotlin", "skill:kotlin"], ["Dart", "skill:dart"], ["JavaScript", "skill:js"],
    ["TypeScript", "skill:ts"], ["PHP", "skill:php"], ["HTML5", "skill:html"], ["CSS3", "skill:css"],
  ]],
  ["Mobile", [
    ["Android", "skill:androidstudio"], ["Flutter", "skill:flutter"], ["Firebase", "skill:firebase"], ["SQLite", "skill:sqlite"],
    ["Google Maps\nSDK", "simple:googlemaps"],
  ]],
  ["Web and\nbackend", [
    ["React", "skill:react"], ["Angular", "skill:angular"], ["Node.js", "skill:nodejs"], ["Express", "skill:express"],
    ["Sequelize", "skill:sequelize"], ["Bootstrap", "skill:bootstrap"], ["WordPress", "skill:wordpress"],
    ["REST APIs", "lucide:webhook"], ["MQTT", "simple:mqtt"],
  ]],
  ["Databases", [
    ["MySQL", "skill:mysql"], ["PostgreSQL", "skill:postgres"], ["SQLite", "skill:sqlite"], ["Oracle", "devicon:oracle/oracle-original"],
  ]],
  ["Cloud and\ninfrastructure", [
    ["AWS", "skill:aws"], ["Azure", "skill:azure"], ["Google Cloud", "skill:gcp"], ["Docker", "skill:docker"],
    ["Kubernetes", "skill:kubernetes"], ["GitHub\nActions", "skill:githubactions"],
  ]],
  ["Tools and\ndesign", [
    ["Git", "skill:git"], ["GitHub", "skill:github"], ["Postman", "skill:postman"], ["VS Code", "skill:vscode"],
    ["Figma", "skill:figma"], ["Adobe XD", "skill:xd"], ["Photoshop", "skill:ps"], ["Illustrator", "skill:ai"],
    ["Premiere Pro", "skill:pr"],
  ]],
  ["Systems and\nnetworking", [
    ["OS\ndeployment", "lucide:hard-drive-download"], ["Virtual\nmachines", "lucide:layers"], ["Windows\nServer", "skill:windows"],
    ["Linux", "skill:linux"], ["Ubuntu", "skill:ubuntu"], ["CentOS", "simple:centos"],
    ["Active\nDirectory", "file:active-directory.png"], ["LAN / WAN /\nVLAN", "lucide:network"], ["VPNs", "lucide:globe-lock"],
    ["Firewalls", "lucide:brick-wall"], ["Network\nsecurity", "lucide:shield-check"],
  ]],
  ["Security\nsystems", [
    ["CCTV and video\nsurveillance", "lucide:cctv"], ["ANPR", "lucide:scan-text"], ["Access\ncontrol", "lucide:door-open"],
    ["Video\nintercom", "lucide:phone-call"], ["Intrusion\nalarms", "lucide:siren"], ["Smart\nparking", "lucide:square-parking"],
    ["HikCentral", "file:hikcentral.webp"], ["Dahua DSS", "file:dahua-dss.png"],
  ]],
];

const WIDTH = 1280;
const ITEMS_X = 270;
const ITEMS_W = WIDTH - ITEMS_X - 30;
const MAX_PER_LINE = 9;
const LINE_H = 142;
const TILE = 56;
const TILE_TOP = 18;
const PAD_Y = 12;
const FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const cache = new Map();
async function get(url) {
  if (!cache.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
    cache.set(url, await res.text());
  }
  return cache.get(url);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clean = (svg) => svg.replace(/<\?xml[^>]*\?>/g, "").replace(/<!DOCTYPE[^>]*>/gi, "").replace(/<!--[\s\S]*?-->/g, "").trim();

// Makes ids unique per icon so gradients and clip paths from different icons cannot collide.
const prefixIds = (svg, p) =>
  svg
    .replace(/\bid="([^"]+)"/g, `id="${p}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${p}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${p}-$1"`);

// Re-positions a standalone <svg> as a nested one.
function place(svg, x, y, size) {
  return svg.replace(/<svg\b([^>]*)>/, (_, attrs) => {
    const kept = attrs.replace(/\s(?:x|y|width|height)="[^"]*"/g, "");
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}"${kept}>`;
  });
}

const tile = (x, y) => `<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="13" fill="#242938"/>`;

let iconCount = 0;
async function drawIcon(label, icon, x, y) {
  const id = `i${iconCount++}`;
  if (!icon) {
    const initials = label.replace(/\n/g, " ").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return `${tile(x, y)}<text x="${x + TILE / 2}" y="${y + TILE / 2 + 8}" font-size="23" font-weight="700" fill="#7cc4ff" text-anchor="middle">${esc(initials)}</text>`;
  }
  const [source, name] = icon.split(/:(.*)/);
  if (source === "skill") {
    const outer = clean(await get(`https://skillicons.dev/icons?i=${name}`));
    const inner = outer.slice(outer.indexOf("<svg", 4), outer.lastIndexOf("</svg>", outer.length - 7) + 6);
    return place(prefixIds(inner, id), x, y, TILE);
  }
  const pad = 12;
  if (source === "simple") {
    const svg = clean(await get(`https://cdn.simpleicons.org/${name}/white`));
    return tile(x, y) + place(svg, x + pad, y + pad, TILE - pad * 2);
  }
  if (source === "lucide") {
    const svg = clean(await get(`https://unpkg.com/lucide-static@0.460.0/icons/${name}.svg`)).replace(/currentColor/g, "#7cc4ff").replace(/\sclass="[^"]*"/, "");
    return tile(x, y) + place(svg, x + pad, y + pad, TILE - pad * 2);
  }
  if (source === "devicon") {
    const svg = clean(await get(`https://raw.githubusercontent.com/devicons/devicon/master/icons/${name}.svg`));
    return tile(x, y) + place(prefixIds(svg, id), x + 9, y + 9, TILE - 18);
  }
  if (source === "file" && !name.endsWith(".svg")) {
    // Raster logos need a transparent background to sit on the dark tile.
    const type = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" }[name.split(".").pop().toLowerCase()];
    if (!type) throw new Error(`Unsupported image type for ${name}`);
    const data = (await readFile(new URL(`../assets/tech-icons/${name}`, import.meta.url))).toString("base64");
    return `${tile(x, y)}<image x="${x + 8}" y="${y + 8}" width="${TILE - 16}" height="${TILE - 16}" href="data:${type};base64,${data}"/>`;
  }
  if (source === "file") {
    const svg = clean(await readFile(new URL(`../assets/tech-icons/${name}`, import.meta.url), "utf8"));
    return tile(x, y) + place(prefixIds(svg, id), x + 9, y + 9, TILE - 18);
  }
  throw new Error(`Unknown icon source "${icon}" for ${label}`);
}

const textLines = (text, x, y, lineHeight, attrs) =>
  text.split("\n").map((line, i) => `<text x="${x}" y="${y + i * lineHeight}" ${attrs}>${esc(line)}</text>`).join("");

let y = PAD_Y;
const parts = [];
const missing = [];
for (const [title, items] of AREAS) {
  const lineCount = Math.ceil(items.length / MAX_PER_LINE);
  const perLine = Math.ceil(items.length / lineCount);
  const areaH = lineCount * LINE_H;
  if (parts.length) parts.push(`<line x1="40" y1="${y}" x2="${WIDTH - 40}" y2="${y}" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2"/>`);

  const titleLines = title.split("\n").length;
  parts.push(textLines(title.toUpperCase(), 44, y + areaH / 2 - (titleLines - 1) * 12 + 6, 24, `font-size="17" font-weight="700" letter-spacing="1.5" fill="#7cc4ff"`));

  for (let line = 0; line < lineCount; line++) {
    const row = items.slice(line * perLine, (line + 1) * perLine);
    const slot = ITEMS_W / row.length;
    for (const [i, [label, icon]] of row.entries()) {
      const cx = Math.round(ITEMS_X + slot * (i + 0.5));
      const top = y + line * LINE_H + TILE_TOP;
      if (!icon) missing.push(label.replace(/\n/g, " "));
      parts.push(await drawIcon(label, icon, cx - TILE / 2, top));
      parts.push(textLines(label, cx, top + TILE + 25, 21, `font-size="17" font-weight="600" fill="#dbe6ff" text-anchor="middle"`));
    }
  }
  y += areaH;
}
const height = y + PAD_Y;

const summary = AREAS.map(([title, items]) => `${title.replace(/\n/g, " ")}: ${items.map(([l]) => l.replace(/\n/g, " ")).join(", ")}`).join(". ");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${esc(summary)}" font-family="${FONT}">
<title>${esc(summary)}</title>
<defs>
  <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#040b2a"/>
    <stop offset="0.5" stop-color="#081a55"/>
    <stop offset="1" stop-color="#0b2775"/>
  </linearGradient>
</defs>
<rect width="${WIDTH}" height="${height}" rx="18" fill="url(#card-bg)"/>
${parts.join("\n")}
</svg>
`;

await writeFile(new URL("../assets/tech.svg", import.meta.url), svg);
console.log(`Wrote assets/tech.svg (${WIDTH}x${height}, ${(svg.length / 1024).toFixed(0)} KB)`);
if (missing.length) console.log(`No icon yet for: ${missing.join(", ")}`);
