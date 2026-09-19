import { compile, CompileError } from "../index.js";

const ui = {
  examples: document.querySelector("#example-list"),
  rules: document.querySelector("#rules-input"),
  ruleCount: document.querySelector("#rule-count"),
  ignoreCase: document.querySelector("#ignore-case"),
  dotAll: document.querySelector("#dot-all"),
  output: document.querySelector("#regex-output"),
  compileState: document.querySelector("#compile-state"),
  flagsSummary: document.querySelector("#flags-summary"),
  copy: document.querySelector("#copy-button"),
  diagnostic: document.querySelector("#diagnostic"),
  trace: document.querySelector("#trace-list"),
  matchMode: document.querySelector("#match-mode"),
  addExample: document.querySelector("#add-example"),
  testSummary: document.querySelector("#test-summary"),
  testList: document.querySelector("#test-list")
};

let scenarios = [];
let activeScenario = null;
let testCases = [];
let nextTestId = 1;
let compiled = null;

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setCompileState(label, state) {
  ui.compileState.textContent = label;
  ui.compileState.dataset.state = state;
}

function setDiagnostic(message) {
  ui.diagnostic.hidden = !message;
  ui.diagnostic.textContent = message || "";
}

function selectLine(number) {
  const lines = ui.rules.value.split("\n");
  const start = lines.slice(0, number - 1).reduce((sum, line) => sum + line.length + 1, 0);
  ui.rules.focus();
  ui.rules.setSelectionRange(start, start + (lines[number - 1]?.length ?? 0));
}

function renderTrace(segments) {
  ui.trace.replaceChildren();
  if (!segments?.length) {
    ui.trace.append(make("p", "empty-trace", "Each rule will appear here with its generated fragment and meaning."));
    return;
  }
  for (const segment of segments) {
    const button = make("button", "trace-item");
    button.type = "button";
    button.setAttribute("aria-label", `Rule on line ${segment.line}: ${segment.explanation}. Select source line.`);
    button.append(make("code", "trace-fragment", segment.source));
    const detail = make("span");
    detail.append(make("span", "trace-text", `${segment.line}:${segment.column} ${segment.text}`));
    detail.append(make("span", "trace-meaning", segment.explanation));
    button.append(detail);
    button.addEventListener("click", () => selectLine(segment.line));
    ui.trace.append(button);
  }
}

function flagsDescription(flags) {
  const parts = ["u Unicode"];
  if (flags.includes("m")) parts.push("m Line anchors");
  if (flags.includes("i")) parts.push("i Ignore case");
  if (flags.includes("s")) parts.push("s Dot all");
  return parts.join(" · ");
}

function evaluateCase(sample) {
  const expression = new RegExp(compiled.source, compiled.flags);
  const match = expression.exec(sample.text);
  const actual = ui.matchMode.value === "search"
    ? match !== null
    : match !== null && match.index === 0 && match[0].length === sample.text.length;
  let detail = match ? `Matched ${JSON.stringify(match[0])} at ${match.index}` : "No match";
  if (match && !actual) detail = `Found ${JSON.stringify(match[0])}, not the entire string`;
  return { actual, pass: actual === sample.expected, detail };
}

function updateTestResults() {
  const rows = ui.testList.querySelectorAll(".test-row");
  let passed = 0;
  rows.forEach((row, index) => {
    const result = row.querySelector(".test-result");
    if (!compiled) {
      row.dataset.result = "pending";
      result.textContent = "Fix the rules to run this example";
      return;
    }
    const evaluation = evaluateCase(testCases[index]);
    if (evaluation.pass) passed += 1;
    row.dataset.result = evaluation.pass ? "pass" : "fail";
    result.textContent = `${evaluation.pass ? "✓" : "!"} ${evaluation.detail}`;
  });
  if (!compiled) {
    ui.testSummary.textContent = "Fix the rules to run the examples.";
    ui.testSummary.dataset.state = "error";
  } else if (testCases.length === 0) {
    ui.testSummary.textContent = "Add a positive or negative example to check the pattern.";
    ui.testSummary.dataset.state = "neutral";
  } else {
    ui.testSummary.textContent = `${passed} of ${testCases.length} examples behave as expected`;
    ui.testSummary.dataset.state = passed === testCases.length ? "success" : "error";
  }
}

function renderTests() {
  ui.testList.replaceChildren();
  for (const sample of testCases) {
    const row = make("div", "test-row");
    const input = make("textarea");
    input.rows = Math.min(3, Math.max(1, sample.text.split("\n").length));
    input.value = sample.text;
    input.placeholder = "Empty string";
    input.maxLength = 2048;
    input.setAttribute("aria-label", "Example string");
    input.addEventListener("input", () => {
      sample.text = input.value;
      input.rows = Math.min(3, Math.max(1, sample.text.split("\n").length));
      updateTestResults();
    });

    const expected = make("select");
    expected.setAttribute("aria-label", "Expected match result");
    for (const [value, label] of [["true", "Should match"], ["false", "Should not match"]]) {
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
    remove.setAttribute("aria-label", "Remove example");
    remove.addEventListener("click", () => {
      testCases = testCases.filter(item => item.id !== sample.id);
      renderTests();
    });
    row.append(input, expected, result, remove);
    ui.testList.append(row);
  }
  updateTestResults();
}

function compileRules() {
  const lines = ui.rules.value.split("\n").filter(line => line.trim()).length;
  ui.ruleCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"}`;
  if (!ui.rules.value.trim()) {
    compiled = null;
    ui.output.textContent = "Select a recipe or write a rule";
    ui.flagsSummary.textContent = "Unicode mode always on";
    ui.copy.disabled = true;
    setCompileState("Ready", "neutral");
    setDiagnostic("");
    renderTrace(null);
    updateTestResults();
    return;
  }
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
    ui.output.textContent = "No pattern generated";
    ui.flagsSummary.textContent = "Fix the instruction shown below";
    ui.copy.disabled = true;
    setCompileState("Needs a fix", "error");
    setDiagnostic(error instanceof CompileError
      ? `Line ${error.line}, column ${error.column}: ${error.message}${error.hint ? `\n${error.hint}` : ""}`
      : `Unexpected compiler error: ${error.message}`);
    renderTrace(null);
  }
  updateTestResults();
}

function useScenario(scenario) {
  activeScenario = scenario.id;
  ui.rules.value = scenario.rules;
  ui.ignoreCase.checked = false;
  ui.dotAll.checked = false;
  ui.matchMode.value = scenario.matchMode;
  testCases = [
    ...scenario.positive.map(text => ({ id: nextTestId++, text, expected: true })),
    ...scenario.negative.map(text => ({ id: nextTestId++, text, expected: false }))
  ];
  for (const button of ui.examples.querySelectorAll("button")) {
    button.setAttribute("aria-current", String(button.dataset.scenario === activeScenario));
  }
  const url = new URL(window.location.href);
  url.searchParams.set("example", scenario.id);
  window.history.replaceState(null, "", url);
  renderTests();
  compileRules();
}

function renderScenarioButtons() {
  ui.examples.replaceChildren();
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

ui.rules.addEventListener("input", compileRules);
ui.ignoreCase.addEventListener("change", compileRules);
ui.dotAll.addEventListener("change", compileRules);
ui.matchMode.addEventListener("change", updateTestResults);
ui.addExample.addEventListener("click", () => {
  testCases.push({ id: nextTestId++, text: "", expected: true });
  renderTests();
  ui.testList.lastElementChild?.querySelector("input")?.focus();
});
ui.copy.addEventListener("click", async () => {
  if (!compiled) return;
  const text = `/${compiled.source}/${compiled.flags}`;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error("Clipboard request timed out")), 1000))
    ]);
  } catch {
    const helper = make("textarea");
    helper.value = text;
    helper.setAttribute("aria-hidden", "true");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { /* select for manual copy below */ }
    helper.remove();
    if (!copied) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ui.output);
      selection.removeAllRanges();
      selection.addRange(range);
      setDiagnostic("Clipboard access was blocked. The pattern is selected; press your keyboard copy shortcut.");
      return;
    }
  }
  setDiagnostic("");
  ui.copy.textContent = "Copied ✓";
  window.setTimeout(() => { ui.copy.textContent = "Copy regex ↗"; }, 1800);
});

try {
  const response = await fetch(new URL("../test/fixtures/product-scenarios.json", import.meta.url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  scenarios = await response.json();
  renderScenarioButtons();
  const requested = new URLSearchParams(window.location.search).get("example");
  useScenario(scenarios.find(item => item.id === requested) ?? scenarios[0]);
} catch (error) {
  setDiagnostic(`Example recipes could not load (${error.message}). You can still write rules manually.`);
  setCompileState("Examples unavailable", "error");
}
