const assetSearch = new URL(import.meta.url).search;
const { compile, toRegExp } = await import(`./workshop/index.js${assetSearch}`);

const input = document.getElementById("demo-input");
const result = document.getElementById("demo-result");
let pattern = toRegExp(compile(document.getElementById("rules-code").textContent));

function testSample() {
  const matches = pattern.test(input.value);
  result.textContent = matches ? "✓ Match" : "× No match";
  result.dataset.match = String(matches);
}
input.addEventListener("input", testSample);
testSample();

const sampleInputs = {
  "hex-color": "#ff6b6b",
  "prefixed-identifier": "ABC123",
  "version-shape": "1.2.3",
};

let statusResetTimer;
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
    const copiedPattern = pattern;
    try {
      await navigator.clipboard.writeText(source.textContent.trim());
      if (pattern !== copiedPattern) return;
      window.clearTimeout(control.resetTimer);
      copyStatus.textContent = `${label.replace("Copy ", "")} copied. Ready to paste!`;
      button.textContent = "Copied ✓";
      control.resetTimer = window.setTimeout(() => {
        button.textContent = label;
      }, 1800);
      window.clearTimeout(statusResetTimer);
      statusResetTimer = window.setTimeout(() => {
        copyStatus.textContent = "";
      }, 1800);
    } catch {
      if (pattern !== copiedPattern) return;
      window.clearTimeout(statusResetTimer);
      copyStatus.textContent = "Clipboard access is unavailable. Select the text to copy it.";
    }
  });
}

try {
  const recipeUrl = new URL("./workshop/test/fixtures/product-scenarios.json", import.meta.url);
  recipeUrl.search = assetSearch;
  const response = await fetch(recipeUrl);
  if (!response.ok) throw new Error("Recipes unavailable");
  const recipes = await response.json();
  for (const button of document.querySelectorAll("[data-recipe]")) {
    button.disabled = false;
    button.addEventListener("click", () => {
      const recipe = recipes.find((item) => item.id === button.dataset.recipe);
      const compiled = compile(recipe.rules);
      pattern = toRegExp(compiled);
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
