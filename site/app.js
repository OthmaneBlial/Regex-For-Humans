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

try {
  const { compile, toRegExp } = await import(`./workshop/index.js${assetSearch}`);
  pattern = toRegExp(compile(document.getElementById("rules-code").textContent));
  function testSample() {
    const tooLong = input.value.length > 80;
    input.setAttribute("aria-invalid", String(tooLong));
    if (tooLong) {
      result.textContent = "Too long";
      result.setAttribute("aria-label", result.textContent);
      result.dataset.match = "invalid";
      return;
    }
    const matches = pattern.test(input.value);
    result.textContent = matches ? "✓ Match" : "× No match";
    result.setAttribute("aria-label", result.textContent);
    result.dataset.match = String(matches);
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
