import { compile, toRegExp } from "./workshop/index.js";

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

const notes = {
  "hex-color": "Six hex digits, either letter case. Just the #RRGGBB form.",
  "prefixed-identifier": "ABC + exactly three digits. Letter case matters.",
  "version-shape": "Three numeric parts. Leading zeros are allowed; this isn't full SemVer.",
};
const sampleInputs = {
  "hex-color": "#ff6b6b",
  "prefixed-identifier": "ABC123",
  "version-shape": "1.2.3",
};

let statusResetTimer;
for (const button of document.querySelectorAll("[data-copy]")) {
  const label = button.textContent;
  let resetTimer;
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    const status = document.getElementById("copy-status");
    try {
      await navigator.clipboard.writeText(source.textContent.trim());
      window.clearTimeout(resetTimer);
      status.textContent = `${label.replace("Copy ", "")} copied. Ready to paste!`;
      button.textContent = "Copied ✓";
      resetTimer = window.setTimeout(() => {
        button.textContent = label;
      }, 1800);
      window.clearTimeout(statusResetTimer);
      statusResetTimer = window.setTimeout(() => {
        status.textContent = "";
      }, 1800);
    } catch {
      window.clearTimeout(statusResetTimer);
      status.textContent = "Clipboard access is unavailable. Select the text to copy it.";
    }
  });
}

try {
  const response = await fetch("./workshop/test/fixtures/product-scenarios.json");
  if (!response.ok) throw new Error("Recipes unavailable");
  const recipes = await response.json();
  for (const button of document.querySelectorAll("[data-recipe]")) {
    button.disabled = false;
    button.addEventListener("click", () => {
      const recipe = recipes.find((item) => item.id === button.dataset.recipe);
      const compiled = compile(recipe.rules);
      pattern = toRegExp(compiled);
      document.getElementById("rules-code").textContent = recipe.rules;
      document.getElementById("regex-code").textContent = `/${compiled.source}/${compiled.flags}`;
      document.getElementById("demo-note").textContent = notes[recipe.id];
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
