---
name: Regex For Humans
description: An interlinear gloss. Every regex fragment carries its plain-English meaning underneath, like a translation printed under a line of text.
colors:
  paper: "#ffffff"
  paper-2: "#f5f6f8"
  ink: "#15171c"
  ink-2: "#4b505b"
  ink-3: "#6b707b"
  rule: "#dcdee3"
  blue: "#2337c6"
  blue-ink: "#1a2a9c"
  wash: "#eceffd"
  wash-2: "#d9defb"
  miss: "#b0261b"
  miss-wash: "#fbeceb"
  dark-paper: "#111317"
  dark-paper-2: "#181b21"
  dark-ink: "#eceef2"
  dark-ink-2: "#b4b9c4"
  dark-ink-3: "#9096a2"
  dark-rule: "#2c3039"
  dark-blue: "#93a3ff"
  dark-blue-ink: "#b7c2ff"
  dark-wash: "#1c2142"
  dark-wash-2: "#283063"
  dark-miss: "#ff8a7e"
  workshop-paper: "#f4f5f7"
  workshop-shell: "#15171c"
  workshop-accent: "#b9c3ff"
  workshop-rule-mark: "#e3e7fc"
typography:
  display:
    fontFamily: "Source Serif 4, Charter, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(40px, 5.4vw, 76px)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  display-second-line:
    fontFamily: "Source Serif 4, Charter, Iowan Old Style, Georgia, serif"
    fontStyle: italic
    fontWeight: 400
  body:
    fontFamily: "Source Serif 4, Charter, Iowan Old Style, Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Source Serif 4, Charter, Iowan Old Style, Georgia, serif"
    fontSize: "13-15px"
    fontVariantCaps: all-small-caps
    letterSpacing: "0.06em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
rounded:
  hairline: "2px"
  chip: "3px"
  control: "4px"
  card: "6px"
spacing:
  gutter: "clamp(16px, 4.5vw, 64px)"
  measure: "64ch"
components:
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
    height: "46px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
  take-chip:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.blue-ink}"
    rounded: "{rounded.chip}"
---

# Regex For Humans design

## Overview

The world is the interlinear gloss: the way a scholarly edition prints a line of foreign text and, under each word, its translation. Here the foreign text is a real compiled regex. Under each fragment sits a brace, its meaning in plain English, the groups it belongs to and the characters it took from a sample. The homepage persuades by doing this live for six examples and for any regex the visitor pastes. The workshop is a tool and carries the same type and colour with more restraint.

Print, not dashboard: white paper, near-black ink, one blue, a serif for language and a monospace for regex. The rejected directions are a transit or metro map and a cream-paper look (see PRODUCT.md).

## Colors

One accent, used for one job: **blue `#2337c6`** marks what the compiler produced or matched. It draws the braces under fragments, the taken characters (on the `wash` tint), links and the compiled regex. Everything else is ink on paper in three greys (`ink`, `ink-2`, `ink-3`) with `rule` hairlines. `miss` (red) appears only where a test stops or fails.

Dark mode inverts paper and ink and lifts the blue to `#93a3ff`; tokens live in `site/styles.css` under `prefers-color-scheme: dark`. The workshop has its own token set in `web/styles.css` (light and `:root[data-theme="dark"]`): a grey page ground so its white panels separate, an ink sidebar (`workshop-shell`) with a pale-blue accent, and an editor line highlight (`workshop-rule-mark`) chosen so every syntax colour stays at 4.5:1.

## Typography

Source Serif 4 (self-hosted, variable, with its italic) carries the language: headings at weight 600 with slight negative tracking, the second line of the hero in italic 400, body at 18px. Grammatical words in a gloss (START, END, OR, CAPTURE, ONE OF) and row labels use all-small-caps with 0.06em tracking. JetBrains Mono (self-hosted) is for regex, rules and taken characters; regex is never set in the serif. Both fonts are OFL; their licences sit next to the files.

README and social art are SVG images, where web fonts cannot load: they use Charter/Cambria for the serif (lining figures, so `0` never reads as `o`) and the system monospace stack.

## Layout

A single column on a 64ch measure, centred in a `gutter`. The hero splits headline and summary on wide screens. The gloss is a `<table>`: row 1 regex fragments, row 2 meanings, then one row per group depth, then what each fragment took. Long glosses shrink in two tiers (more than 10 and more than 18 columns) and then scroll sideways; the scroller takes keyboard focus only when it overflows. Code blocks wrap instead of scrolling. Below 640px the alignment diagram switches to a stacked version.

## Elevation & Depth

Flat. No shadows. Separation comes from hairline rules and the `wash` tint.

## Shapes

Small radii only: 2–6px. Braces are drawn as open brackets under fragments; group spans are thinner grey brackets with a small-caps label.

## Components

- **Gloss** (`#demo-line`): built by `drawGloss()` in `site/app.js` from compiler segments. Regex cells carry `data-state` `taken`, `stop` or `idle`; the trace sentence explains where a test stops.
- **Example reel**: six `data-recipe` buttons; the gloss cycles every 6.5s until the visitor hovers, focuses or clicks, and never under reduced motion.
- **Alignment diagram** (`#how`): rules joined by lines to the fragments they compile to, with `compile()` and `regexToRules()` as the two directions.
- **Recipe list**: numbered `(n)` entries with title, regex, example and the limit note.
- **README art**: `scripts/build-readme-art.js` draws the banner, social card and animated reel from real compiler output in the same gloss style.

## Do's and Don'ts

- Do show real compiler output; never a hand-typed regex in a visual.
- Do keep regex `dir="ltr"` in RTL contexts.
- Do write limits next to claims ("shape only", "does not check").
- Don't add a second accent colour, gradients, shadows, emoji as icons, eyebrow labels or numbered section labels on the homepage.
- Don't animate under `prefers-reduced-motion`: the gloss entrance, the reel and the diagram lines all stop.
