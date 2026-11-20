const assetSearch = new URL(import.meta.url).search;

const input = document.getElementById("demo-input");
const result = document.getElementById("demo-result");
let pattern;
result.textContent = "Loading…";

const sampleInputs = {
  "hex-color": "#ff6b6b",
  "prefixed-identifier": "ABC123",
  "version-shape": "1.2.3",
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
const trace = document.getElementById("demo-trace");
let stations = [];
let probe = null;

function part(className, text) {
  const element = document.createElement("span");
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

const lineKinds = { anchor: "terminus", group: "line-capture", alternation: "line-choice" };

/** Group and choice brackets open and close a stretch of the line; "|" switches branch. */
const isBracket = (segment) =>
  (segment.kind === "group" || segment.kind === "alternation") && segment.source !== "|";

/** Name brackets and alternatives in words: "capture … end", "or". */
function stationLabel(segment) {
  if (segment.kind === "alternation" && segment.source === "|") return "or";
  if (!isBracket(segment)) return segment.text;
  return segment.text === "}" ? "end" : segment.text.replace(/\s*\{$/u, "");
}

/** A long line scrolls sideways; only then does it need to take keyboard focus. */
function keyboardScroll() {
  if (line.scrollWidth > line.clientWidth) line.tabIndex = 0;
  else line.removeAttribute("tabindex");
}
window.addEventListener("resize", keyboardScroll);

/** Draw one station per compiled rule segment. */
function drawLine(compiled) {
  line.replaceChildren();
  line.style.setProperty(
    "--columns",
    compiled.segments
      .map((segment) => (isBracket(segment) ? "minmax(64px, 0.6fr)" : "minmax(96px, 1fr)"))
      .join(" "),
  );
  stations = compiled.segments.map((segment, index) => {
    const item = document.createElement("li");
    const kind =
      lineKinds[segment.kind] ?? (segment.atomType === "literal" ? "line-literal" : "line-set");
    item.className = `station ${kind}${isBracket(segment) ? " bracket" : ""}${segment.repetition ? " loop" : ""}`;
    item.style.setProperty("--i", String(index));
    const stop = part("station-stop");
    stop.setAttribute("aria-hidden", "true");
    const fragment = part("station-fragment");
    const code = document.createElement("code");
    code.textContent = segment.source;
    fragment.append(part("sr-only", "regex "), code);
    const take = part("station-take");
    take.hidden = true;
    item.append(part("station-rule", stationLabel(segment)), stop, fragment, take);
    line.append(item);
    return { item, take, segment };
  });
  keyboardScroll();
  line.classList.remove("drawing");
  void line.offsetWidth;
  line.classList.add("drawing");
  // Per-station spans need one capture per segment; patterns with their own groups keep whole-match feedback only.
  const sources = compiled.segments.map((segment) => segment.source);
  probe =
    sources.join("") === compiled.source &&
    !sources.some((source) => /\(|\\k|\\[1-9]/u.test(source))
      ? {
          parts: compiled.segments.map((segment) =>
            segment.kind === "anchor" ? segment.source : `(${segment.source})`,
          ),
          flags: compiled.flags.includes("d") ? compiled.flags : `${compiled.flags}d`,
          anchored: sources[0] === "^",
        }
      : null;
}

/** Show which characters each station takes, or where an anchored line stops. */
function ride(text, matched) {
  for (const { item, take } of stations) {
    // Without per-station spans, a full match still lights the whole line.
    item.dataset.state = !probe && matched ? "taken" : "idle";
    take.hidden = true;
    take.replaceChildren();
  }
  trace.textContent = "";
  if (!probe || text === null) return;
  const run = (count) => new RegExp(probe.parts.slice(0, count).join(""), probe.flags).exec(text);
  let reached = stations.length;
  let found = run(reached);
  if (!found) {
    if (!probe.anchored) return;
    do found = run(--reached);
    while (!found && reached > 1);
    if (!found) return;
  }
  let group = 1;
  stations.slice(0, reached).forEach(({ item, take, segment }) => {
    item.dataset.state = "taken";
    if (segment.kind === "anchor") return;
    const span = found.indices?.[group++];
    if (!span) return;
    const value = document.createElement("code");
    value.textContent = text.slice(span[0], span[1]) || "(empty)";
    take.append(part("sr-only", "takes "), value);
    take.hidden = false;
  });
  if (reached === stations.length) return;
  const { item, take, segment } = stations[reached];
  item.dataset.state = "stop";
  take.textContent = "stops here";
  take.hidden = false;
  const before = found[0] ? `take “${found[0]}”` : "take nothing";
  // Literal rules already carry their own quotes ("ABC").
  const name = segment.text.startsWith('"') ? segment.text : `“${segment.text}”`;
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
  drawLine(initial);
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
    drawLine(compiled);
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
      chip.append(index === 0 ? "✓ " : "× ");
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
      explainStatus.textContent = `Drawn as ${compiled.segments.length} stations.`;
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
    for (const { button, recipe, compiled } of demos) {
      button.disabled = false;
      button.addEventListener("click", () => {
        showPattern(compiled, recipe.rules, recipe.note, `./workshop/?example=${recipe.id}`, [
          recipe.positive[0],
          recipe.negative[0],
        ]);
        explainInput.setAttribute("aria-invalid", "false");
        explainStatus.textContent = "";
        input.value = sampleInputs[recipe.id];
        testSample();
      });
    }
  } catch {
    document.getElementById("demo-note").textContent =
      "Extra recipes couldn't load. You can still try this hex-color pattern or open the workshop.";
  }
} catch {
  result.textContent = "Demo unavailable";
  document.getElementById("demo-note").textContent =
    "The demo couldn't load. You can still copy these rules and regex, or open the workshop.";
}
