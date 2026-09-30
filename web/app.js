import { CompileError, compile } from "../index.js";
import { splitLines } from "../src/parser.js";
import { TestRunError, TestRunner } from "./test-runner.js";

/** @typedef {import("./worker-protocol.d.ts").TestCase} TestCase */
/** @typedef {{id: string, title: string, note: string, rules: string, source: string, flags: string, matchMode: "full" | "search", positive: string[], negative: string[]}} ProductScenario */
/** @typedef {"success" | "neutral" | "error"} CompileState */

/**
 * @template {HTMLElement} E
 * @param {string} id
 * @param {new () => E} type
 * @returns {E}
 */
function requiredElement(id, type) {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Required workshop element #${id} is missing.`);
  return element;
}

const ui = {
  examples: requiredElement("example-list", HTMLElement),
  recipeCount: requiredElement("recipe-count", HTMLSpanElement),
  recipeNote: requiredElement("recipe-note", HTMLParagraphElement),
  rules: requiredElement("rules-input", HTMLTextAreaElement),
  ruleCount: requiredElement("rule-count", HTMLSpanElement),
  ignoreCase: requiredElement("ignore-case", HTMLInputElement),
  dotAll: requiredElement("dot-all", HTMLInputElement),
  output: requiredElement("regex-output", HTMLElement),
  compileState: requiredElement("compile-state", HTMLSpanElement),
  flagsSummary: requiredElement("flags-summary", HTMLSpanElement),
  copy: requiredElement("copy-button", HTMLButtonElement),
  diagnostic: requiredElement("diagnostic", HTMLDivElement),
  trace: requiredElement("trace-list", HTMLDivElement),
  matchMode: requiredElement("match-mode", HTMLSelectElement),
  addExample: requiredElement("add-example", HTMLButtonElement),
  testSummary: requiredElement("test-summary", HTMLDivElement),
  testList: requiredElement("test-list", HTMLDivElement),
};

/** @type {ProductScenario[]} */
let scenarios = [];
/** @type {TestCase[]} */
let testCases = [];
let nextTestId = 1;
/** @type {ReturnType<typeof compile> | null} */
let compiled = null;
let hasEdits = false;
let copyFeedbackTimer = 0;
let copySequence = 0;
const testRunner = new TestRunner(
  () => new Worker(new URL("./match-worker.js", import.meta.url), { type: "module" }),
);

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {string} [className=""]
 * @param {string} [text]
 * @returns {HTMLElementTagNameMap[K]}
 */
function make(tag, className = "", text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** @param {string} label @param {CompileState} state */
function setCompileState(label, state) {
  ui.compileState.textContent = label;
  ui.compileState.dataset.state = state;
}

/** @param {string} message @param {boolean} [invalidRules=false] */
function setDiagnostic(message, invalidRules = false) {
  ui.diagnostic.hidden = !message;
  ui.diagnostic.textContent = message || "";
  ui.rules.setAttribute("aria-invalid", String(invalidRules));
}

/** @param {number} number @param {number} [column] */
function selectLine(number, column) {
  const lines = splitLines(ui.rules.value);
  const start = lines.slice(0, number - 1).reduce((sum, line) => sum + line.length + 1, 0);
  const end = start + (lines[number - 1]?.length ?? 0);
  const position = column === undefined ? start : Math.min(start + column - 1, end);
  ui.rules.focus();
  ui.rules.setSelectionRange(position, column === undefined ? end : Math.min(position + 1, end));
}

/** @param {ReturnType<typeof compile>["segments"] | null} segments */
function renderTrace(segments) {
  ui.trace.replaceChildren();
  if (!segments?.length) {
    ui.trace.append(
      make(
        "p",
        "empty-trace",
        "Each rule will appear here with its generated fragment and meaning.",
      ),
    );
    return;
  }
  for (const segment of segments) {
    const button = make("button", "trace-item");
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Rule on line ${segment.line}: ${segment.explanation}. Select source line.`,
    );
    button.append(make("code", "trace-fragment", segment.source));
    const detail = make("span");
    detail.append(make("span", "trace-text", `${segment.line}:${segment.column} ${segment.text}`));
    detail.append(make("span", "trace-meaning", segment.explanation));
    button.append(detail);
    button.addEventListener("click", () => selectLine(segment.line));
    ui.trace.append(button);
  }
}

/** @param {string} flags */
function flagsDescription(flags) {
  const parts = ["u Unicode"];
  if (flags.includes("m")) parts.push("m Line anchors");
  if (flags.includes("i")) parts.push("i Ignore case");
  if (flags.includes("s")) parts.push("s Dot all");
  return parts.join(" · ");
}

/** @param {HTMLDivElement} row @param {string} text */
function setTestResult(row, text) {
  const result = row.querySelector(".test-result");
  if (result) result.textContent = text;
}

function selectedMatchMode() {
  if (ui.matchMode.value === "full") return "full";
  if (ui.matchMode.value === "search") return "search";
  throw new Error(`Unknown match mode: ${ui.matchMode.value}`);
}

async function updateTestResults() {
  const rows = [...ui.testList.querySelectorAll(".test-row")].filter(
    (row) => row instanceof HTMLDivElement,
  );
  if (!compiled || testCases.length === 0) {
    const invalidRules = ui.rules.getAttribute("aria-invalid") === "true";
    const rulePrompt = invalidRules ? "Fix the rules" : "Write rules";
    testRunner.cancel();
    rows.forEach((row) => {
      row.dataset.result = "pending";
      setTestResult(
        row,
        compiled ? "Add an example to check the pattern" : `${rulePrompt} to run this example`,
      );
    });
    ui.testSummary.textContent = compiled
      ? "Add a positive or negative example to check the pattern."
      : `${rulePrompt} to run the examples.`;
    ui.testSummary.dataset.state = !compiled && invalidRules ? "error" : "neutral";
    return;
  }

  rows.forEach((row) => {
    row.dataset.result = "pending";
    setTestResult(row, "Checking…");
  });
  ui.testSummary.textContent = "Checking examples…";
  ui.testSummary.dataset.state = "neutral";
  try {
    const results = await testRunner.run({
      source: compiled.source,
      flags: compiled.flags,
      mode: selectedMatchMode(),
      cases: testCases.map(({ id, text, expected }) => ({ id, text, expected })),
    });
    const byId = new Map(results.map((result) => [result.id, result]));
    let passed = 0;
    rows.forEach((row, index) => {
      const evaluation = byId.get(testCases[index].id);
      if (!evaluation) throw new Error(`No result was returned for example ${index + 1}.`);
      if (evaluation.pass) passed += 1;
      row.dataset.result = evaluation.pass ? "pass" : "fail";
      setTestResult(row, `${evaluation.pass ? "✓" : "!"} ${evaluation.detail}`);
    });
    ui.testSummary.textContent = `${passed} of ${testCases.length} examples behave as expected`;
    ui.testSummary.dataset.state = passed === testCases.length ? "success" : "error";
  } catch (error) {
    if (error instanceof TestRunError && error.code === "CANCELLED") return;
    rows.forEach((row) => {
      row.dataset.result = "pending";
      setTestResult(row, "Testing stopped");
    });
    ui.testSummary.textContent = error instanceof Error ? error.message : String(error);
    ui.testSummary.dataset.state = "error";
  }
}

function renderTests() {
  ui.testList.replaceChildren();
  ui.addExample.disabled = testCases.length >= 100;
  for (const [index, sample] of testCases.entries()) {
    const number = index + 1;
    const row = make("div", "test-row");
    const input = make("textarea");
    input.rows = Math.min(3, Math.max(1, sample.text.split("\n").length));
    input.value = sample.text;
    input.placeholder = "Empty string";
    input.maxLength = 2048;
    input.setAttribute("aria-label", `Example ${number} string`);
    input.addEventListener("input", () => {
      sample.text = input.value;
      input.rows = Math.min(3, Math.max(1, sample.text.split("\n").length));
      updateTestResults();
    });

    const expected = make("select");
    expected.setAttribute("aria-label", `Expected match result for example ${number}`);
    for (const [value, label] of [
      ["true", "Should match"],
      ["false", "Should not match"],
    ]) {
      const option = make("option", "", label);
      option.value = value;
      expected.append(option);
    }
    expected.value = String(sample.expected);
    expected.addEventListener("change", () => {
      sample.expected = expected.value === "true";
      updateTestResults();
    });

    const result = make("span", "test-result");
    const remove = make("button", "remove-example", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove example ${number}`);
    remove.addEventListener("click", () => {
      testCases = testCases.filter((item) => item.id !== sample.id);
      renderTests();
      updateTestResults();
      (
        ui.testList.querySelectorAll("textarea")[Math.min(index, testCases.length - 1)] ??
        ui.addExample
      ).focus();
    });
    row.append(input, expected, result, remove);
    ui.testList.append(row);
  }
}

function compileRules() {
  window.clearTimeout(copyFeedbackTimer);
  ui.copy.textContent = "Copy regex ↗";
  const ruleCount = splitLines(ui.rules.value).filter((line) => line.trim()).length;
  ui.ruleCount.textContent = `${ruleCount} ${ruleCount === 1 ? "rule" : "rules"}`;
  try {
    const flags = `${ui.ignoreCase.checked ? "i" : ""}${ui.dotAll.checked ? "s" : ""}`;
    compiled = compile(ui.rules.value, { flags });
    ui.output.textContent = `/${compiled.source}/${compiled.flags}`;
    ui.flagsSummary.textContent = flagsDescription(compiled.flags);
    ui.copy.disabled = false;
    setCompileState("Compiled", "success");
    setDiagnostic("");
    renderTrace(compiled.segments);
  } catch (error) {
    compiled = null;
    ui.copy.disabled = true;
    if (error instanceof CompileError && error.code === "EMPTY_SOURCE") {
      ui.output.textContent = "Select a recipe or write a rule";
      ui.flagsSummary.textContent = "Unicode mode always on";
      setCompileState("Ready", "neutral");
      setDiagnostic("");
    } else {
      ui.output.textContent = "No pattern generated";
      ui.flagsSummary.textContent = "Fix the instruction shown below";
      setCompileState("Needs a fix", "error");
      setDiagnostic(
        error instanceof CompileError
          ? `Line ${error.line}, column ${error.column}: ${error.message}${error.hint ? `\n${error.hint}` : ""}`
          : `Unexpected compiler error: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
      if (error instanceof CompileError) {
        const jump = make("button", "secondary-button", "Go to error");
        jump.type = "button";
        jump.addEventListener("click", () => selectLine(error.line, error.column));
        ui.diagnostic.append(jump);
      }
    }
    renderTrace(null);
  }
  updateTestResults();
}

/** @param {string|null} id */
function setScenarioSelection(id) {
  ui.recipeNote.textContent = scenarios.find((scenario) => scenario.id === id)?.note ?? "";
  ui.recipeNote.hidden = !ui.recipeNote.textContent;
  for (const button of ui.examples.querySelectorAll("button")) {
    button.setAttribute("aria-current", String(button.dataset.scenario === id));
  }
}

/** @param {ProductScenario} scenario */
function useScenario(scenario) {
  setScenarioSelection(scenario.id);
  ui.rules.value = scenario.rules;
  ui.ignoreCase.checked = false;
  ui.dotAll.checked = false;
  ui.matchMode.value = scenario.matchMode;
  testCases = [
    ...scenario.positive.map((text) => ({ id: nextTestId++, text, expected: true })),
    ...scenario.negative.map((text) => ({ id: nextTestId++, text, expected: false })),
  ];
  const url = new URL(window.location.href);
  url.searchParams.set("example", scenario.id);
  window.history.replaceState(null, "", url);
  renderTests();
  compileRules();
}

function renderScenarioButtons() {
  ui.examples.replaceChildren();
  ui.recipeCount.textContent = scenarios.length
    ? `01—${String(scenarios.length).padStart(2, "0")}`
    : "";
  scenarios.forEach((scenario, index) => {
    const button = make("button", "example-button");
    button.type = "button";
    button.dataset.scenario = scenario.id;
    button.setAttribute("aria-current", "false");
    button.append(make("span", "example-number", String(index + 1).padStart(2, "0")));
    button.append(make("span", "example-title", scenario.title));
    button.append(make("span", "example-arrow", "↗"));
    button.addEventListener("click", () => useScenario(scenario));
    ui.examples.append(button);
  });
}

document.addEventListener("input", () => {
  hasEdits = true;
});
ui.rules.addEventListener("input", () => {
  setScenarioSelection(scenarios.find(({ rules }) => rules === ui.rules.value)?.id ?? null);
  compileRules();
});
ui.ignoreCase.addEventListener("change", compileRules);
ui.dotAll.addEventListener("change", compileRules);
ui.matchMode.addEventListener("change", updateTestResults);
ui.addExample.addEventListener("click", () => {
  hasEdits = true;
  testCases.push({ id: nextTestId++, text: "", expected: true });
  renderTests();
  updateTestResults();
  ui.testList.lastElementChild?.querySelector("textarea")?.focus();
});
ui.copy.addEventListener("click", async () => {
  if (!compiled) return;
  const result = compiled;
  const text = `/${result.source}/${result.flags}`;
  const request = ++copySequence;
  window.clearTimeout(copyFeedbackTimer);
  ui.copy.textContent = "Copy regex ↗";
  setDiagnostic("");
  let requestTimer = 0;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) => {
        requestTimer = window.setTimeout(
          () => reject(new Error("Clipboard request timed out")),
          1000,
        );
      }),
    ]);
  } catch {
    if (compiled !== result || request !== copySequence) return;
    const focused = document.activeElement;
    const helper = make("textarea");
    helper.value = text;
    helper.setAttribute("aria-hidden", "true");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      /* select for manual copy below */
    }
    helper.remove();
    if (focused instanceof HTMLElement) focused.focus();
    if (!copied) {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(ui.output);
        selection.removeAllRanges();
        selection.addRange(range);
        setDiagnostic(
          "Clipboard access was blocked. The pattern is selected; press your keyboard copy shortcut.",
        );
      } else {
        setDiagnostic(
          "Clipboard access was blocked. Select the pattern and press your copy shortcut.",
        );
      }
      return;
    }
  } finally {
    window.clearTimeout(requestTimer);
  }
  if (compiled !== result || request !== copySequence) return;
  setDiagnostic("");
  ui.copy.textContent = "Copied ✓";
  copyFeedbackTimer = window.setTimeout(() => {
    ui.copy.textContent = "Copy regex ↗";
  }, 1800);
});

try {
  const response = await fetch(new URL("../test/fixtures/product-scenarios.json", import.meta.url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  scenarios = await response.json();
  renderScenarioButtons();
  const requested = new URLSearchParams(window.location.search).get("example");
  const scenario = scenarios.find((item) => item.id === requested) ?? scenarios[0];
  if (!scenario) throw new Error("No example recipes are available.");
  if (!hasEdits) useScenario(scenario);
} catch (error) {
  const notice = make(
    "p",
    "empty-trace",
    `Example recipes could not load (${error instanceof Error ? error.message : String(error)}). You can still write rules manually.`,
  );
  notice.setAttribute("role", "status");
  ui.examples.replaceChildren(notice);
  if (!hasEdits) ui.testSummary.textContent = "Write rules and add an example to test them.";
}
