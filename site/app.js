const assetSearch = new URL(import.meta.url).search;

const input = document.getElementById("demo-input");
const result = document.getElementById("demo-result");
let pattern;
result.textContent = "Loading…";

const sampleInputs = {
  "hex-color": "#ff6b6b",
  "prefixed-identifier": "ABC123",
  "version-shape": "1.2.3",
  "calendar-date": "2026-09-30",
  "ipv4-address": "192.168.1.1",
  "log-fields": "WARN code=404",
};

let statusResetTimer;
let copySequence = 0;
const copyStatus = document.getElementById("copy-status");
const copyControls = [...document.querySelectorAll("[data-copy]")].map((button) => ({
  button,
  label: button.textContent,
  resetTimer: undefined,
}));
for (const control of copyControls) {
  const { button, label } = control;
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    const request = ++copySequence;
    const focused = document.activeElement;
    window.clearTimeout(control.resetTimer);
    button.textContent = label;
    window.clearTimeout(statusResetTimer);
    copyStatus.textContent = "";
    let requestTimer;
    try {
      await Promise.race([
        navigator.clipboard.writeText(source.textContent.trim()),
        new Promise((_, reject) => {
          requestTimer = window.setTimeout(
            () => reject(new Error("Clipboard request timed out")),
            1000,
          );
        }),
      ]);
      if (request !== copySequence) return;
      copyStatus.textContent = `${label.replace("Copy ", "")} copied. Ready to paste!`;
      button.textContent = "Copied ✓";
      control.resetTimer = window.setTimeout(() => {
        button.textContent = label;
      }, 1800);
      statusResetTimer = window.setTimeout(() => {
        copyStatus.textContent = "";
      }, 1800);
    } catch {
      if (request !== copySequence) return;
      const selection = window.getSelection();
      if (selection && document.activeElement === focused) {
        selection.selectAllChildren(source);
        copyStatus.textContent =
          "Clipboard access is unavailable. The text is selected; press your keyboard copy shortcut.";
      } else {
        copyStatus.textContent = "Clipboard access is unavailable. Select the text to copy it.";
      }
    } finally {
      window.clearTimeout(requestTimer);
    }
  });
  button.disabled = false;
}

const line = document.getElementById("demo-line");
const scroller = document.getElementById("gloss-scroll");
const trace = document.getElementById("demo-trace");
/** @type {{cell: HTMLTableCellElement, take: HTMLTableCellElement, index: number}[]} */
let columns = [];
/** @type {Map<number, HTMLElement>} */
let spanLabels = new Map();
let segments = [];
let probe = null;

function part(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

const smallCaps = (text) => part("span", "sc", text);
// Anchors also carry an edge; only groups, choices and lookarounds open and close a span.
const bracketKinds = new Set(["group", "alternation", "assertion"]);
const opens = (segment) => segment.edge === "start" && bracketKinds.has(segment.kind);
const closes = (segment) => segment.edge === "end" && bracketKinds.has(segment.kind);
/** A plain group only orders rules; it gets no bracket of its own. */
const structural = (segment) =>
  segment.kind === "group" && !segment.capturing && !segment.modifiers && !segment.repetition;

/** The plain-English gloss under one fragment; grammatical words are small caps. */
function meaning(segment) {
  if (segment.kind === "alternation" && segment.edge === "branch") return smallCaps("or");
  if (segment.kind === "anchor" || segment.kind === "boundary") return smallCaps(segment.text);
  if (opens(segment) || closes(segment)) return document.createTextNode("");
  return document.createTextNode(segment.text);
}

/** "capture "year" {" → CAPTURE year. */
function spanLabel(segment) {
  const label = part("span");
  const text = segment.text.replace(/\s*\{$/u, "");
  const named = /^capture "(.+)"$/u.exec(text);
  if (named) label.append(smallCaps("capture "), part("b", "", named[1]));
  else if (segment.kind === "alternation") label.append(smallCaps("one of"));
  else if (segment.repetition?.kind === "exact")
    label.append(smallCaps(`${segment.repetition.min} times`));
  else label.append(smallCaps(text));
  return label;
}

/** A long gloss scrolls sideways; only then does it need to take keyboard focus. */
function keyboardScroll() {
  if (scroller.scrollWidth > scroller.clientWidth) scroller.tabIndex = 0;
  else scroller.removeAttribute("tabindex");
}
window.addEventListener("resize", keyboardScroll);

/** Set the regex as a source line with its gloss, group brackets and a row for matched text. */
function drawGloss(compiled) {
  segments = compiled.segments;
  const regexRow = part("tr", "row-regex");
  const meaningRow = part("tr", "row-meaning");
  const takeRow = part("tr", "row-take");
  regexRow.append(Object.assign(part("th", "", "regex"), { scope: "row" }));
  meaningRow.append(Object.assign(part("th", "", "means"), { scope: "row" }));
  takeRow.append(Object.assign(part("th", "", "takes"), { scope: "row" }));
  columns = [];
  const columnOf = new Map();
  segments.forEach((segment, index) => {
    if (!segment.source) return;
    const joint = opens(segment) || closes(segment);
    const cell = part("td", joint ? "joint" : "");
    cell.style.setProperty("--i", String(columns.length));
    cell.append(part("code", "", segment.source));
    const gloss = part("td", joint ? "joint" : "");
    gloss.style.setProperty("--i", String(columns.length));
    gloss.append(meaning(segment));
    const take = part("td");
    take.style.setProperty("--i", String(columns.length));
    regexRow.append(cell);
    meaningRow.append(gloss);
    takeRow.append(take);
    columnOf.set(index, columns.length);
    columns.push({ cell, take, index });
  });
  // Brackets: one row per nesting depth, innermost nearest the gloss.
  const spans = [];
  const stack = [];
  segments.forEach((segment, index) => {
    if (opens(segment))
      stack.push({ index, from: columns.findIndex((column) => column.index >= index) });
    else if (closes(segment)) {
      const open = stack.pop();
      if (!open || structural(segments[open.index])) return;
      let to = -1;
      for (const [position, column] of columns.entries()) if (column.index <= index) to = position;
      if (open.from >= 0 && to >= open.from)
        spans.push({
          index: open.index,
          from: open.from,
          to,
          depth: stack.filter((item) => !structural(segments[item.index])).length,
        });
    }
  });
  const depth = spans.reduce((most, span) => Math.max(most, span.depth + 1), 0);
  const groupRows = [];
  spanLabels = new Map();
  for (let level = depth - 1; level >= 0; level -= 1) {
    const row = part("tr", "row-group");
    row.append(
      Object.assign(part("th", "", level === depth - 1 ? "groups" : ""), { scope: "row" }),
    );
    let position = 0;
    for (const span of spans
      .filter((item) => item.depth === level)
      .sort((a, b) => a.from - b.from)) {
      for (; position < span.from; position += 1) row.append(part("td"));
      const cell = part("td");
      cell.colSpan = span.to - span.from + 1;
      const label = part("span", "span");
      label.append(spanLabel(segments[span.index]));
      cell.append(label);
      row.append(cell);
      spanLabels.set(span.index, label);
      position = span.to + 1;
    }
    for (; position < columns.length; position += 1) row.append(part("td"));
    groupRows.push(row);
  }
  const body = part("tbody");
  body.append(regexRow, meaningRow, ...groupRows, takeRow);
  line.replaceChildren(body);
  line.classList.toggle("long", columns.length > 10);
  line.classList.toggle("longer", columns.length > 18);
  keyboardScroll();
  line.classList.remove("drawing");
  void line.offsetWidth;
  line.classList.add("drawing");
  probe = buildProbe(compiled);
}

/** Wrap every atom in its own capture so `d` indices say which characters it took. */
function buildProbe(compiled) {
  if (segments.map((segment) => segment.source).join("") !== compiled.source) return null;
  const parts = [];
  const cuts = [0];
  const atoms = new Map();
  const captures = new Map();
  let count = 0;
  let depth = 0;
  for (const [index, segment] of segments.entries()) {
    // Renumbering would break a numbered back reference.
    if (segment.kind === "backreference" && typeof segment.reference !== "string") return null;
    if (opens(segment)) {
      if (segment.kind === "group" && segment.capturing) captures.set(index, ++count);
      depth += 1;
      parts.push(segment.source);
    } else if (closes(segment)) {
      depth -= 1;
      parts.push(segment.source);
    } else if (
      segment.edge === "branch" ||
      segment.kind === "anchor" ||
      segment.kind === "boundary" ||
      !segment.source
    ) {
      parts.push(segment.source);
    } else {
      atoms.set(index, ++count);
      parts.push(`(${segment.source})`);
    }
    if (depth === 0) cuts.push(parts.length);
  }
  try {
    const flags = compiled.flags.replace(/[gy]/gu, "");
    new RegExp(parts.join(""), flags.includes("d") ? flags : `${flags}d`);
    return {
      parts,
      cuts,
      atoms,
      captures,
      flags: flags.includes("d") ? flags : `${flags}d`,
      anchored: segments[0]?.source.startsWith("^"),
    };
  } catch {
    return null;
  }
}

/** Show which characters each fragment takes, or where an anchored pattern stops. */
function ride(text, matched) {
  for (const { cell, take } of columns) {
    cell.dataset.state = !probe && matched ? "taken" : "idle";
    take.replaceChildren();
  }
  for (const label of spanLabels.values()) label.querySelector(".value")?.remove();
  trace.textContent = "";
  if (!probe || text === null) return;
  const run = (cut) => new RegExp(probe.parts.slice(0, cut).join(""), probe.flags).exec(text);
  let reached = probe.cuts.length - 1;
  let found = run(probe.cuts[reached]);
  if (!found) {
    if (!probe.anchored) return;
    do found = run(probe.cuts[--reached]);
    while (!found && reached > 1);
    if (!found) return;
  }
  const done = probe.cuts[reached];
  for (const { cell, take, index } of columns) {
    if (index >= done) break;
    cell.dataset.state = "taken";
    const span = found.indices?.[probe.atoms.get(index)];
    if (span) take.append(part("code", "", text.slice(span[0], span[1]) || "(empty)"));
  }
  for (const [index, label] of spanLabels) {
    const span = found.indices?.[probe.captures.get(index)];
    if (span && index < done)
      label.append(part("span", "value", ` = ${text.slice(span[0], span[1])}`));
  }
  if (done === segments.length) return;
  const stop = columns.find((column) => column.index >= done);
  if (!stop) return;
  const segment = segments[stop.index];
  stop.cell.dataset.state = "stop";
  stop.take.append(part("span", "stop", "stops here"));
  const before = found[0] ? `take “${found[0]}”` : "take nothing";
  // Literal rules already carry their own quotes ("ABC").
  const name = segment.text.startsWith('"')
    ? segment.text
    : `“${segment.text.replace(/\s*\{$/u, "")}”`;
  trace.textContent =
    segment.source === "$"
      ? `Stops at “end”: the rules before it ${before}, but the text does not end there.`
      : `Stops at ${name}: the rules before it ${before}, then this rule cannot continue.`;
}

try {
  const { compile, toRegExp, regexToRules } = await import(`./workshop/index.js${assetSearch}`);
  const initial = compile(document.getElementById("rules-code").textContent);
  // g and y make test() stateful; the demo checks each text from the start.
  const testable = (compiled) => {
    const regex = toRegExp(compiled);
    return new RegExp(regex.source, regex.flags.replace(/[gy]/gu, ""));
  };
  pattern = testable(initial);
  drawGloss(initial);
  function testSample() {
    const tooLong = input.value.length > 80;
    input.setAttribute("aria-invalid", String(tooLong));
    if (tooLong) {
      result.textContent = "Too long";
      result.setAttribute("aria-label", result.textContent);
      result.dataset.match = "invalid";
      ride(null);
      return;
    }
    const matches = pattern.test(input.value);
    result.textContent = matches ? "✓ Match" : "× No match";
    result.setAttribute("aria-label", result.textContent);
    result.dataset.match = String(matches);
    ride(input.value, matches);
  }
  input.addEventListener("input", testSample);
  input.disabled = false;
  testSample();

  /** Show a compiled pattern on the line, the boards and the workshop link; `samples` is [match, no match] or empty. */
  function showPattern(compiled, rules, note, href, samples) {
    pattern = testable(compiled);
    drawGloss(compiled);
    copySequence += 1;
    window.clearTimeout(statusResetTimer);
    copyStatus.textContent = "";
    for (const control of copyControls) {
      window.clearTimeout(control.resetTimer);
      control.button.textContent = control.label;
    }
    document.getElementById("rules-code").textContent = rules;
    document.getElementById("regex-code").textContent = `/${compiled.source}/${compiled.flags}`;
    document.getElementById("demo-note").textContent = note;
    document.getElementById("demo-open").href = href;
    for (const button of document.querySelectorAll("[data-recipe]")) {
      button.setAttribute(
        "aria-pressed",
        String(href === `./workshop/?example=${button.dataset.recipe}`),
      );
    }
    const chips = document.getElementById("demo-samples");
    chips.replaceChildren();
    samples.forEach((value, index) => {
      const chip = document.createElement("span");
      const code = document.createElement("code");
      chip.className = index === 0 ? "" : "no-match";
      chip.append(index === 0 ? "matches " : "no match ");
      code.textContent = value;
      chip.append(code);
      chips.append(chip);
    });
    chips.hidden = samples.length === 0;
  }

  const explainForm = document.getElementById("explain-form");
  const explainInput = document.getElementById("explain-input");
  const explainStatus = document.getElementById("explain-status");
  const { parseRegexLiteral, validateRegexLiteralLength } = await import(
    `./workshop/src/regex-literal.js${assetSearch}`
  );
  const { createFixtureLink } = await import(`./workshop/web/fixtures.js${assetSearch}`);

  /** Accept `/source/flags` or a bare pattern; the rules always match in Unicode mode. */
  function readRegex(text) {
    validateRegexLiteralLength(text);
    const value = text.trim();
    if (!value) throw new Error("Paste a regex first, such as /^\\d{3}-\\d{4}$/.");
    let regex;
    if (value.startsWith("/")) regex = parseRegexLiteral(value);
    else {
      try {
        regex = new RegExp(value);
      } catch {
        throw new Error("That is not a valid JavaScript regex.");
      }
    }
    if (regex.unicode || regex.unicodeSets) return { regex, unicodeAdded: false };
    try {
      return { regex: new RegExp(regex.source, `${regex.flags}u`), unicodeAdded: true };
    } catch {
      throw new Error(
        "This regex is only valid without the u flag, which the rules always use. Look for escapes that Unicode mode rejects, such as \\- outside [ ]; write - instead.",
      );
    }
  }

  explainForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const { regex, unicodeAdded } = readRegex(explainInput.value);
      const { rules, flags } = regexToRules(regex);
      const compiled = compile(rules, { flags });
      const count = rules.split("\n").filter((rule) => rule.trim()).length;
      const fixture = JSON.stringify({
        format: "regex-for-humans-tests",
        version: 1,
        rules,
        flags: compiled.flags,
        mode: "search",
        cases: [],
      });
      let href = "./workshop/";
      try {
        href = createFixtureLink(fixture, new URL("./workshop/", window.location.href).href);
      } catch {
        // shortcut: a pattern too long for a share link opens the empty workshop.
      }
      showPattern(
        compiled,
        rules,
        `Your regex, read as ${count} ${count === 1 ? "rule" : "rules"}.${
          unicodeAdded
            ? " It was read with the u flag, which the rules always use; for plain ASCII text the meaning is the same."
            : ""
        }`,
        href,
        [],
      );
      explainInput.setAttribute("aria-invalid", "false");
      explainStatus.textContent = `Glossed as ${columns.length} fragments.`;
      testSample();
    } catch (error) {
      explainInput.setAttribute("aria-invalid", "true");
      explainStatus.textContent = error instanceof Error ? error.message : String(error);
    }
  });
  for (const control of explainForm.elements) control.disabled = false;

  try {
    const recipeUrl = new URL("./workshop/test/fixtures/product-scenarios.json", import.meta.url);
    recipeUrl.search = assetSearch;
    const response = await fetch(recipeUrl);
    if (!response.ok) throw new Error("Recipes unavailable");
    const recipes = await response.json();
    if (!Array.isArray(recipes)) throw new Error("Recipes unavailable");
    const demos = [...document.querySelectorAll("[data-recipe]")].map((button) => {
      const recipe = recipes.find((item) => item?.id === button.dataset.recipe);
      if (
        typeof recipe?.note !== "string" ||
        !Array.isArray(recipe.positive) ||
        typeof recipe.positive[0] !== "string" ||
        !Array.isArray(recipe.negative) ||
        typeof recipe.negative[0] !== "string"
      )
        throw new Error("Recipes unavailable");
      return { button, recipe, compiled: compile(recipe.rules) };
    });
    function select({ recipe, compiled }) {
      showPattern(compiled, recipe.rules, recipe.note, `./workshop/?example=${recipe.id}`, [
        recipe.positive[0],
        recipe.negative[0],
      ]);
      explainInput.setAttribute("aria-invalid", "false");
      explainStatus.textContent = "";
      input.value = sampleInputs[recipe.id];
      testSample();
    }
    for (const demo of demos) {
      demo.button.disabled = false;
      demo.button.addEventListener("click", () => {
        pauseExamples();
        select(demo);
      });
    }

    // Walk through the examples like a slow reel until the visitor takes over.
    const play = document.getElementById("demo-play");
    const demoSection = play.closest("section");
    let timer = 0;
    function pauseExamples() {
      window.clearInterval(timer);
      timer = 0;
      play.setAttribute("aria-pressed", "true");
    }
    function playExamples() {
      play.setAttribute("aria-pressed", "false");
      timer = window.setInterval(() => {
        if (
          document.hidden ||
          demoSection.matches(":hover") ||
          demoSection.contains(document.activeElement)
        )
          return;
        const current = demos.findIndex(
          ({ button }) => button.getAttribute("aria-pressed") === "true",
        );
        select(demos[(current + 1) % demos.length]);
      }, 6500);
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      play.hidden = false;
      play.addEventListener("click", () => (timer ? pauseExamples() : playExamples()));
      for (const control of [input, explainInput]) control.addEventListener("focus", pauseExamples);
      explainForm.addEventListener("submit", pauseExamples);
      playExamples();
    }
  } catch {
    document.getElementById("demo-note").textContent =
      "Extra recipes couldn't load. You can still try this hex-color pattern or open the workshop.";
  }
} catch {
  keyboardScroll();
  result.textContent = "Demo unavailable";
  document.getElementById("demo-note").textContent =
    "The demo couldn't load. You can still copy these rules and regex, or open the workshop.";
}

// Draw the alignment links once the diagram scrolls into view.
const how = document.getElementById("how");
if (
  how &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      how.classList.add("visible");
      observer.disconnect();
    },
    { threshold: 0.4 },
  );
  observer.observe(how);
}
