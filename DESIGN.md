---
name: Regex For Humans
description: Regex drawn as a transit map. Every readable rule is a station on one line.
colors:
  paper: "#ffffff"
  plate: "#f1f3f6"
  plate-strong: "#e4e8ee"
  ink: "#121820"
  ink-soft: "#48505d"
  rule: "#cfd5dd"
  line-literal: "#d0291c"
  line-set: "#0a5bb5"
  line-repeat: "#18803f"
  line-capture: "#f0a500"
  line-choice: "#6a3fa6"
  board: "#121820"
  board-text: "#ffc23d"
  workshop-paper: "#f4f5f7"
  workshop-focus: "#0a5bb5"
  workshop-dark-paper: "#121820"
  workshop-dark-focus: "#8fc0ff"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(46px, 6.2vw, 88px)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  heading:
    fontFamily: "Bricolage Grotesque, Avenir Next, Segoe UI, sans-serif"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Bricolage Grotesque, Avenir Next, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace"
rounded:
  sm: "6px"
  md: "12px"
  plate: "18px"
  pill: "999px"
spacing:
  track: "8px"
  stop: "22px"
  gutter: "clamp(16px, 4vw, 48px)"
components:
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    height: "48px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
  regex-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-text}"
    rounded: "{rounded.md}"
  rules-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

# Regex For Humans design

## Overview

Regex already has a native drawing: the railroad diagram. This project draws every pattern as one transit line. Each readable rule is a station with its regex fragment printed below it. A test string rides the line, and each station shows the characters it takes. The homepage persuades with that live line. The workshop is a tool and carries the same world with more restraint.

Signage, not dashboards: white enamel ground, near-black ink, thick rounded line strokes, white station discs with black rings, and a black departure board with amber text for the compiled regex.

## Colors

Line colours each do one job. Use them only for that job:

- **Red `#d0291c`**: literal text.
- **Blue `#0a5bb5`**: character sets. Also the workshop focus ring.
- **Green `#18803f`**: repetition. Loops under a station.
- **Amber `#f0a500`**: captures. Never used for body text on white, because its contrast is too low.
- **Violet `#6a3fa6`**: choices and alternation.
- **Ink `#121820`**: anchors (terminus bars), text and borders.

The departure board (`#121820` ground, `#ffc23d` text) holds the compiled regex. Plates (`#f1f3f6`) hold readable rules. The workshop uses `#f4f5f7` as its page ground so its white panels separate, and has a full dark theme whose tokens live in `web/styles.css` under `:root[data-theme="dark"]`. Workshop syntax colours map onto the line colours (keywords blue, strings red, quantifiers green, captures dark amber `#8a5a00`, alternation violet).

## Typography

Bricolage Grotesque (self-hosted, variable 400–800) is the signage voice: tight, heavy headings with negative tracking. Code, regex fragments and taken characters use the system monospace stack. Body copy stays at 16–17px. Nothing functional goes below 11px.

## Layout

The homepage hero is a 5fr/7fr grid: the headline and actions sit on the left, the live line plate on the right. Below 1040px it becomes one column. Below 760px the line turns vertical (a strip map), with stations stacked down a left-hand track. Recipes are grouped into four routes, each a vertical line with its recipes as stops. The workshop keeps its sidebar plus workbench layout.

## Elevation & Depth

Flat. There are no drop shadows and no offset shadows. Separation comes from 2px ink borders, plate tints and the line strokes themselves. The only glow is the red halo on a station where a ride stops.

## Shapes

- **Stations**: circles with a 5–6px ink ring.
- **Termini (anchors)**: rounded black bars.
- **Track**: an 8–10px rounded stroke.
- **Loops**: an open green arc under a repeated station.
- **Buttons and recipe selectors**: pills.
- **Plates**: radius 12–18px with a 2px ink border.

## Components

- **Line** (`#demo-line`): one `li.station` per compiled segment, with rule, stop, fragment and take. Its `data-state` is `taken`, `stop` or `idle`. The trace sentence under the input explains where a ride stops.
- **Header bar**: a 4px rule split into red, blue, green and amber segments, under the site and workshop headers.
- **Step discs** (workshop 01–04): station discs that mark the workflow order (input, output, structure, proof).
- **Route list**: a vertical line with recipe cards as stops.

## Do's and Don'ts

- Do give a new rule kind its line colour, never a decorative one.
- Do keep regex fragments `dir="ltr"` in RTL contexts.
- Do keep the line legible at 320px; it switches to the vertical strip map.
- Don't add eyebrow labels above headings, emoji used as icons, offset or drop shadows, gradient text, or coloured left-border accents.
- Don't use amber for text on white.
- Don't animate when `prefers-reduced-motion` is set: the line draw and hero settle are both disabled.
