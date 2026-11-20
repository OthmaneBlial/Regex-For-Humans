// Draws the README banner, the social card and the README example reel from real compiler
// output, in the homepage's interlinear-gloss style. Run: node scripts/build-readme-art.js
import { readFileSync, writeFileSync } from "node:fs";
import { compile } from "../index.js";

const recipes = JSON.parse(
  readFileSync(new URL("../test/fixtures/product-scenarios.json", import.meta.url), "utf8"),
);
const recipe = (id) => recipes.find((item) => item.id === id);

const SERIF = "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const STYLE = `<style>
.paper{fill:#fff}.edge{fill:none;stroke:#15171c;stroke-width:2}.ink{fill:#15171c}.ink2{fill:#4b505b}.ink3{fill:#6b707b}
.blue{fill:#2337c6}.wash{fill:#eceffd}.brace{fill:none;stroke:#2337c6;stroke-width:1.5}.span{fill:none;stroke:#6b707b;stroke-width:1}
.sc{letter-spacing:.08em}
@media (prefers-color-scheme:dark){.paper{fill:#111317}.edge{stroke:#eceef2}.ink{fill:#eceef2}.ink2{fill:#b4b9c4}.ink3{fill:#9096a2}
.blue{fill:#93a3ff}.wash{fill:#1c2142}.brace{stroke:#93a3ff}.span{stroke:#9096a2}}
</style>`;

const xml = (text) =>
  String(text).replace(
    /[&<>"]/gu,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const bracketKinds = new Set(["group", "alternation", "assertion"]);
const opens = (s) => s.edge === "start" && bracketKinds.has(s.kind);
const closes = (s) => s.edge === "end" && bracketKinds.has(s.kind);
const structural = (s) => s.kind === "group" && !s.capturing && !s.modifiers && !s.repetition;

function meaning(s) {
  if (s.kind === "alternation" && s.edge === "branch") return { text: "OR", caps: true };
  if (s.kind === "anchor" || s.kind === "boundary")
    return { text: s.text.toUpperCase(), caps: true };
  if (opens(s) || closes(s)) return { text: "" };
  return { text: s.text };
}

function spanLabel(s) {
  const text = s.text.replace(/\s*\{$/u, "");
  const named = /^capture "(.+)"$/u.exec(text);
  if (named) return `CAPTURE ${named[1]}`;
  if (s.kind === "alternation") return "ONE OF";
  if (s.repetition?.kind === "exact") return `${s.repetition.min} TIMES`;
  return text.toUpperCase();
}

/** Which characters each atom takes from `sample`, by wrapping atoms in captures (see site/app.js). */
function takes(segments, compiled, sample) {
  const parts = [];
  const atoms = new Map();
  let count = 0;
  for (const [index, s] of segments.entries()) {
    if (s.kind === "backreference" && typeof s.reference !== "string") return new Map();
    if (opens(s) && s.kind === "group" && s.capturing) count += 1;
    if (
      opens(s) ||
      closes(s) ||
      s.edge === "branch" ||
      s.kind === "anchor" ||
      s.kind === "boundary" ||
      !s.source
    )
      parts.push(s.source);
    else {
      atoms.set(index, ++count);
      parts.push(`(${s.source})`);
    }
  }
  const flags = compiled.flags.replace(/[gyd]/gu, "");
  const found = new RegExp(parts.join(""), `${flags}d`).exec(sample);
  const result = new Map();
  if (!found) throw new Error(`Sample ${sample} does not match ${compiled.source}`);
  for (const [index, group] of atoms) {
    const span = found.indices[group];
    if (span && span[1] > span[0])
      result.set(index, sample.slice(span[0], span[1]).replaceAll(" ", "␣"));
  }
  return result;
}

/** Lay out one gloss: regex row, meaning row, group brackets and (optionally) what each part takes. */
function gloss(id, sample, size) {
  const compiled = compile(recipe(id).rules);
  const segments = compiled.segments;
  if (segments.map((s) => s.source).join("") !== compiled.source)
    throw new Error(`${id}: segments`);
  const R = size;
  const M = Math.round(R * 0.42);
  const charW = R * 0.6;
  const gap = R * 0.42;
  const taken = sample ? takes(segments, compiled, sample) : new Map();
  const columns = [];
  let x = 0;
  for (const [index, s] of segments.entries()) {
    if (!s.source) continue;
    const joint = opens(s) || closes(s);
    const fs = joint ? R * 0.42 : R;
    const codeW = s.source.length * fs * 0.6;
    const m = meaning(s);
    const labelW = m.text.length * M * (m.caps ? 0.62 : 0.5);
    const width = joint ? codeW + gap * 0.5 : Math.max(codeW, labelW) + gap;
    columns.push({ index, s, joint, fs, codeW, m, x, width, take: taken.get(index) });
    x += width;
  }
  const spans = [];
  const stack = [];
  for (const [index, s] of segments.entries()) {
    if (opens(s)) stack.push(index);
    else if (closes(s)) {
      const open = stack.pop();
      if (open === undefined || structural(segments[open])) continue;
      const inside = columns.filter((c) => c.index > open && c.index < index);
      if (!inside.length) continue;
      spans.push({
        label: spanLabel(segments[open]),
        from: inside[0].x,
        to: inside.at(-1).x + inside.at(-1).width - gap,
        depth: stack.filter((item) => !structural(segments[item])).length,
      });
    }
  }
  const depth = spans.reduce((most, span) => Math.max(most, span.depth + 1), 0);
  const yCode = R;
  const yBrace = R * 1.3;
  const yMean = yBrace + M * 1.7;
  const spanRow = M * 2.6;
  const ySpan0 = yMean + M * 1.6;
  const yTake = ySpan0 + depth * spanRow + (sample ? R * 0.35 : 0);
  const out = [];
  for (const c of columns) {
    const cx = c.x + (c.width - (c.joint ? gap * 0.5 : gap)) / 2;
    const left = cx - c.codeW / 2;
    out.push(
      `<text x="${left.toFixed(1)}" y="${(c.joint ? yCode - R * 0.12 : yCode).toFixed(1)}" font-size="${c.fs.toFixed(1)}" textLength="${c.codeW.toFixed(1)}" lengthAdjust="spacingAndGlyphs" class="${c.joint ? "ink3" : "ink"}" font-family="${MONO}">${xml(c.s.source)}</text>`,
    );
    if (c.joint) continue;
    const b0 = left;
    const b1 = left + c.codeW;
    out.push(
      `<path class="brace" d="M${b0.toFixed(1)} ${yBrace - 6} V${yBrace} H${b1.toFixed(1)} V${yBrace - 6}"/>`,
    );
    if (c.m.text)
      out.push(
        `<text x="${cx.toFixed(1)}" y="${yMean.toFixed(1)}" font-size="${c.m.caps ? M * 0.78 : M}" text-anchor="middle" class="${c.m.caps ? "ink2 sc" : "ink"}" font-family="${SERIF}">${xml(c.m.text)}</text>`,
      );
    if (c.take) {
      const w = c.take.length * M * 0.62 + M * 0.9;
      out.push(
        `<rect class="wash" x="${(cx - w / 2).toFixed(1)}" y="${(yTake - M * 1.1).toFixed(1)}" width="${w.toFixed(1)}" height="${(M * 1.55).toFixed(1)}" rx="3"/>`,
        `<text x="${cx.toFixed(1)}" y="${yTake.toFixed(1)}" font-size="${M}" text-anchor="middle" class="blue" font-family="${MONO}">${xml(c.take)}</text>`,
      );
    }
  }
  for (const span of spans) {
    // The innermost bracket sits nearest the fragments.
    const y = ySpan0 + (depth - 1 - span.depth) * spanRow;
    out.push(
      `<path class="span" d="M${span.from.toFixed(1)} ${y - 6} V${y} H${span.to.toFixed(1)} V${y - 6}"/>`,
      `<text x="${((span.from + span.to) / 2).toFixed(1)}" y="${(y + M * 1.1).toFixed(1)}" font-size="${(M * 0.74).toFixed(1)}" text-anchor="middle" class="ink2 sc" font-family="${SERIF}">${xml(span.label)}</text>`,
    );
  }
  const height = (sample ? yTake + M * 0.6 : ySpan0 + depth * spanRow) + 4;
  return { body: out.join("\n"), width: x - gap, height, compiled };
}

function placed(g, x, y, maxWidth, maxHeight) {
  const scale = Math.min(1, maxWidth / g.width, maxHeight / g.height);
  const left = x + (maxWidth - g.width * scale) / 2;
  return `<g transform="translate(${left.toFixed(1)} ${y}) scale(${scale.toFixed(3)})">\n${g.body}\n</g>`;
}

function title(x, y, size) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="600" class="ink" font-family="${SERIF}">Regex <tspan font-style="italic" font-weight="400">for</tspan> Humans</text>`;
}

function card(width, height, sizes) {
  const g = gloss("hex-color", "#ff6b6b", sizes.regex);
  const rulesText = recipe("hex-color").rules.trim().split("\n").join("   ·   ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">Regex For Humans</title>
<desc id="desc">The rules start, "#", 6 hex digits, end compile to the JavaScript regex ${xml(g.compiled.source)}. Under each fragment is its meaning in plain English and the part of #ff6b6b it matches.</desc>
${STYLE}
<rect class="paper" width="${width}" height="${height}" rx="20"/>
<rect class="edge" x="1" y="1" width="${width - 2}" height="${height - 2}" rx="19"/>
${title(64, sizes.titleY, sizes.title)}
<text x="64" y="${sizes.titleY + sizes.tag * 1.7}" font-size="${sizes.tag}" class="ink2" font-family="${SERIF}">Write regex in plain English. <tspan font-style="italic">Read any regex the same way.</tspan></text>
<text x="64" y="${sizes.rulesY}" font-size="${sizes.rules}" class="ink" font-family="${MONO}">${xml(rulesText)}</text>
<text x="${width - 64}" y="${sizes.rulesY}" font-size="${sizes.rules * 0.9}" text-anchor="end" class="blue" font-family="${MONO}">compile() ↓   ↑ regexToRules()</text>
<line x1="64" x2="${width - 64}" y1="${sizes.rulesY + 22}" y2="${sizes.rulesY + 22}" class="span"/>
${placed(g, 64, sizes.glossY, width - 128, height - sizes.glossY - 30)}
</svg>
`;
}

const REEL = [
  ["clock-time", "23:59"],
  ["log-fields", "WARN code=404"],
  ["repeated-word", "hello hello"],
  ["date-shape", "2026-09-30"],
  ["file-extension", "notes.md"],
  ["version-shape", "1.12.0"],
];

function reel() {
  const width = 1200;
  const height = 420;
  const seconds = 4;
  const total = REEL.length * seconds;
  const frames = REEL.map(([id, sample], k) => {
    const r = recipe(id);
    const g = gloss(id, sample, 44);
    const rules = r.rules
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .join("  ");
    const lines = [];
    let current = "";
    for (const word of rules.split("  ")) {
      if ((current + word).length > 92) {
        lines.push(current.trim());
        current = "";
      }
      current += `${word}   `;
    }
    lines.push(current.trim());
    if (lines.length > 2) lines[1] += " …";
    const ruleText = lines
      .slice(0, 2)
      .map(
        (line, i) =>
          `<text x="64" y="${112 + i * 26}" font-size="17" class="ink" font-family="${MONO}">${xml(line)}</text>`,
      )
      .join("\n");
    return `<g class="frame" style="animation-delay:${k * seconds}s"${k === 0 ? "" : ' opacity="0"'}>
<text x="64" y="64" font-size="15" class="ink3 sc" font-family="${SERIF}">(${k + 1}) RULES</text>
<text x="${width - 64}" y="64" font-size="22" text-anchor="end" class="ink" font-family="${SERIF}">${xml(r.title)}</text>
${ruleText}
<text x="64" y="186" font-size="15" class="blue" font-family="${MONO}">↓ compile()   /${xml(g.compiled.source)}/${g.compiled.flags}</text>
${placed(g, 64, 210, width - 128, height - 236)}
</g>`;
  });
  const fade = (seconds / total) * 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">Six recipes, glossed</title>
<desc id="desc">An animation cycling through six recipes: 24-hour time, log fields, a repeated word, a date, a file extension and a version. Each shows its rules, the compiled regex, the meaning of every fragment and what it matches in a sample.</desc>
${STYLE.replace(
  "</style>",
  `.frame{animation:cycle ${total}s infinite both}
.frame:not(:first-of-type){opacity:0}
@keyframes cycle{0%{opacity:0}2%{opacity:1}${(fade - 2).toFixed(1)}%{opacity:1}${fade.toFixed(1)}%{opacity:0}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.frame{animation:none}.frame:first-of-type{opacity:1}}
</style>`,
)}
<rect class="paper" width="${width}" height="${height}" rx="20"/>
<rect class="edge" x="1" y="1" width="${width - 2}" height="${height - 2}" rx="19"/>
${frames.join("\n")}
</svg>
`;
}

const assets = new URL("../site/assets/", import.meta.url);
writeFileSync(
  new URL("readme-banner.svg", assets),
  card(1200, 470, {
    title: 50,
    titleY: 92,
    tag: 22,
    rules: 18,
    rulesY: 196,
    regex: 54,
    glossY: 236,
  }),
);
writeFileSync(
  new URL("social-card.svg", assets),
  card(1200, 630, {
    title: 64,
    titleY: 116,
    tag: 27,
    rules: 20,
    rulesY: 250,
    regex: 66,
    glossY: 300,
  }),
);
writeFileSync(new URL("readme-reel.svg", assets), reel());
process.stdout.write(
  "Built readme-banner.svg, social-card.svg and readme-reel.svg in site/assets.\n",
);
