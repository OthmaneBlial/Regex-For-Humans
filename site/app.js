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

/** Draw one station per compiled rule segment. */
function drawLine(compiled) {
  line.replaceChildren();
  stations = compiled.segments.map((segment, index) => {
    const item = document.createElement("li");
    const kind =
      segment.kind === "anchor"
        ? "terminus"
        : segment.atomType === "literal"
          ? "line-literal"
          : "line-set";
    item.className = `station ${kind}${segment.repetition ? " loop" : ""}`;
    item.style.setProperty("--i", String(index));
    const stop = part("station-stop");
    stop.setAttribute("aria-hidden", "true");
    const fragment = part("station-fragment");
    const code = document.createElement("code");
    code.textContent = segment.source;
    fragment.append(part("sr-only", "regex "), code);
    const take = part("station-take");
    take.hidden = true;
    item.append(part("station-rule", segment.text), stop, fragment, take);
    line.append(item);
    return { item, take, segment };
  });
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
function ride(text) {
  for (const { item, take } of stations) {
    item.dataset.state = "idle";
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
  const { compile, toRegExp } = await import(`./workshop/index.js${assetSearch}`);
  const initial = compile(document.getElementById("rules-code").textContent);
  pattern = toRegExp(initial);
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
    ride(input.value);
  }
  input.addEventListener("input", testSample);
  input.disabled = false;
  testSample();

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
        pattern = toRegExp(compiled);
        drawLine(compiled);
        copySequence += 1;
        window.clearTimeout(statusResetTimer);
        copyStatus.textContent = "";
        for (const control of copyControls) {
          window.clearTimeout(control.resetTimer);
          control.button.textContent = control.label;
        }
        document.getElementById("rules-code").textContent = recipe.rules;
        document.getElementById("regex-code").textContent = `/${compiled.source}/${compiled.flags}`;
        document.getElementById("demo-note").textContent = recipe.note;
        document.getElementById("demo-open").href = `./workshop/?example=${recipe.id}`;
        for (const other of document.querySelectorAll("[data-recipe]")) {
          other.setAttribute("aria-pressed", String(other === button));
        }
        const samples = document.getElementById("demo-samples");
        samples.replaceChildren();
        for (const [matches, value] of [
          [true, recipe.positive[0]],
          [false, recipe.negative[0]],
        ]) {
          const chip = document.createElement("span");
          const code = document.createElement("code");
          chip.className = matches ? "" : "no-match";
          chip.append(matches ? "✓ " : "× ");
          code.textContent = value;
          chip.append(code);
          samples.append(chip);
        }
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
