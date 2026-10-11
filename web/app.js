import {
  analyze,
  CompileError,
  compile,
  editGroup,
  exportRegex,
  regexToRules,
  toSVG,
} from "../index.js";
import { escapeControls, quoteText } from "../src/display.js";
import { LIMITS, splitLines } from "../src/parser.js";
import { parseRegexLiteral } from "../src/regex-literal.js";
import { parseExpectation, readExpectation } from "./expectations.js";
import { explanationNotes } from "./explanation-notes.js";
import { explainMismatch, failureRequirements } from "./failure-reasons.js";
import {
  createFixtureLink,
  draftStorageKey,
  fixtureLimit,
  fixtureStorageKey,
  parseDraft,
  parseFixture,
  readFixtureLink,
} from "./fixtures.js";
import { initializeLanguage, message, setAttribute, setText } from "./i18n.js";
import { insertRule } from "./insert-rule.js";
import { categories, filterRecipes, levels } from "./library.js";
import { createMarkdownReport } from "./markdown-report.js";
import { ruleCompletions } from "./rule-completions.js";
import { initializeSyntaxEditor } from "./syntax.js";
import { TestRunError, TestRunner } from "./test-runner.js";
import { textChanges } from "./text-change.js";

/** @typedef {import("./worker-protocol.d.ts").TestCase} TestCase */
/** @typedef {import('./library.js').ProductScenario} ProductScenario */
/** @typedef {"success" | "neutral" | "error"} CompileState */
/** @typedef {{line: number, column: number, sourceStart: number, sourceEnd: number}} RuleFocus */

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
  language: requiredElement("interface-language", HTMLSelectElement),
  theme: requiredElement("interface-theme", HTMLSelectElement),
  examples: requiredElement("example-list", HTMLElement),
  recipeCount: requiredElement("recipe-count", HTMLSpanElement),
  recipeNote: requiredElement("recipe-note", HTMLParagraphElement),
  recipeFilters: requiredElement("recipe-filters", HTMLFormElement),
  recipeSearch: requiredElement("recipe-search", HTMLInputElement),
  recipeCategory: requiredElement("recipe-category", HTMLSelectElement),
  recipeLevel: requiredElement("recipe-level", HTMLSelectElement),
  recipeResults: requiredElement("recipe-results", HTMLSpanElement),
  recipeClear: requiredElement("recipe-clear", HTMLButtonElement),
  rules: requiredElement("rules-input", HTMLTextAreaElement),
  ruleCount: requiredElement("rule-count", HTMLSpanElement),
  completeRule: requiredElement("complete-rule", HTMLButtonElement),
  completions: requiredElement("rule-completions", HTMLElement),
  completionChoice: requiredElement("completion-choice", HTMLSelectElement),
  completionPreview: requiredElement("completion-preview", HTMLElement),
  completionPreviewField: requiredElement("completion-preview-field", HTMLParagraphElement),
  completionStatus: requiredElement("completion-status", HTMLParagraphElement),
  completionApply: requiredElement("completion-apply", HTMLButtonElement),
  completionClose: requiredElement("completion-close", HTMLButtonElement),
  builderForm: requiredElement("builder-form", HTMLFormElement),
  builderKind: requiredElement("builder-kind", HTMLSelectElement),
  builderInsert: requiredElement("builder-insert", HTMLButtonElement),
  builderFeedback: requiredElement("builder-feedback", HTMLParagraphElement),
  ignoreCase: requiredElement("ignore-case", HTMLInputElement),
  dotAll: requiredElement("dot-all", HTMLInputElement),
  global: requiredElement("global-flag", HTMLInputElement),
  multiline: requiredElement("multiline-flag", HTMLInputElement),
  sticky: requiredElement("sticky-flag", HTMLInputElement),
  matchIndices: requiredElement("indices-flag", HTMLInputElement),
  unicodeMode: requiredElement("unicode-mode", HTMLSelectElement),
  reverseRegex: requiredElement("reverse-regex", HTMLTextAreaElement),
  reverseButton: requiredElement("reverse-button", HTMLButtonElement),
  reverseFeedback: requiredElement("reverse-feedback", HTMLParagraphElement),
  reverseError: requiredElement("reverse-error", HTMLButtonElement),
  output: requiredElement("regex-output", HTMLElement),
  compileState: requiredElement("compile-state", HTMLSpanElement),
  flagsSummary: requiredElement("flags-summary", HTMLSpanElement),
  copy: requiredElement("copy-button", HTMLButtonElement),
  exportPanel: requiredElement("language-export", HTMLDetailsElement),
  exportTarget: requiredElement("export-target", HTMLSelectElement),
  exportStatus: requiredElement("export-status", HTMLParagraphElement),
  exportCode: requiredElement("export-code", HTMLElement),
  exportViewport: requiredElement("export-code-region", HTMLElement),
  exportRequirements: requiredElement("export-requirements", HTMLUListElement),
  exportCaptures: requiredElement("export-captures", HTMLUListElement),
  exportError: requiredElement("export-error", HTMLButtonElement),
  exportDownload: requiredElement("export-download", HTMLButtonElement),
  exportJSON: requiredElement("export-json", HTMLButtonElement),
  diagnostic: requiredElement("diagnostic", HTMLDivElement),
  trace: requiredElement("trace-list", HTMLDivElement),
  explanationMode: requiredElement("explanation-mode", HTMLSelectElement),
  explanationHelp: requiredElement("explanation-help", HTMLParagraphElement),
  review: requiredElement("pattern-review", HTMLDetailsElement),
  reviewCount: requiredElement("review-count", HTMLSpanElement),
  reviewStatus: requiredElement("review-status", HTMLParagraphElement),
  reviewFindings: requiredElement("review-findings", HTMLDivElement),
  reviewLimits: requiredElement("review-limitations", HTMLUListElement),
  ruleFocus: requiredElement("rule-focus", HTMLParagraphElement),
  diagram: requiredElement("structure-diagram", HTMLDetailsElement),
  diagramViewport: requiredElement("diagram-viewport", HTMLElement),
  diagramMessage: requiredElement("diagram-message", HTMLParagraphElement),
  diagramScale: requiredElement("diagram-scale", HTMLSelectElement),
  diagramExport: requiredElement("diagram-export", HTMLButtonElement),
  groupEditor: requiredElement("group-editor", HTMLDetailsElement),
  groupForm: requiredElement("group-edit-form", HTMLFormElement),
  groupSelect: requiredElement("group-select", HTMLSelectElement),
  groupType: requiredElement("group-type", HTMLSelectElement),
  groupName: requiredElement("group-name", HTMLInputElement),
  groupApply: requiredElement("group-apply", HTMLButtonElement),
  groupPreviewButton: requiredElement("group-preview-button", HTMLButtonElement),
  groupPreview: requiredElement("group-preview", HTMLElement),
  groupPreviewClose: requiredElement("group-preview-close", HTMLButtonElement),
  groupBeforeRules: requiredElement("group-before-rules", HTMLElement),
  groupAfterRules: requiredElement("group-after-rules", HTMLElement),
  groupBeforeRegex: requiredElement("group-before-regex", HTMLElement),
  groupAfterRegex: requiredElement("group-after-regex", HTMLElement),
  groupLocate: requiredElement("group-locate", HTMLButtonElement),
  groupInfo: requiredElement("group-info", HTMLParagraphElement),
  groupReferences: requiredElement("group-references", HTMLUListElement),
  groupFeedback: requiredElement("group-feedback", HTMLParagraphElement),
  matchMode: requiredElement("match-mode", HTMLSelectElement),
  addExample: requiredElement("add-example", HTMLButtonElement),
  testSummary: requiredElement("test-summary", HTMLDivElement),
  testList: requiredElement("test-list", HTMLDivElement),
  fixtureFile: requiredElement("fixture-file", HTMLInputElement),
  fixtureImport: requiredElement("fixture-import", HTMLButtonElement),
  fixtureExport: requiredElement("fixture-export", HTMLButtonElement),
  fixtureMarkdown: requiredElement("fixture-markdown", HTMLButtonElement),
  fixtureSave: requiredElement("fixture-save", HTMLButtonElement),
  fixtureRestore: requiredElement("fixture-restore", HTMLButtonElement),
  fixtureShare: requiredElement("fixture-share", HTMLButtonElement),
  fixtureLoadLink: requiredElement("fixture-load-link", HTMLButtonElement),
  fixtureLink: requiredElement("fixture-link", HTMLTextAreaElement),
  fixtureLinkOutput: requiredElement("fixture-link-output", HTMLDivElement),
  fixtureStatus: requiredElement("fixture-status", HTMLParagraphElement),
  draftSave: requiredElement("draft-save", HTMLInputElement),
  draftStatus: requiredElement("draft-status", HTMLParagraphElement),
};

initializeLanguage(document, ui.language);
const updateSyntax = initializeSyntaxEditor(
  ui.rules,
  requiredElement("rules-syntax", HTMLDivElement),
);
setText(ui.output, message("Select a recipe or write a rule"));

const flagInputs = {
  d: ui.matchIndices,
  g: ui.global,
  i: ui.ignoreCase,
  m: ui.multiline,
  s: ui.dotAll,
  y: ui.sticky,
};

/** @type {ProductScenario[]} */
let scenarios = [];
/** @type {string|null} */
let selectedScenarioId = null;
/** @type {TestCase[]} */
let testCases = [];
let nextTestId = 1;
let fixtureRevision = 0;
let shareSequence = 0;
let draftTimer = 0;
/** @type {string|null} */
let savedDraftText = null;
/** @type {Map<number, string>} */
const expectationDrafts = new Map();
/** @type {Map<number, string>} */
const expectationErrors = new Map();
const exactCaseText = new Set();
/** @type {number | null} */
let reverseErrorPosition = null;
/** @type {ReturnType<typeof compile> | null} */
let compiled = null;
/** @type {string | null} */
let renderedRules = null;
/** @type {ReturnType<typeof exportRegex> | null} */
let exported = null;
/** @type {import('../index.d.ts').GroupSegment[]} */
let groupSegments = [];
/** @type {RuleFocus|null} */
let selectedRule = null;
/** @type {RuleFocus|null} */
let visibleRule = null;
let diagramSVG = "";
/** @type {import('../index.d.ts').AnalysisResult|null} */
let reviewResult = null;
let hasEdits =
  ui.rules.value !== "" ||
  Object.values(flagInputs).some((input) => input.checked) ||
  ui.unicodeMode.value !== "u" ||
  ui.matchMode.value !== "full";
let copyFeedbackTimer = 0;
let copySequence = 0;
const testRunner = new TestRunner(
  () => new Worker(new URL("./match-worker.js", import.meta.url), { type: "module" }),
);

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {string} [className=""]
 * @param {string | import('./i18n.js').Message} [text]
 * @returns {HTMLElementTagNameMap[K]}
 */
function make(tag, className = "", text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) setText(node, text);
  return node;
}

/** @param {string} label @param {CompileState} state */
function setCompileState(label, state) {
  setText(ui.compileState, message(label));
  ui.compileState.dataset.state = state;
}

/** @param {string | import('./i18n.js').Message} text @param {boolean} [invalidRules=false] */
function setDiagnostic(text, invalidRules = false) {
  ui.diagnostic.hidden = !text;
  setText(ui.diagnostic, text || "");
  ui.rules.setAttribute("aria-invalid", String(invalidRules));
}

function renderExport() {
  exported = null;
  ui.exportCode.textContent = "";
  ui.exportRequirements.replaceChildren();
  ui.exportCaptures.replaceChildren();
  ui.exportDownload.disabled = true;
  ui.exportJSON.disabled = true;
  ui.exportError.hidden = true;
  delete ui.exportStatus.dataset.state;
  if (!compiled || !ui.exportPanel.open) {
    setText(
      ui.exportStatus,
      message(
        compiled
          ? "Open this panel to generate source code for the selected language."
          : "Compile valid rules to export source code.",
      ),
    );
    return;
  }
  try {
    exported = exportRegex(ui.rules.value, {
      target: /** @type {import('../index.d.ts').ExportTarget} */ (ui.exportTarget.value),
      flags: compiled.flags,
    });
    ui.exportCode.textContent = exported.code;
    setText(
      ui.exportStatus,
      message("{engine}. Source code generated; this browser does not run the exported code.", {
        engine: exported.engine,
      }),
    );
    for (const requirement of exported.requirements)
      ui.exportRequirements.append(make("li", "", requirement));
    for (const capture of exported.captures) {
      const name = capture.name === null ? message("unnamed") : quoteText(capture.name);
      const target = capture.targetName === null ? `#${capture.index}` : capture.targetName;
      ui.exportCaptures.append(
        make(
          "li",
          "",
          message("#{index} {name} → {target}", { index: capture.index, name, target }),
        ),
      );
    }
    ui.exportDownload.disabled = false;
    ui.exportJSON.disabled = false;
  } catch (error) {
    ui.exportStatus.dataset.state = "error";
    setText(
      ui.exportStatus,
      error instanceof CompileError
        ? message("{code} — line {line}, column {column}: {error}{hint}", {
            code: error.code,
            line: error.line,
            column: error.column,
            error: error.message,
            hint: error.hint ? `\n${error.hint}` : "",
          })
        : message("Export failed: {error}", {
            error: error instanceof Error ? error.message : String(error),
          }),
    );
    if (error instanceof CompileError) {
      ui.exportError.hidden = false;
      ui.exportError.onclick = () => selectLine(error.line, error.column, error.endColumn);
    }
  }
}

/** @param {string} text @param {string} filename @param {string} type */
function downloadText(text, filename, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = make("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** @param {number} number @param {number} [column] @param {number} [endColumn] */
function selectLine(number, column, endColumn) {
  // Include the first excess code unit so source-limit errors can still select it.
  const lines = splitLines(ui.rules.value.slice(0, LIMITS.sourceLength + 1));
  const start = lines.slice(0, number - 1).reduce((sum, line) => sum + line.length + 1, 0);
  const end = start + (lines[number - 1]?.length ?? 0);
  const position = column === undefined ? start : Math.min(start + column - 1, end);
  const selectionEnd =
    column === undefined ? end : Math.min(start + (endColumn ?? column + 1) - 1, end);
  selectText(ui.rules, position, selectionEnd);
}

/** @param {HTMLTextAreaElement} field @param {number} start @param {number} end */
function selectText(field, start, end) {
  field.focus({ preventScroll: true });
  field.setSelectionRange(start, end);
  // Measure native wrapping so long literals before the selection count too.
  const style = getComputedStyle(field);
  const measure = make("textarea");
  measure.setAttribute("aria-hidden", "true");
  measure.tabIndex = -1;
  Object.assign(measure.style, {
    position: "fixed",
    visibility: "hidden",
    height: "0",
    minHeight: "0",
    overflow: "hidden",
    border: "0",
    width: `${field.clientWidth}px`,
    padding: style.padding,
    font: style.font,
    tabSize: style.tabSize,
  });
  measure.value = `${field.value.slice(0, start)}\u200b`;
  document.body.append(measure);
  const lineHeight = Number.parseFloat(style.lineHeight);
  const top = measure.scrollHeight - Number.parseFloat(style.paddingBottom) - lineHeight;
  measure.remove();
  field.scrollTop = top - (field.clientHeight - lineHeight) / 2;
  const viewportTop =
    field.getBoundingClientRect().top +
    Number.parseFloat(style.borderTopWidth) +
    top -
    field.scrollTop;
  // Stop pending focus scrolling, and reveal the selected row when outside the viewport.
  window.scrollBy({
    top:
      viewportTop < 0 || viewportTop + lineHeight > window.innerHeight
        ? viewportTop - (window.innerHeight - lineHeight) / 2
        : 0,
    behavior: "instant",
  });
}

/** @param {ReturnType<typeof compile>["segments"] | null} segments */
function renderTrace(segments) {
  const mode = ui.explanationMode.value;
  const help =
    mode === "beginner"
      ? "Read the meaning first; short notes explain regex terms. The compiler's rules and meanings stay in English."
      : mode === "expert"
        ? "Ranges refer to the generated regex, in UTF-16 units. Flags: {flags}. Engine export lists compatibility requirements; this is structure, not an execution trace."
        : "Each rule maps to its generated fragment and compiler explanation.";
  setText(ui.explanationHelp, message(help, { flags: compiled?.flags ?? "—" }));
  ui.trace.dataset.mode = mode;
  ui.trace.replaceChildren();
  if (!segments?.length) {
    ui.trace.append(
      make(
        "p",
        "empty-trace",
        message("Each rule will appear here with its generated fragment and meaning."),
      ),
    );
    return;
  }
  for (const [index, segment] of segments.entries()) {
    const button = make("button", "trace-item");
    button.type = "button";
    setAttribute(
      button,
      "aria-label",
      message("Rule on line {line}: {explanation} Select source line.", {
        line: segment.line,
        explanation: segment.explanation,
      }),
    );
    button.append(make("code", "trace-fragment", segment.source));
    const detail = make("span");
    detail.append(
      make(
        "span",
        "trace-text",
        `${segment.line}:${segment.column} ${escapeControls(segment.text)}`,
      ),
    );
    detail.append(make("span", "trace-meaning", segment.explanation));
    const descriptions = explanationNotes(segment, mode).map((note, noteIndex) => {
      const text = make("span", "trace-note", message(note.key, note.values));
      text.id = `explanation-note-${index}-${noteIndex}`;
      detail.append(text);
      return text.id;
    });
    if (descriptions.length) button.setAttribute("aria-describedby", descriptions.join(" "));
    button.append(detail);
    connectRuleButton(button, segment);
    ui.trace.append(button);
  }
}

/** @param {HTMLButtonElement} button @param {RuleFocus} rule */
function connectRuleButton(button, rule) {
  Object.assign(button.dataset, {
    line: String(rule.line),
    column: String(rule.column),
    sourceStart: String(rule.sourceStart),
    sourceEnd: String(rule.sourceEnd),
  });
  button.addEventListener("pointerenter", () => showRule(rule));
  button.addEventListener("pointerleave", () => showRule(selectedRule));
  button.addEventListener("focus", () => showRule(rule));
  button.addEventListener("blur", () => showRule(selectedRule));
  button.addEventListener("click", () => {
    selectedRule = rule;
    selectLine(rule.line);
    showRule(rule);
  });
}

function renderReview() {
  ui.reviewFindings.replaceChildren();
  ui.reviewLimits.replaceChildren();
  if (!compiled) {
    setText(ui.reviewCount, message("Needs valid rules"));
    setText(ui.reviewStatus, message("Compile valid rules to review the pattern."));
    return;
  }
  if (!ui.review.open && !reviewResult) {
    setText(ui.reviewCount, message("Open to review"));
    setText(ui.reviewStatus, message("Open this panel for a structural review."));
    return;
  }
  try {
    reviewResult ??= analyze(ui.rules.value, { flags: compiled.flags });
    const count = reviewResult.warnings.length;
    setText(
      ui.reviewCount,
      message(
        count ? (count === 1 ? "{count} review note" : "{count} review notes") : "No findings",
        { count },
      ),
    );
    setText(
      ui.reviewStatus,
      message(
        count
          ? "These are heuristic review notes, not measured runtime results. Select one to inspect its source rule."
          : "No heuristic findings detected. This does not prove performance safety.",
      ),
    );
    for (const finding of reviewResult.warnings) {
      const button = make("button", "review-item");
      button.type = "button";
      button.dataset.code = finding.code;
      button.dataset.severity = finding.severity;
      setAttribute(
        button,
        "aria-label",
        message("{severity} on line {line}: {error} Select source line.", {
          severity: message(finding.severity === "warning" ? "Review" : "Information"),
          line: finding.line,
          error: finding.message,
        }),
      );
      button.append(
        make(
          "span",
          "review-label",
          message("{severity} · LINE {line}", {
            severity: message(finding.severity === "warning" ? "REVIEW" : "INFORMATION"),
            line: finding.line,
          }),
        ),
        make("span", "review-message", finding.message),
        make("span", "review-hint", finding.hint),
      );
      connectRuleButton(button, finding);
      ui.reviewFindings.append(button);
    }
    for (const limitation of reviewResult.limitations)
      ui.reviewLimits.append(make("li", "", limitation));
    showRule(visibleRule);
  } catch (error) {
    reviewResult = null;
    ui.reviewFindings.replaceChildren();
    setText(ui.reviewCount, message("Review unavailable"));
    setText(
      ui.reviewStatus,
      message("Pattern review failed: {error} No performance conclusion is available.", {
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

/** @param {Element} element @returns {RuleFocus} */
function ruleFromElement(element) {
  return {
    line: Number(element.getAttribute("data-line")),
    column: Number(element.getAttribute("data-column")),
    sourceStart: Number(element.getAttribute("data-source-start")),
    sourceEnd: Number(element.getAttribute("data-source-end")),
  };
}

function highlightSourceRow() {
  if (!visibleRule) {
    delete ui.rules.dataset.highlight;
    return;
  }
  const lines = splitLines(ui.rules.value);
  const start = lines
    .slice(0, visibleRule.line - 1)
    .reduce((sum, line) => sum + line.length + 1, 0);
  const end = start + (lines[visibleRule.line - 1]?.length ?? 0);
  const style = getComputedStyle(ui.rules);
  const measure = make("textarea");
  measure.setAttribute("aria-hidden", "true");
  Object.assign(measure.style, {
    position: "fixed",
    visibility: "hidden",
    height: "0",
    minHeight: "0",
    overflow: "hidden",
    border: "0",
    width: `${ui.rules.clientWidth}px`,
    padding: style.padding,
    font: style.font,
    tabSize: style.tabSize,
  });
  document.body.append(measure);
  const lineHeight = Number.parseFloat(style.lineHeight);
  const bottomPadding = Number.parseFloat(style.paddingBottom);
  measure.value = `${ui.rules.value.slice(0, start)}\u200b`;
  const top = measure.scrollHeight - bottomPadding - lineHeight - ui.rules.scrollTop;
  measure.value = `${ui.rules.value.slice(0, end)}\u200b`;
  const bottom = measure.scrollHeight - bottomPadding - ui.rules.scrollTop;
  measure.remove();
  ui.rules.dataset.highlight = String(visibleRule.line);
  ui.rules.parentElement?.style.setProperty("--rule-highlight-top", `${top}px`);
  ui.rules.parentElement?.style.setProperty("--rule-highlight-bottom", `${bottom}px`);
}

/** @param {RuleFocus|null} rule */
function showRule(rule) {
  visibleRule = rule;
  ui.ruleFocus.hidden = !rule;
  if (!compiled) return;
  ui.output.replaceChildren(document.createTextNode("/"));
  if (rule) {
    ui.output.append(document.createTextNode(compiled.source.slice(0, rule.sourceStart)));
    ui.output.append(
      make("mark", "regex-focus", compiled.source.slice(rule.sourceStart, rule.sourceEnd)),
    );
    ui.output.append(document.createTextNode(compiled.source.slice(rule.sourceEnd)));
    const line = splitLines(ui.rules.value)[rule.line - 1] ?? "";
    setText(
      ui.ruleFocus,
      message("Line {line}: {text}", { line: rule.line, text: escapeControls(line).slice(0, 180) }),
    );
  } else ui.output.append(document.createTextNode(compiled.source));
  ui.output.append(document.createTextNode(`/${compiled.flags}`));
  for (const item of ui.trace.querySelectorAll("[data-source-start]")) {
    const meta = ruleFromElement(item);
    item.classList.toggle(
      "is-related",
      !!rule && meta.sourceStart >= rule.sourceStart && meta.sourceEnd <= rule.sourceEnd,
    );
  }
  for (const item of ui.reviewFindings.querySelectorAll("[data-source-start]")) {
    const meta = ruleFromElement(item);
    item.classList.toggle(
      "is-related",
      !!rule &&
        ((meta.sourceStart >= rule.sourceStart && meta.sourceEnd <= rule.sourceEnd) ||
          (meta.sourceStart <= rule.sourceStart && meta.sourceEnd >= rule.sourceEnd)),
    );
  }
  const nodes = [...ui.diagramViewport.querySelectorAll("g.diagram-rule")];
  const related = rule
    ? nodes
        .filter((node) => {
          const meta = ruleFromElement(node);
          return meta.sourceStart <= rule.sourceStart && meta.sourceEnd >= rule.sourceEnd;
        })
        .sort((a, b) => {
          const first = ruleFromElement(a),
            second = ruleFromElement(b);
          return first.sourceEnd - first.sourceStart - (second.sourceEnd - second.sourceStart);
        })[0]
    : null;
  const key = related?.getAttribute("data-diagram-key");
  for (const node of ui.diagramViewport.querySelectorAll("[data-diagram-key]")) {
    node.classList.toggle("is-related", !!key && node.getAttribute("data-diagram-key") === key);
  }
  highlightSourceRow();
}

function renderDiagram() {
  ui.diagramExport.disabled = !compiled;
  ui.diagramScale.disabled = !compiled;
  if (!compiled) {
    ui.diagramViewport.replaceChildren();
    setText(ui.diagramMessage, message("Compile valid rules to explore their structure."));
    return;
  }
  if (!ui.diagram.open || diagramSVG) return;
  try {
    diagramSVG = toSVG(ui.rules.value, { flags: compiled.flags });
    const parsed = new DOMParser().parseFromString(diagramSVG, "image/svg+xml");
    const root = parsed.documentElement;
    if (
      root.localName !== "svg" ||
      root.namespaceURI !== "http://www.w3.org/2000/svg" ||
      parsed.querySelector("parsererror")
    )
      throw new Error("The structural SVG could not be read.");
    const svg = document.importNode(root, true);
    svg.setAttribute("role", "group");
    setAttribute(svg, "aria-label", message("Interactive regex structure"));
    for (const node of svg.querySelectorAll("g.diagram-rule")) {
      const rule = ruleFromElement(node);
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      setAttribute(
        node,
        "aria-label",
        message("Line {line}: {text} Select source line.", {
          line: rule.line,
          text: node.querySelector("title")?.textContent ?? "",
        }),
      );
    }
    ui.diagramViewport.replaceChildren(svg);
    setText(
      ui.diagramMessage,
      message(
        "Follow the green rails. Choices run top to bottom; dashed checks consume no text. This is structure, not a runtime backtracking trace.",
      ),
    );
    showRule(selectedRule);
  } catch (error) {
    diagramSVG = "";
    ui.diagramExport.disabled = true;
    ui.diagramMessage.textContent = error instanceof Error ? error.message : String(error);
  }
}

function followSourceCursor() {
  if (!compiled) return;
  const before = splitLines(ui.rules.value.slice(0, ui.rules.selectionStart));
  const line = before.length,
    column = (before.at(-1)?.length ?? 0) + 1;
  /** @type {RuleFocus[]} */
  const candidates = [...compiled.segments];
  /** @param {import('../index.d.ts').CharacterClassMember[]} members */
  function addMembers(members) {
    for (const member of members) {
      candidates.push({ ...member, ...member.location });
      if (member.kind === "set") {
        candidates.push({ ...member, ...member.endLocation });
        addMembers(member.members);
      }
    }
  }
  for (const segment of compiled.segments) {
    if (segment.kind === "atom" && segment.atomType === "characterClass") {
      if (segment.endLocation) candidates.push({ ...segment, ...segment.endLocation });
      addMembers(segment.members);
    }
  }
  const onLine = candidates
    .filter((segment) => segment.line === line)
    .sort((a, b) => b.column - a.column);
  selectedRule = onLine.find((segment) => segment.column <= column) ?? onLine.at(-1) ?? null;
  const scope =
    selectedRule &&
    ui.diagramViewport.querySelector(
      `g.diagram-rule[data-line="${selectedRule.line}"][data-column="${selectedRule.column}"]`,
    );
  if (scope) selectedRule = ruleFromElement(scope);
  showRule(selectedRule);
}

/** @param {string} flags */
function flagsDescription(flags) {
  /** @type {Record<string, string>} */
  const labels = {
    d: "Capture indices",
    g: "Global",
    i: "Ignore case",
    m: "Line anchors",
    s: "Dot all",
    u: "Unicode",
    v: "Unicode sets",
    y: "Sticky",
  };
  return () => [...flags].map((flag) => `${flag} ${message(labels[flag])()}`).join(" · ");
}

function selectedGroup() {
  return groupSegments.find((group) => `${group.line}:${group.column}` === ui.groupSelect.value);
}

function fillGroupFields() {
  clearGroupPreview();
  const group = selectedGroup();
  if (!group) return;
  ui.groupType.value = !group.capturing ? "none" : group.name === null ? "numbered" : "named";
  ui.groupName.value = group.name ?? "";
  ui.groupName.disabled = ui.groupType.value !== "named";
  ui.groupName.setAttribute("aria-invalid", "false");
  ui.groupFeedback.textContent = "";
  const references =
    compiled?.segments.filter(
      (segment) => segment.kind === "backreference" && segment.captureIndex === group.captureIndex,
    ) ?? [];
  setText(
    ui.groupInfo,
    message(
      group.capturing
        ? references.length === 1
          ? "Capture #{index} · {count} reference."
          : "Capture #{index} · {count} references."
        : "Noncapturing group · no capture number or references.",
      { index: group.captureIndex ?? 0, count: references.length },
    ),
  );
  ui.groupReferences.replaceChildren();
  for (const reference of references) {
    const button = make(
      "button",
      "secondary-button",
      message("Reference on line {line}", { line: reference.line }),
    );
    button.type = "button";
    button.addEventListener("click", () => selectLine(reference.line));
    const item = make("li");
    item.append(button);
    ui.groupReferences.append(item);
  }
}

function renderGroupEditor() {
  clearGroupPreview();
  const previous = selectedGroup();
  const selected = ui.groupSelect.value;
  groupSegments =
    compiled?.segments.flatMap((segment) =>
      segment.kind === "group" && segment.edge === "start" ? [segment] : [],
    ) ?? [];
  ui.groupEditor.hidden = groupSegments.length === 0;
  for (const field of [
    ui.groupSelect,
    ui.groupType,
    ui.groupApply,
    ui.groupPreviewButton,
    ui.groupLocate,
  ])
    field.disabled = groupSegments.length === 0;
  ui.groupSelect.replaceChildren();
  for (const group of groupSegments) {
    const option = make(
      "option",
      "",
      message(
        group.capturing
          ? "Capture #{index}{name} · line {line}"
          : "Noncapturing group · line {line}",
        {
          index: group.captureIndex ?? 0,
          name: group.name === null ? "" : ` · ${quoteText(group.name)}`,
          line: group.line,
        },
      ),
    );
    option.value = `${group.line}:${group.column}`;
    ui.groupSelect.append(option);
  }
  if (groupSegments.some((group) => `${group.line}:${group.column}` === selected))
    ui.groupSelect.value = selected;
  const current = selectedGroup();
  if (!current) {
    ui.groupName.disabled = true;
    ui.groupReferences.replaceChildren();
    ui.groupFeedback.textContent = "";
    return;
  }
  const pendingType = ui.groupType.value;
  const pendingName = ui.groupName.value;
  const unchanged =
    previous?.line === current.line &&
    previous.column === current.column &&
    previous.capturing === current.capturing &&
    previous.name === current.name &&
    previous.captureIndex === current.captureIndex;
  fillGroupFields();
  if (unchanged) {
    ui.groupType.value = pendingType;
    ui.groupName.value = pendingName;
    ui.groupName.disabled = pendingType !== "named";
  }
}

/** @param {HTMLDivElement} row @param {string | import('./i18n.js').Message} text */
function setTestResult(row, text) {
  const result = row.querySelector(".test-result");
  if (result) setText(result, text);
  const preview = row.querySelector(".match-preview");
  if (preview instanceof HTMLSpanElement) {
    preview.hidden = true;
    preview.replaceChildren();
  }
  const explorer = row.querySelector(".capture-explorer");
  if (explorer instanceof HTMLDetailsElement) {
    explorer.hidden = true;
    explorer.replaceChildren();
  }
}

/** @param {HTMLDivElement} row @param {import("./worker-protocol.d.ts").TestResult} result @param {import("../index.d.ts").GroupSegment[]} captures @param {string} input */
function renderCaptureExplorer(row, result, captures, input) {
  const explorer = row.querySelector(".capture-explorer");
  if (
    !(explorer instanceof HTMLDetailsElement) ||
    !result.matches?.length ||
    (!captures.length && selectedMatchMode() === "full")
  )
    return;
  const count = result.matches.length;
  explorer.append(
    make(
      "summary",
      "",
      message(
        `{matches} ${count === 1 ? "match" : "matches"} · {captures} ${captures.length === 1 ? "capture" : "captures"} per match`,
        { matches: count, captures: captures.length },
      ),
    ),
  );
  explorer.append(
    make(
      "p",
      "capture-note",
      message(
        "Positions are zero-based UTF-16 spans; the end is excluded. Repeated groups show their final capture.",
      ),
    ),
  );
  if (result.limitReached)
    explorer.append(
      make(
        "p",
        "capture-note",
        message("The 100-match display limit was reached. Matching stops at this limit."),
      ),
    );
  if (captures.length && !result.indicesAvailable)
    explorer.append(
      make(
        "p",
        "capture-note",
        message("This engine reports capture values without positions. No positions are inferred."),
      ),
    );
  for (const [index, match] of result.matches.entries()) {
    const item = make("details", "capture-match");
    item.append(
      make(
        "summary",
        "",
        message("Match {index}: {value} at {position}", {
          index: index + 1,
          value: quoteText(match.value),
          position: match.range.start,
        }),
      ),
    );
    item.addEventListener("toggle", () => {
      if (!item.open || item.querySelector("table")) return;
      const table = make("table", "capture-table");
      table.append(
        make("caption", "", message("Captures for match {index}", { index: index + 1 })),
      );
      const head = make("thead");
      const heading = make("tr");
      for (const label of ["Group", "Value", "Span"]) {
        const cell = make("th", "", message(label));
        cell.scope = "col";
        heading.append(cell);
      }
      head.append(heading);
      const body = make("tbody");
      for (const [captureIndex, capture] of [
        { value: match.value, range: match.range },
        ...match.captures,
      ].entries()) {
        const tr = make("tr");
        const label = make("th");
        label.scope = "row";
        const segment = captures[captureIndex - 1];
        if (segment) {
          const button = make(
            "button",
            "capture-rule",
            `#${captureIndex}${segment.name === null ? "" : ` · ${segment.name}`}`,
          );
          button.type = "button";
          setAttribute(
            button,
            "aria-label",
            message("Go to capture #{index}{name} rule", {
              index: captureIndex,
              name: segment.name === null ? "" : ` ${segment.name}`,
            }),
          );
          button.addEventListener("click", () => selectLine(segment.line));
          label.append(button);
        } else setText(label, message("#0 · Full match"));
        const value =
          capture.value === null
            ? message("Not captured")
            : capture.value === ""
              ? message("{value} (empty)", { value: quoteText(capture.value) })
              : quoteText(capture.value);
        const span = make("td");
        span.append(
          make(
            "span",
            "capture-span",
            capture.range
              ? `${capture.range.start}–${capture.range.end}`
              : capture.value === null
                ? "—"
                : message("Unavailable"),
          ),
        );
        if (capture.range) {
          const range = capture.range;
          const highlight = make("button", "capture-rule capture-highlight", message("Highlight"));
          highlight.type = "button";
          setAttribute(
            highlight,
            "aria-label",
            message("Highlight capture #{capture} in match {match}", {
              capture: captureIndex,
              match: index + 1,
            }),
          );
          highlight.addEventListener("click", () =>
            renderMatchPreview(
              row,
              input,
              range,
              message("Capture #{index} in input: ", { index: captureIndex }),
            ),
          );
          span.append(highlight);
        }
        tr.append(label, make("td", "capture-value", value), span);
        body.append(tr);
      }
      table.append(head, body);
      item.append(table);
    });
    explorer.append(item);
  }
  explorer.hidden = false;
}

/** @param {HTMLDivElement} row @param {string} input @param {{start: number, end: number} | null | undefined} range @param {string | import('./i18n.js').Message} [label] */
function renderMatchPreview(row, input, range, label) {
  const preview = row.querySelector(".match-preview");
  if (!(preview instanceof HTMLSpanElement)) return;
  preview.hidden = true;
  preview.replaceChildren();
  if (!range || (!label && range.start === 0 && range.end === input.length)) return;

  const characters = Array.from(input);
  const start = Array.from(input.slice(0, range.start)).length;
  const matched = Array.from(input.slice(range.start, range.end));
  const end = start + matched.length;
  const context = 18;
  const leftStart = Math.max(0, start - context);
  const rightEnd = Math.min(characters.length, end + context);

  preview.append(make("span", "match-preview-label", label ?? message("Match in input: ")));
  if (leftStart > 0) preview.append(make("span", "match-context", "…"));
  preview.append(
    make("span", "match-context", escapeControls(characters.slice(leftStart, start).join(""))),
  );
  if (matched.length === 0) {
    preview.append(make("span", "match-caret", "|"));
  } else {
    const highlight = make("mark", "match-highlight");
    const visibleMatch =
      matched.length > 96 ? [...matched.slice(0, 48), "…", ...matched.slice(-48)] : matched;
    highlight.textContent = escapeControls(visibleMatch.join(""));
    preview.append(highlight);
  }
  preview.append(
    make("span", "match-context", escapeControls(characters.slice(end, rightEnd).join(""))),
  );
  if (rightEnd < characters.length) preview.append(make("span", "match-context", "…"));
  preview.hidden = false;
}

function selectedMatchMode() {
  if (ui.matchMode.value === "full") return "full";
  if (ui.matchMode.value === "search") return "search";
  throw new Error(`Unknown match mode: ${ui.matchMode.value}`);
}

async function updateTestResults() {
  fixtureRevision++;
  scheduleDraft();
  if (!ui.fixtureLinkOutput.hidden) {
    ui.fixtureLinkOutput.hidden = true;
    ui.fixtureLink.value = "";
    setText(ui.fixtureStatus, message("Workspace changed. Copy a new share link."));
    delete ui.fixtureStatus.dataset.state;
  }
  const rows = [...ui.testList.querySelectorAll(".test-row")].filter(
    (row) => row instanceof HTMLDivElement,
  );
  for (const row of rows) {
    row.querySelector(".expectation-checks")?.replaceChildren();
    const reason = row.querySelector(".failure-reason");
    if (reason instanceof HTMLElement) {
      reason.replaceChildren();
      reason.hidden = true;
    }
  }
  if (expectationErrors.size) {
    testRunner.cancel();
    rows.forEach((row, index) => {
      row.dataset.result = expectationErrors.has(testCases[index].id) ? "invalid" : "pending";
      setTestResult(row, message("Fix the expectation JSON to run the examples."));
    });
    setText(ui.testSummary, message("Fix the expectation JSON to run the examples."));
    ui.testSummary.dataset.state = "error";
    return;
  }
  const tooLong = testCases.map(({ text }) => text.length > 2048);
  rows.forEach((row, index) => {
    const input = row.querySelector("textarea");
    input?.setAttribute("aria-invalid", String(tooLong[index]));
  });
  if (tooLong.includes(true)) {
    testRunner.cancel();
    rows.forEach((row, index) => {
      row.dataset.result = tooLong[index] ? "invalid" : "pending";
      setTestResult(
        row,
        message(
          tooLong[index]
            ? "Example too long. Limit: 2,048 UTF-16 code units."
            : "Shorten the oversized examples to run this example.",
        ),
      );
    });
    setText(ui.testSummary, message("Shorten examples to 2,048 UTF-16 code units or fewer."));
    ui.testSummary.dataset.state = "error";
    return;
  }
  if (!compiled || testCases.length === 0) {
    const invalidRules = ui.rules.getAttribute("aria-invalid") === "true";
    testRunner.cancel();
    rows.forEach((row) => {
      row.dataset.result = "pending";
      setTestResult(
        row,
        message(
          compiled
            ? "Add an example to check the pattern"
            : invalidRules
              ? "Fix the rules to run this example"
              : "Write rules to run this example",
        ),
      );
    });
    setText(
      ui.testSummary,
      message(
        compiled
          ? "Add a positive or negative example to check the pattern."
          : invalidRules
            ? "Fix the rules to run the examples."
            : "Write rules to run the examples.",
      ),
    );
    ui.testSummary.dataset.state = !compiled && invalidRules ? "error" : "neutral";
    return;
  }

  rows.forEach((row) => {
    row.dataset.result = "pending";
    setTestResult(row, message("Checking…"));
  });
  setText(ui.testSummary, message("Checking examples…"));
  ui.testSummary.dataset.state = "neutral";
  try {
    const captures = compiled.segments.flatMap((segment) =>
      segment.kind === "group" && segment.edge === "start" && segment.capturing ? [segment] : [],
    );
    const required = failureRequirements(ui.rules.value, compiled.flags);
    const results = await testRunner.run({
      source: compiled.source,
      flags: compiled.flags,
      mode: selectedMatchMode(),
      cases: testCases.map(({ id, text, expected, expect }) => ({
        id,
        text,
        expected,
        ...(expect ? { expect } : {}),
      })),
      captureCount: captures.length,
    });
    const byId = new Map(results.map((result) => [result.id, result]));
    let passed = 0;
    rows.forEach((row, index) => {
      const evaluation = byId.get(testCases[index].id);
      if (!evaluation) throw new Error(`No result was returned for example ${index + 1}.`);
      if (evaluation.pass) passed += 1;
      row.dataset.result = evaluation.pass ? "pass" : "fail";
      const range = evaluation.matchRange;
      setTestResult(
        row,
        message(
          range
            ? evaluation.actual
              ? "{symbol} Matched {value} at {position}"
              : "{symbol} Found {value} at {position}, not the entire string"
            : "{symbol} No match",
          {
            symbol: evaluation.pass ? "✓" : "!",
            value: range ? quoteText(testCases[index].text.slice(range.start, range.end)) : "",
            position: range?.start ?? 0,
          },
        ),
      );
      renderMatchPreview(row, testCases[index].text, evaluation.matchRange);
      renderCaptureExplorer(row, evaluation, captures, testCases[index].text);
      const reason = explainMismatch(
        required,
        testCases[index].text,
        testCases[index].expected,
        evaluation,
      );
      const explanation = row.querySelector(".failure-reason");
      if (reason && explanation instanceof HTMLElement) {
        const values = { ...reason.values };
        if (typeof values.literal === "string") values.literal = quoteText(values.literal);
        setText(explanation, message(reason.key, values));
        explanation.hidden = false;
      }
      const checks = row.querySelector(".expectation-checks");
      if (checks) {
        for (const [key, label] of [
          ["spans", "Exact spans"],
          ["captures", "Capture values"],
          ["replacement", "Replacement result"],
        ]) {
          const pass =
            evaluation.checks?.[
              /** @type {keyof import('./worker-protocol.d.ts').ExpectationChecks} */ (key)
            ];
          if (pass !== undefined)
            checks.append(
              make(
                "p",
                "",
                message(pass ? "✓ {check} agrees" : "! {check} differs", { check: message(label) }),
              ),
            );
        }
        if (evaluation.matchesTruncated)
          checks.append(
            make("p", "", message("More than 100 matches: exact match expectations cannot pass.")),
          );
        if (evaluation.replacement !== undefined) {
          checks.append(
            make(
              "p",
              "",
              message("Actual replacement ({count} UTF-16 units):", {
                count: evaluation.replacement.length,
              }),
            ),
          );
          const visible = evaluation.replacement.slice(0, 2048);
          checks.append(
            make(
              "code",
              "replacement-result",
              quoteText(visible) + (visible.length < evaluation.replacement.length ? "…" : ""),
            ),
          );
        }
      }
    });
    const focusedRowIndex = rows.findIndex((row) => row.contains(document.activeElement));
    const focusedResult = focusedRowIndex < 0 ? null : byId.get(testCases[focusedRowIndex].id);
    const focusedFeedback = focusedResult
      ? message(
          focusedResult.pass
            ? ". Example {index} matches the expected result."
            : ". Example {index} does not match the expected result.",
          { index: focusedRowIndex + 1 },
        )
      : "";
    setText(
      ui.testSummary,
      message("{passed} of {total} examples behave as expected{feedback}", {
        passed,
        total: testCases.length,
        feedback: focusedFeedback,
      }),
    );
    ui.testSummary.dataset.state = passed === testCases.length ? "success" : "error";
  } catch (error) {
    if (error instanceof TestRunError && error.code === "CANCELLED") return;
    rows.forEach((row) => {
      row.dataset.result = "pending";
      setTestResult(row, message("Testing stopped"));
    });
    setText(ui.testSummary, message(error instanceof Error ? error.message : String(error)));
    ui.testSummary.dataset.state = "error";
  }
}

function renderTests() {
  fixtureRevision++;
  const views = new Map(
    [...ui.testList.querySelectorAll(".test-row")].map((row) => {
      const input = row.querySelector("textarea");
      return [
        row.querySelector(".test-result")?.id,
        input
          ? {
              height: input.style.height,
              start: input.selectionStart,
              end: input.selectionEnd,
              direction: input.selectionDirection,
              top: input.scrollTop,
              left: input.scrollLeft,
              explorerOpen: row.querySelector(".capture-explorer")?.hasAttribute("open") ?? false,
              expectationOpen:
                row.querySelector(".expectation-editor")?.hasAttribute("open") ?? false,
            }
          : null,
      ];
    }),
  );
  ui.testList.replaceChildren();
  ui.addExample.disabled = testCases.length >= 100;
  for (const [index, sample] of testCases.entries()) {
    const number = index + 1;
    const row = make("div", "test-row");
    const input = make("textarea");
    input.spellcheck = false;
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.setAttribute("autocorrect", "off");
    input.value = sample.text;
    if (!exactCaseText.has(sample.id)) sample.text = input.value;
    input.rows = sample.text.split("\n", 3).length;
    const view = views.get(`example-result-${sample.id}`);
    input.style.height = view?.height ?? "";
    if (view) input.setSelectionRange(view.start, view.end, view.direction);
    setAttribute(input, "placeholder", message("Empty string"));
    setAttribute(input, "aria-label", message("Example {index} string", { index: number }));
    input.setAttribute(
      "aria-describedby",
      `example-limits example-result-${sample.id} example-reason-${sample.id}`,
    );
    input.addEventListener("input", () => {
      exactCaseText.delete(sample.id);
      sample.text = input.value;
      input.rows = sample.text.split("\n", 3).length;
      updateTestResults();
    });

    const expected = make("select");
    setAttribute(
      expected,
      "aria-label",
      message("Expected match result for example {index}", { index: number }),
    );
    expected.setAttribute(
      "aria-describedby",
      `example-result-${sample.id} example-reason-${sample.id}`,
    );
    for (const [value, label] of [
      ["true", "Should match"],
      ["false", "Should not match"],
    ]) {
      const option = make("option", "", message(label));
      option.value = value;
      expected.append(option);
    }
    expected.value = String(sample.expected);
    expected.addEventListener("change", () => {
      sample.expected = expected.value === "true";
      updateTestResults();
    });

    const result = make("span", "test-result");
    result.id = `example-result-${sample.id}`;
    const preview = make("span", "match-preview");
    preview.hidden = true;
    preview.setAttribute("aria-hidden", "true");
    const feedback = make("div", "test-feedback");
    const reason = make("p", "failure-reason");
    reason.id = `example-reason-${sample.id}`;
    reason.hidden = true;
    feedback.append(result, preview, reason);
    const remove = make("button", "remove-example", "×");
    remove.type = "button";
    setAttribute(remove, "aria-label", message("Remove example {index}", { index: number }));
    remove.addEventListener("click", () => {
      hasEdits = true;
      expectationDrafts.delete(sample.id);
      expectationErrors.delete(sample.id);
      exactCaseText.delete(sample.id);
      testCases = testCases.filter((item) => item.id !== sample.id);
      renderTests();
      updateTestResults();
      const next =
        ui.testList.querySelectorAll("textarea")[Math.min(index, testCases.length - 1)] ??
        ui.addExample;
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    });
    const explorer = make("details", "capture-explorer");
    explorer.hidden = true;
    explorer.open = view?.explorerOpen ?? false;
    const advanced = make("details", "expectation-editor");
    advanced.open =
      view?.expectationOpen ?? (sample.expect !== undefined || !!expectationDrafts.get(sample.id));
    advanced.append(make("summary", "", message("Exact expectations")));
    const expectationId = `example-expectation-${sample.id}`;
    const label = make("label", "", message("Expected details (JSON)"));
    label.htmlFor = expectationId;
    const details = make("input", "expectation-input");
    details.id = expectationId;
    details.type = "text";
    details.spellcheck = false;
    details.autocomplete = "off";
    details.dir = "ltr";
    details.value =
      expectationDrafts.get(sample.id) ?? (sample.expect ? JSON.stringify(sample.expect) : "");
    const help = make(
      "p",
      "capture-note",
      message(
        "Optional JSON: spans are [start,end] pairs; captures are arrays in group-number order for each match. Use null for absence and an empty string for participation. Limit: 8,192 UTF-16 units.",
      ),
    );
    help.id = `${expectationId}-help`;
    const schema = make(
      "code",
      "replacement-result",
      '{"spans":[[0,1]],"captures":[["A","",null]],"replacement":{"template":"$1!","result":"A!"}}',
    );
    const replacementHelp = make(
      "p",
      "capture-note",
      message(
        "Replacement uses the original flags and JavaScript string replacement tokens. Search lists all matches even without g; replacement without g changes only the first match.",
      ),
    );
    const error = make("p", "expectation-error");
    error.id = `${expectationId}-error`;
    error.textContent = expectationErrors.get(sample.id) ?? "";
    details.setAttribute("aria-invalid", String(expectationErrors.has(sample.id)));
    details.setAttribute("aria-describedby", `${help.id} ${error.id}`);
    setAttribute(
      details,
      "aria-label",
      message("Expected details for example {index}", { index: number }),
    );
    details.addEventListener("input", () => {
      applyExpectationDraft(sample, details.value);
      error.textContent = expectationErrors.get(sample.id) ?? "";
      details.setAttribute("aria-invalid", String(expectationErrors.has(sample.id)));
      updateTestResults();
    });
    advanced.append(
      label,
      details,
      help,
      schema,
      replacementHelp,
      error,
      make("div", "expectation-checks"),
    );
    if (input.value !== sample.text)
      advanced.append(
        make(
          "p",
          "capture-note",
          message(
            "Imported line endings are preserved for testing and export. Editing the example field converts them to LF.",
          ),
        ),
      );
    row.append(input, expected, feedback, remove, advanced, explorer);
    ui.testList.append(row);
    if (view) {
      input.scrollTop = view.top;
      input.scrollLeft = view.left;
    }
  }
}

function currentFlags() {
  return (
    Object.entries(flagInputs)
      .filter(([, input]) => input.checked)
      .map(([flag]) => flag)
      .join("") + ui.unicodeMode.value
  );
}

function currentFixtureText() {
  if (expectationErrors.size) throw new Error("Fix the expectation JSON to run the examples.");
  const fixture = {
    format: "regex-for-humans-tests",
    version: 1,
    rules: ui.rules.value,
    flags: currentFlags().split("").sort().join(""),
    mode: selectedMatchMode(),
    cases: testCases.map(({ text, expected, expect }) => ({
      text,
      expected,
      ...(expect ? { expect } : {}),
    })),
  };
  const text = `${JSON.stringify(fixture, null, 2)}\n`;
  parseFixture(text);
  return text;
}

/** @param {TestCase} sample @param {string} text */
function applyExpectationDraft(sample, text) {
  expectationDrafts.set(sample.id, text);
  try {
    const expect = parseExpectation(text);
    if (expect === undefined) delete sample.expect;
    else sample.expect = expect;
    expectationErrors.delete(sample.id);
  } catch (cause) {
    expectationErrors.set(sample.id, cause instanceof Error ? cause.message : String(cause));
  }
}

/** @param {import('./fixtures.js').TestFixture|import('./fixtures.js').WorkshopDraft} fixture */
function applyFixture(fixture) {
  hasEdits = true;
  ui.rules.value = fixture.rules;
  for (const [flag, input] of Object.entries(flagInputs))
    input.checked = fixture.flags.includes(flag);
  ui.unicodeMode.value = fixture.flags.includes("v") ? "v" : "u";
  ui.matchMode.value = fixture.mode;
  expectationDrafts.clear();
  expectationErrors.clear();
  exactCaseText.clear();
  testCases = fixture.cases.map((item) => {
    /** @type {TestCase} */
    const sample = { id: nextTestId++, text: item.text, expected: item.expected };
    if ("expectation" in item) applyExpectationDraft(sample, item.expectation);
    else if (item.expect) sample.expect = item.expect;
    return sample;
  });
  if (fixture.format === "regex-for-humans-draft") ui.reverseRegex.value = fixture.reverseRegex;
  for (const sample of testCases) exactCaseText.add(sample.id);
  setScenarioSelection(null);
  renderTests();
  compileRules();
}

function pauseDraft() {
  window.clearTimeout(draftTimer);
  draftTimer = 0;
  ui.draftSave.checked = false;
  setText(
    ui.draftStatus,
    message("Draft changed in another tab. Saving paused; current work is unchanged."),
  );
  ui.draftStatus.dataset.state = "error";
}

function saveDraft() {
  window.clearTimeout(draftTimer);
  draftTimer = 0;
  if (!ui.draftSave.checked) return;
  try {
    if (localStorage.getItem(draftStorageKey) !== savedDraftText) {
      pauseDraft();
      return;
    }
    const text = JSON.stringify({
      format: "regex-for-humans-draft",
      version: 1,
      rules: ui.rules.value,
      flags: currentFlags().split("").sort().join(""),
      mode: selectedMatchMode(),
      reverseRegex: ui.reverseRegex.value,
      example: new URLSearchParams(window.location.search).get("example"),
      cases: testCases.map((sample) => ({
        text: sample.text,
        expected: sample.expected,
        expectation:
          expectationDrafts.get(sample.id) ?? (sample.expect ? JSON.stringify(sample.expect) : ""),
      })),
    });
    parseDraft(text);
    if (text !== savedDraftText) localStorage.setItem(draftStorageKey, text);
    savedDraftText = text;
    setText(ui.draftStatus, message("Draft saved in this browser."));
    delete ui.draftStatus.dataset.state;
  } catch (error) {
    setText(
      ui.draftStatus,
      message("Draft not saved: {error}. Current work and the last saved draft are unchanged.", {
        error: error instanceof Error ? message(error.message) : String(error),
      }),
    );
    ui.draftStatus.dataset.state = "error";
  }
}

function scheduleDraft() {
  if (!ui.draftSave.checked) return;
  window.clearTimeout(draftTimer);
  draftTimer = window.setTimeout(saveDraft, 300);
  if (ui.draftStatus.dataset.state !== "pending") {
    setText(ui.draftStatus, message("Draft has unsaved changes."));
    ui.draftStatus.dataset.state = "pending";
  }
}

function initializeDraft() {
  ui.draftSave.checked = false;
  ui.draftSave.disabled = false;
  try {
    savedDraftText = localStorage.getItem(draftStorageKey);
    if (savedDraftText === null) return;
    const draft = parseDraft(savedDraftText);
    const requested = new URLSearchParams(window.location.search).get("example");
    const restore = !hasEdits && (!requested || requested === draft.example);
    if (restore) {
      applyFixture(draft);
      setText(ui.draftStatus, message("Restored saved draft. Review the rules and examples."));
      requiredElement("test-fixtures", HTMLDetailsElement).open = true;
    } else setText(ui.draftStatus, message("Draft saving is enabled in this browser."));
    ui.draftSave.checked = true;
    if (!restore && hasEdits) scheduleDraft();
  } catch (error) {
    setText(
      ui.draftStatus,
      message("Saved draft unavailable: {error}. Current work is unchanged.", {
        error: error instanceof Error ? message(error.message) : String(error),
      }),
    );
    ui.draftStatus.dataset.state = "error";
  }
}

function loadSharedFixture() {
  const fixture = readFixtureLink(window.location.hash);
  if (!fixture) return false;
  applyFixture(fixture);
  setText(
    ui.fixtureStatus,
    message("Loaded {count} shared examples.", { count: fixture.cases.length }),
  );
  delete ui.fixtureStatus.dataset.state;
  ui.fixtureLoadLink.hidden = true;
  requiredElement("test-fixtures", HTMLDetailsElement).open = true;
  return true;
}

function noticeSharedLink() {
  ui.fixtureLoadLink.hidden = !window.location.hash.startsWith("#tests=");
  if (!ui.fixtureLoadLink.hidden) {
    requiredElement("test-fixtures", HTMLDetailsElement).open = true;
    setText(
      ui.fixtureStatus,
      message("Load the shared link to replace the current rules and examples."),
    );
    delete ui.fixtureStatus.dataset.state;
  }
}

/** @param {unknown} error */
function fixtureError(error) {
  setText(
    ui.fixtureStatus,
    message("Fixture unavailable: {error}", {
      error: error instanceof Error ? message(error.message) : String(error),
    }),
  );
  ui.fixtureStatus.dataset.state = "error";
}

/** @type {{source: string, flags: string, start: number, end: number, choices: ReturnType<typeof ruleCompletions>} | null} */
let completion = null;
let composingRules = false;

function closeCompletions(restoreFocus = false) {
  ui.completions.hidden = true;
  ui.completeRule.setAttribute("aria-expanded", "false");
  ui.completionChoice.replaceChildren();
  ui.completionPreview.replaceChildren();
  ui.completionPreviewField.hidden = true;
  completion = null;
  if (restoreFocus) ui.rules.focus();
}

function showCompletionPreview() {
  const choice = completion?.choices[ui.completionChoice.selectedIndex];
  ui.completionPreviewField.hidden = !choice;
  ui.completionPreview.textContent = choice?.preview ?? choice?.text ?? "";
  const label = ui.completionPreviewField.querySelector("span");
  if (label) setText(label, message(choice?.preview ? "Proposed rules:" : "Suggested rule:"));
}

function showCompletions() {
  closeCompletions();
  const source = ui.rules.value;
  const flags = currentFlags();
  const start = ui.rules.selectionStart;
  const end = ui.rules.selectionEnd;
  const choices = composingRules || start !== end ? [] : ruleCompletions(source, start, { flags });
  completion = { source, flags, start, end, choices };
  for (const [index, choice] of choices.entries()) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = choice.text;
    ui.completionChoice.append(option);
  }
  ui.completionChoice.selectedIndex = choices.length ? 0 : -1;
  showCompletionPreview();
  ui.completionChoice.hidden = !choices.length;
  ui.completionApply.disabled = !choices.length;
  setText(
    ui.completionStatus,
    message(
      choices.length
        ? choices.length === 1
          ? "1 validated suggestion."
          : "{count} validated suggestions."
        : "No validated suggestions. Use a single cursor outside quoted text and comments, and fix other rule errors first.",
      { count: choices.length },
    ),
  );
  ui.completions.hidden = false;
  ui.completeRule.setAttribute("aria-expanded", "true");
  (choices.length ? ui.completionChoice : ui.completionClose).focus();
}

function applyCompletion() {
  const choice = completion?.choices[ui.completionChoice.selectedIndex];
  if (
    !completion ||
    !choice ||
    completion.source !== ui.rules.value ||
    completion.flags !== currentFlags() ||
    completion.start !== ui.rules.selectionStart ||
    completion.end !== ui.rules.selectionEnd
  ) {
    closeCompletions(true);
    return;
  }
  ui.rules.value = choice.rules;
  ui.rules.setSelectionRange(choice.caret, choice.caret);
  hasEdits = true;
  fixtureRevision++;
  setScenarioSelection(null);
  compileRules();
  ui.rules.focus();
  followSourceCursor();
}

function compileRules() {
  closeCompletions();
  ui.builderFeedback.textContent = "";
  diagramSVG = "";
  reviewResult = null;
  selectedRule = null;
  visibleRule = null;
  ui.ruleFocus.hidden = true;
  delete ui.rules.dataset.highlight;
  ui.diagramViewport.replaceChildren();
  if (ui.reverseFeedback.dataset.state === "success") {
    ui.reverseFeedback.hidden = true;
    ui.reverseFeedback.textContent = "";
  }
  window.clearTimeout(copyFeedbackTimer);
  setText(ui.copy, message("Copy regex ↗"));
  const rules = ui.rules.value;
  renderedRules = rules;
  /** @type {CompileError|null} */
  let ruleError = null;
  if (rules.length > LIMITS.sourceLength) setText(ui.ruleCount, message("Over limit"));
  else {
    const ruleCount = splitLines(rules).filter(
      (line) => line.trim() && !line.trim().startsWith("#"),
    ).length;
    setText(
      ui.ruleCount,
      message(ruleCount === 1 ? "{count} rule" : "{count} rules", { count: ruleCount }),
    );
  }
  try {
    compiled = compile(rules, { flags: currentFlags() });
    ui.output.textContent = `/${compiled.source}/${compiled.flags}`;
    setText(ui.flagsSummary, flagsDescription(compiled.flags));
    ui.copy.disabled = false;
    setCompileState("Compiled", "success");
    setDiagnostic("");
    renderTrace(compiled.segments);
  } catch (error) {
    if (error instanceof CompileError && error.code !== "EMPTY_SOURCE") ruleError = error;
    compiled = null;
    ui.copy.disabled = true;
    if (error instanceof CompileError && error.code === "EMPTY_SOURCE") {
      setText(ui.output, message("Select a recipe or write a rule"));
      setText(ui.flagsSummary, message("Unicode mode always on"));
      setCompileState("Ready", "neutral");
      setDiagnostic("");
    } else {
      setText(ui.output, message("No pattern generated"));
      setText(ui.flagsSummary, message("Fix the instruction shown below"));
      setCompileState("Needs a fix", "error");
      setDiagnostic(
        error instanceof CompileError
          ? message("Line {line}, column {column}: {error}{hint}", {
              line: error.line,
              column: error.column,
              error: error.message,
              hint: error.hint ? `\n${error.hint}` : "",
            })
          : message("Unexpected compiler error: {error}", {
              error: error instanceof Error ? error.message : String(error),
            }),
        true,
      );
      if (error instanceof CompileError) {
        const jump = make("button", "secondary-button", message("Go to error"));
        jump.type = "button";
        jump.addEventListener("click", () => selectLine(error.line, error.column, error.endColumn));
        ui.diagnostic.append(jump);
      }
    }
    renderTrace(null);
  }
  ui.fixtureMarkdown.disabled = !compiled;
  updateSyntax(rules, ruleError);
  renderGroupEditor();
  renderReview();
  renderDiagram();
  renderExport();
  updateTestResults();
}

/** @param {string|null} id */
function setScenarioSelection(id) {
  selectedScenarioId = id;
  setText(ui.recipeNote, message(scenarios.find((scenario) => scenario.id === id)?.note ?? ""));
  ui.recipeNote.hidden = !ui.recipeNote.textContent;
  for (const button of ui.examples.querySelectorAll("button")) {
    button.setAttribute("aria-current", String(button.dataset.scenario === id));
  }
}

/** @param {ProductScenario} scenario */
function useScenario(scenario) {
  expectationDrafts.clear();
  expectationErrors.clear();
  exactCaseText.clear();
  setScenarioSelection(scenario.id);
  ui.rules.value = scenario.rules;
  ui.rules.setSelectionRange(0, 0);
  ui.rules.scrollTop = 0;
  for (const input of Object.values(flagInputs)) input.checked = false;
  ui.unicodeMode.value = "u";
  ui.matchMode.value = scenario.matchMode;
  testCases = [
    ...scenario.positive.map((text, index) => ({
      id: nextTestId++,
      text,
      expected: true,
      expect: readExpectation(scenario.expectations?.[index]),
    })),
    ...scenario.negative.map((text) => ({ id: nextTestId++, text, expected: false })),
  ];
  const url = new URL(window.location.href);
  url.searchParams.set("example", scenario.id);
  if (url.hash.startsWith("#tests=")) url.hash = "";
  window.history.replaceState(null, "", url);
  ui.fixtureLoadLink.hidden = true;
  renderTests();
  compileRules();
  ui.trace.scrollTop = 0;
  ui.output.parentElement?.scrollTo({ left: 0, behavior: "instant" });
}

function renderScenarioButtons() {
  ui.examples.replaceChildren();
  ui.recipeCount.textContent = scenarios.length
    ? `01—${String(scenarios.length).padStart(2, "0")}`
    : "";
  const visible = filterRecipes(
    scenarios,
    ui.recipeSearch.value,
    ui.recipeCategory.value,
    ui.recipeLevel.value,
    ui.language.value,
  );
  setText(
    ui.recipeResults,
    message("{count} of {total} recipes", { count: visible.length, total: scenarios.length }),
  );
  ui.recipeClear.disabled =
    !ui.recipeSearch.value && !ui.recipeCategory.value && !ui.recipeLevel.value;
  visible.forEach((scenario) => {
    const button = make("button", "example-button");
    button.type = "button";
    button.dataset.scenario = scenario.id;
    button.setAttribute("aria-current", String(scenario.id === selectedScenarioId));
    setAttribute(
      button,
      "aria-description",
      message(levels.find(([id]) => id === scenario.level)?.[1] ?? ""),
    );
    button.append(
      make("span", "example-number", String(scenarios.indexOf(scenario) + 1).padStart(2, "0")),
    );
    const title = make("span", "example-title", message(scenario.title));
    const level = make(
      "span",
      "example-level",
      message(levels.find(([id]) => id === scenario.level)?.[1] ?? ""),
    );
    level.setAttribute("aria-hidden", "true");
    title.append(level);
    button.append(title);
    button.append(make("span", "example-arrow", "↗"));
    button.addEventListener("click", () => useScenario(scenario));
    ui.examples.append(button);
  });
  if (!visible.length)
    ui.examples.append(make("p", "recipe-empty", message("No recipes match. Try fewer filters.")));
}

ui.recipeFilters.addEventListener("submit", (event) => event.preventDefault());
ui.recipeSearch.addEventListener("input", renderScenarioButtons);
ui.recipeCategory.addEventListener("change", renderScenarioButtons);
ui.recipeLevel.addEventListener("change", renderScenarioButtons);
ui.language.addEventListener("change", () => {
  if (scenarios.length) renderScenarioButtons();
});
ui.recipeClear.addEventListener("click", () => {
  ui.recipeSearch.value = "";
  ui.recipeCategory.value = "";
  ui.recipeLevel.value = "";
  renderScenarioButtons();
  ui.recipeSearch.focus();
});

document.addEventListener("input", (event) => {
  if (
    event.target !== ui.language &&
    event.target !== ui.theme &&
    event.target !== ui.explanationMode &&
    event.target !== ui.builderKind &&
    event.target !== ui.completionChoice &&
    event.target !== ui.recipeSearch &&
    event.target !== ui.recipeCategory &&
    event.target !== ui.recipeLevel &&
    event.target !== ui.draftSave &&
    event.target !== ui.fixtureFile
  ) {
    hasEdits = true;
    fixtureRevision++;
  }
});
ui.fixtureImport.addEventListener("click", () => ui.fixtureFile.click());
ui.fixtureLoadLink.addEventListener("click", () => {
  try {
    loadSharedFixture();
  } catch (error) {
    fixtureError(error);
  }
});
window.addEventListener("hashchange", noticeSharedLink);
ui.fixtureFile.addEventListener("change", async () => {
  const file = ui.fixtureFile.files?.[0];
  ui.fixtureFile.value = "";
  if (!file) return;
  const revision = ++fixtureRevision;
  try {
    if (file.size > fixtureLimit) throw new RangeError("Test fixture exceeds the 4 MiB limit.");
    const fixture = parseFixture(await file.text());
    if (revision !== fixtureRevision) {
      setText(
        ui.fixtureStatus,
        message("Import cancelled because the workshop changed. Choose the file again."),
      );
      return;
    }
    applyFixture(fixture);
    setText(
      ui.fixtureStatus,
      message("Imported {count} examples. Review the rules and test results.", {
        count: fixture.cases.length,
      }),
    );
    delete ui.fixtureStatus.dataset.state;
  } catch (error) {
    if (revision === fixtureRevision) fixtureError(error);
  }
});
ui.fixtureExport.addEventListener("click", () => {
  try {
    downloadText(currentFixtureText(), "regex-tests.json", "application/json");
    setText(ui.fixtureStatus, message("Test fixture download started."));
    delete ui.fixtureStatus.dataset.state;
  } catch (error) {
    fixtureError(error);
  }
});
ui.fixtureMarkdown.addEventListener("click", () => {
  try {
    const report = createMarkdownReport(
      currentFixtureText(),
      document.querySelector(".build-label")?.textContent ?? "DEVELOPMENT BUILD",
    );
    downloadText(report, "regex-report.md", "text/markdown;charset=utf-8");
    setText(ui.fixtureStatus, message("Markdown report download started."));
    delete ui.fixtureStatus.dataset.state;
  } catch (error) {
    fixtureError(error);
  }
});
ui.fixtureShare.addEventListener("click", async () => {
  const request = ++shareSequence;
  ui.fixtureLinkOutput.hidden = true;
  ui.fixtureLink.value = "";
  try {
    const link = createFixtureLink(currentFixtureText(), window.location.href);
    const revision = fixtureRevision;
    const focused = document.activeElement;
    const ready = message("Share link ready.");
    ui.fixtureLink.value = link;
    ui.fixtureLinkOutput.hidden = false;
    setText(ui.fixtureStatus, ready);
    delete ui.fixtureStatus.dataset.state;
    try {
      await writeClipboard(link);
      if (
        request !== shareSequence ||
        revision !== fixtureRevision ||
        ui.fixtureStatus.textContent !== ready()
      )
        return;
      setText(ui.fixtureStatus, message("Share link copied."));
    } catch {
      if (
        request !== shareSequence ||
        revision !== fixtureRevision ||
        ui.fixtureStatus.textContent !== ready()
      )
        return;
      if (document.activeElement === focused) {
        ui.fixtureLink.focus();
        ui.fixtureLink.select();
      }
      setText(
        ui.fixtureStatus,
        message("Clipboard unavailable. Select the share link and use your copy shortcut."),
      );
    }
  } catch (error) {
    fixtureError(error);
  }
});
ui.fixtureSave.addEventListener("click", () => {
  try {
    localStorage.setItem(fixtureStorageKey, currentFixtureText());
    setText(
      ui.fixtureStatus,
      message("Tests saved in this browser. Export JSON for a durable copy."),
    );
    delete ui.fixtureStatus.dataset.state;
  } catch (error) {
    fixtureError(error);
  }
});
ui.fixtureRestore.addEventListener("click", () => {
  try {
    const text = localStorage.getItem(fixtureStorageKey);
    if (text === null) {
      setText(ui.fixtureStatus, message("No saved test fixture in this browser."));
      delete ui.fixtureStatus.dataset.state;
      return;
    }
    const fixture = parseFixture(text);
    applyFixture(fixture);
    setText(
      ui.fixtureStatus,
      message("Restored {count} saved examples.", { count: fixture.cases.length }),
    );
    delete ui.fixtureStatus.dataset.state;
  } catch (error) {
    fixtureError(error);
  }
});
ui.draftSave.addEventListener("change", () => {
  window.clearTimeout(draftTimer);
  draftTimer = 0;
  try {
    if (ui.draftSave.checked) {
      savedDraftText = localStorage.getItem(draftStorageKey);
      saveDraft();
    } else {
      localStorage.removeItem(draftStorageKey);
      savedDraftText = null;
      setText(ui.draftStatus, message("Draft saving is off; the saved draft was removed."));
      delete ui.draftStatus.dataset.state;
    }
  } catch {
    setText(
      ui.draftStatus,
      message("Draft storage unavailable. The saved draft could not be read or removed."),
    );
    ui.draftStatus.dataset.state = "error";
  }
});
window.addEventListener("pagehide", () => {
  if (draftTimer) saveDraft();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && draftTimer) saveDraft();
});
window.addEventListener("storage", (event) => {
  if (
    ui.draftSave.checked &&
    (event.key === draftStorageKey || event.key === null) &&
    event.newValue !== savedDraftText
  )
    pauseDraft();
});
ui.rules.addEventListener("input", () => {
  // A multiline paste can repeat input events for the same completed value.
  if (ui.rules.value === renderedRules) return;
  setScenarioSelection(scenarios.find(({ rules }) => rules === ui.rules.value)?.id ?? null);
  compileRules();
});
ui.rules.addEventListener("keyup", followSourceCursor);
ui.completeRule.addEventListener("click", showCompletions);
ui.completionChoice.addEventListener("change", showCompletionPreview);
ui.completionApply.addEventListener("click", applyCompletion);
ui.completionClose.addEventListener("click", () => closeCompletions(true));
ui.completions.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeCompletions(true);
  } else if (event.key === "Enter" && event.target === ui.completionChoice) {
    event.preventDefault();
    applyCompletion();
  }
});
ui.rules.addEventListener("compositionstart", () => {
  composingRules = true;
  closeCompletions();
});
ui.rules.addEventListener("compositionend", () => {
  composingRules = false;
});
ui.rules.addEventListener("keydown", (event) => {
  if (
    event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    event.code === "Space" &&
    !event.isComposing &&
    !composingRules
  ) {
    event.preventDefault();
    showCompletions();
  } else closeCompletions();
});
ui.completeRule.disabled = false;
ui.rules.addEventListener("mouseup", followSourceCursor);
ui.rules.addEventListener("scroll", highlightSourceRow);
new ResizeObserver(highlightSourceRow).observe(ui.rules);
ui.diagram.addEventListener("toggle", renderDiagram);
ui.review.addEventListener("toggle", renderReview);
ui.diagramScale.addEventListener("change", () => {
  ui.diagramViewport.dataset.scale = ui.diagramScale.value;
});
ui.diagramViewport.addEventListener("pointerover", (event) => {
  const node = event.target instanceof Element ? event.target.closest("[data-diagram-key]") : null;
  if (node) showRule(ruleFromElement(node));
});
ui.diagramViewport.addEventListener("pointerleave", () => showRule(selectedRule));
ui.diagramViewport.addEventListener("focusin", (event) => {
  if (event.target instanceof Element && event.target.matches("g.diagram-rule"))
    showRule(ruleFromElement(event.target));
});
ui.diagramViewport.addEventListener("focusout", () => showRule(selectedRule));
/** @param {Element} node */
function selectDiagramRule(node) {
  selectedRule = ruleFromElement(node);
  selectLine(selectedRule.line);
  showRule(selectedRule);
}
ui.diagramViewport.addEventListener("click", (event) => {
  const node = event.target instanceof Element ? event.target.closest("[data-diagram-key]") : null;
  if (node) selectDiagramRule(node);
});
ui.diagramViewport.addEventListener("keydown", (event) => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target instanceof Element &&
    event.target.matches("g.diagram-rule")
  ) {
    event.preventDefault();
    selectDiagramRule(event.target);
  }
});
ui.diagramExport.addEventListener("click", () => {
  renderDiagram();
  if (!compiled || !diagramSVG) return;
  downloadText(diagramSVG, "regex-structure.svg", "image/svg+xml");
  setText(
    ui.diagramMessage,
    message("SVG export started. The standalone file contains the current structure and flags."),
  );
});
ui.exportPanel.addEventListener("toggle", renderExport);
ui.exportTarget.addEventListener("change", renderExport);
for (const viewport of [ui.output.parentElement, ui.exportViewport]) {
  if (!viewport) continue;
  viewport.addEventListener("keydown", (event) => {
    if (
      event.target !== viewport ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight") ||
      viewport.scrollWidth <= viewport.clientWidth
    )
      return;
    // Native keyboard scrolling varies across browser and mobile contexts.
    event.preventDefault();
    viewport.scrollBy({ left: event.key === "ArrowRight" ? 40 : -40, behavior: "instant" });
  });
}
ui.exportDownload.addEventListener("click", () => {
  if (!exported) return;
  const filenames = {
    javascript: "regex-export.js",
    typescript: "regex-export.ts",
    python: "regex_export.py",
    rust: "regex-export.rs",
    go: "regex-export.go",
    java: "RegexExample.java",
    csharp: "RegexExport.cs",
    php: "regex-export.php",
    ruby: "regex_export.rb",
  };
  downloadText(`${exported.code}\n`, filenames[exported.target], "text/plain;charset=utf-8");
});
ui.exportJSON.addEventListener("click", () => {
  if (!exported) return;
  downloadText(
    `${JSON.stringify(exported, null, 2)}\n`,
    `regex-export-${exported.target}.json`,
    "application/json",
  );
});
ui.output.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  if (!compiled || !selection?.rangeCount || !ui.output.contains(selection.focusNode)) return;
  const range = selection.getRangeAt(0);
  if (!ui.output.contains(range.startContainer) || !ui.output.contains(range.endContainer)) return;
  const before = document.createRange();
  before.selectNodeContents(ui.output);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  before.setEnd(range.endContainer, range.endOffset);
  const end = before.toString().length;
  const offset = start - 1;
  selectedRule =
    compiled.segments
      .filter((segment) => segment.sourceStart <= offset && segment.sourceEnd > offset)
      .sort((a, b) => a.sourceEnd - a.sourceStart - (b.sourceEnd - b.sourceStart))[0] ?? null;
  showRule(selectedRule);
  const walker = document.createTreeWalker(ui.output, NodeFilter.SHOW_TEXT);
  const restored = document.createRange();
  let position = 0;
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (start >= position && start <= position + length) restored.setStart(node, start - position);
    if (end >= position && end <= position + length) {
      restored.setEnd(node, end - position);
      break;
    }
    position += length;
    node = walker.nextNode();
  }
  selection.removeAllRanges();
  selection.addRange(restored);
});
ui.groupSelect.addEventListener("change", fillGroupFields);
ui.groupType.addEventListener("change", () => {
  clearGroupPreview();
  ui.groupName.disabled = ui.groupType.value !== "named";
  ui.groupName.setAttribute("aria-invalid", "false");
  ui.groupFeedback.textContent = "";
});
ui.groupName.addEventListener("input", () => {
  clearGroupPreview();
  ui.groupName.setAttribute("aria-invalid", "false");
  ui.groupFeedback.textContent = "";
});
ui.groupPreviewClose.addEventListener("click", () => {
  clearGroupPreview();
  ui.groupFeedback.textContent = "";
  ui.groupPreviewButton.focus();
});
ui.groupLocate.addEventListener("click", () => {
  const group = selectedGroup();
  if (group) selectLine(group.line);
});
ui.builderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const added = insertRule(ui.rules.value, ui.rules.selectionStart, ui.builderKind.value, {
      flags: currentFlags(),
    });
    ui.rules.value = added.rules;
    hasEdits = true;
    setScenarioSelection(null);
    compileRules();
    selectLine(added.line, added.column);
    followSourceCursor();
    setText(
      ui.builderFeedback,
      message("Rule inserted on line {line}. Edit the template in the rule field.", {
        line: added.line,
      }),
    );
    ui.builderFeedback.dataset.state = "success";
  } catch (error) {
    setText(
      ui.builderFeedback,
      message("Edit rejected. Original rules unchanged. {error}", {
        error:
          error instanceof CompileError
            ? message("Line {line}, column {column}: {error}{hint}", {
                line: error.line,
                column: error.column,
                error: escapeControls(error.message),
                hint: error.hint ? ` ${error.hint}` : "",
              })
            : error instanceof Error
              ? error.message
              : String(error),
      }),
    );
    ui.builderFeedback.dataset.state = "error";
  }
});
function clearGroupPreview() {
  ui.groupPreview.hidden = true;
  ui.groupPreviewButton.setAttribute("aria-expanded", "false");
  for (const output of [
    ui.groupBeforeRules,
    ui.groupAfterRules,
    ui.groupBeforeRegex,
    ui.groupAfterRegex,
  ])
    output.replaceChildren();
}

/** @param {HTMLElement} previous @param {HTMLElement} next @param {string} before @param {string} after */
function renderGroupChange(previous, next, before, after) {
  previous.replaceChildren();
  next.replaceChildren();
  for (const change of textChanges(before, after)) {
    for (const [output, tag, text] of /** @type {const} */ ([
      [previous, "del", change.before],
      [next, "ins", change.after],
    ])) {
      output.append(document.createTextNode(change.prefix));
      if (text) output.append(make(tag, "", text));
      output.append(document.createTextNode(change.suffix));
    }
  }
}

/** @param {boolean} preview */
function changeGroup(preview) {
  const group = selectedGroup();
  if (!compiled || !group) return;
  clearGroupPreview();
  try {
    const rules = editGroup(
      ui.rules.value,
      group,
      {
        capturing: ui.groupType.value !== "none",
        name: ui.groupType.value === "named" ? ui.groupName.value : null,
      },
      { flags: compiled.flags },
    );
    ui.groupName.setAttribute("aria-invalid", "false");
    if (preview) {
      if (rules === ui.rules.value) {
        setText(ui.groupFeedback, message("No group changes to preview."));
      } else {
        const result = compile(rules, { flags: compiled.flags });
        renderGroupChange(ui.groupBeforeRules, ui.groupAfterRules, ui.rules.value, rules);
        renderGroupChange(
          ui.groupBeforeRegex,
          ui.groupAfterRegex,
          `/${compiled.source}/${compiled.flags}`,
          `/${result.source}/${result.flags}`,
        );
        ui.groupPreview.hidden = false;
        ui.groupPreviewButton.setAttribute("aria-expanded", "true");
        setText(ui.groupFeedback, message("Preview ready. Original rules unchanged."));
      }
      ui.groupFeedback.dataset.state = "success";
      return;
    }
    ui.rules.value = rules;
    hasEdits = true;
    setScenarioSelection(null);
    compileRules();
    setText(
      ui.groupFeedback,
      message("Group updated. References keep their original capture targets."),
    );
    ui.groupFeedback.dataset.state = "success";
  } catch (error) {
    setText(
      ui.groupFeedback,
      message("Edit rejected. Original rules unchanged. {error}", {
        error:
          error instanceof CompileError
            ? message("Line {line}, column {column}: {error}{hint}", {
                line: error.line,
                column: error.column,
                error: escapeControls(error.message),
                hint: error.hint ? ` ${error.hint}` : "",
              })
            : error instanceof Error
              ? error.message
              : String(error),
      }),
    );
    ui.groupFeedback.dataset.state = "error";
    ui.groupName.setAttribute(
      "aria-invalid",
      String(
        error instanceof CompileError &&
          ["INVALID_CAPTURE_NAME", "DUPLICATE_CAPTURE_NAME"].includes(error.code),
      ),
    );
  }
}
ui.groupPreviewButton.addEventListener("click", () => changeGroup(true));
ui.groupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  changeGroup(false);
});
for (const input of Object.values(flagInputs)) input.addEventListener("change", compileRules);
ui.unicodeMode.addEventListener("change", compileRules);
ui.reverseRegex.addEventListener("input", () => {
  scheduleDraft();
  ui.reverseRegex.setAttribute("aria-invalid", "false");
  ui.reverseFeedback.hidden = true;
  ui.reverseFeedback.textContent = "";
  ui.reverseError.hidden = true;
  reverseErrorPosition = null;
});
ui.reverseRegex.addEventListener("keydown", (event) => {
  if (
    event.key !== "Enter" ||
    !(event.ctrlKey || event.metaKey) ||
    event.shiftKey ||
    event.altKey ||
    event.isComposing
  )
    return;
  event.preventDefault();
  ui.reverseButton.click();
});
ui.reverseError.addEventListener("click", () => {
  if (reverseErrorPosition !== null)
    selectText(ui.reverseRegex, reverseErrorPosition, reverseErrorPosition + 1);
});
ui.reverseButton.addEventListener("click", () => {
  ui.reverseError.hidden = true;
  reverseErrorPosition = null;
  try {
    const translated = regexToRules(parseRegexLiteral(ui.reverseRegex.value));
    ui.rules.value = translated.rules;
    for (const [flag, input] of Object.entries(flagInputs))
      input.checked = translated.flags.includes(flag);
    ui.unicodeMode.value = translated.flags.includes("v") ? "v" : "u";
    setScenarioSelection(null);
    hasEdits = true;
    compileRules();
    ui.trace.scrollTop = 0;
    ui.output.parentElement?.scrollTo({ left: 0, behavior: "instant" });
    ui.reverseRegex.setAttribute("aria-invalid", "false");
    ui.reverseFeedback.dataset.state = "success";
    setText(ui.reverseFeedback, message("Translated. Review the rules and test your examples."));
    ui.reverseFeedback.hidden = false;
    selectText(ui.rules, 0, 0);
  } catch (error) {
    const hint = error instanceof CompileError && error.hint ? ` ${error.hint}` : "";
    ui.reverseRegex.setAttribute("aria-invalid", "true");
    ui.reverseFeedback.dataset.state = "error";
    setText(
      ui.reverseFeedback,
      error instanceof CompileError
        ? message("Column {column}: {error}{hint}", {
            column: error.column,
            error: error.message,
            hint,
          })
        : error instanceof Error
          ? error.message
          : String(error),
    );
    ui.reverseFeedback.hidden = false;
    if (error instanceof CompileError && error.code === "UNSUPPORTED_REGEX") {
      const input = ui.reverseRegex.value;
      reverseErrorPosition = input.length - input.trimStart().length + error.column;
      ui.reverseError.hidden = false;
    }
  }
});
ui.reverseButton.disabled = false;
ui.builderKind.disabled = false;
ui.builderInsert.disabled = false;
ui.explanationMode.addEventListener("change", () => {
  const top = ui.trace.scrollTop;
  renderTrace(compiled?.segments ?? null);
  showRule(visibleRule);
  ui.trace.scrollTop = top;
});
ui.matchMode.addEventListener("change", updateTestResults);
ui.addExample.addEventListener("click", () => {
  hasEdits = true;
  testCases.push({ id: nextTestId++, text: "", expected: true });
  renderTests();
  updateTestResults();
  ui.testList.lastElementChild?.querySelector("textarea")?.focus();
});
ui.addExample.disabled = false;
/** @param {string} text */
async function writeClipboard(text) {
  let timer = 0;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) => {
        timer = window.setTimeout(() => reject(new Error("Clipboard request timed out")), 1000);
      }),
    ]);
  } finally {
    window.clearTimeout(timer);
  }
}
ui.copy.addEventListener("click", async () => {
  if (!compiled) return;
  const result = compiled;
  const text = `/${result.source}/${result.flags}`;
  const request = ++copySequence;
  const focused = document.activeElement;
  window.clearTimeout(copyFeedbackTimer);
  setText(ui.copy, message("Copy regex ↗"));
  setDiagnostic("");
  try {
    await writeClipboard(text);
  } catch {
    if (compiled !== result || request !== copySequence) return;
    if (document.activeElement !== focused) {
      setDiagnostic(
        message("Clipboard access was blocked. Select the pattern and press your copy shortcut."),
      );
      return;
    }
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
          message(
            "Clipboard access was blocked. The pattern is selected; press your keyboard copy shortcut.",
          ),
        );
      } else {
        setDiagnostic(
          message("Clipboard access was blocked. Select the pattern and press your copy shortcut."),
        );
      }
      return;
    }
  }
  if (compiled !== result || request !== copySequence) return;
  setDiagnostic("");
  setText(ui.copy, message("Copied ✓"));
  copyFeedbackTimer = window.setTimeout(() => {
    setText(ui.copy, message("Copy regex ↗"));
  }, 1800);
});

try {
  if (hasEdits && window.location.hash.startsWith("#tests=")) {
    noticeSharedLink();
    compileRules();
  } else if (!loadSharedFixture() && hasEdits) compileRules();
} catch (error) {
  fixtureError(error);
  requiredElement("test-fixtures", HTMLDetailsElement).open = true;
  if (hasEdits) compileRules();
}
initializeDraft();

try {
  const response = await fetch(new URL("../test/fixtures/product-scenarios.json", import.meta.url));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const loaded = await response.json();
  if (!Array.isArray(loaded)) throw new Error("Invalid example recipe data");
  if (loaded.length === 0) throw new Error("No example recipes are available.");
  const ids = new Set();
  for (const scenario of loaded) {
    if (
      typeof scenario?.id !== "string" ||
      !scenario.id.trim() ||
      ids.has(scenario.id) ||
      typeof scenario.title !== "string" ||
      !scenario.title.trim() ||
      typeof scenario.note !== "string" ||
      typeof scenario.rules !== "string" ||
      !Array.isArray(scenario.categories) ||
      !scenario.categories.length ||
      scenario.categories.length > categories.length ||
      new Set(scenario.categories).size !== scenario.categories.length ||
      scenario.categories.some(
        (/** @type {unknown} */ category) => !categories.some(([id]) => id === category),
      ) ||
      !levels.some(([id]) => id === scenario.level) ||
      !["full", "search"].includes(scenario.matchMode) ||
      !Array.isArray(scenario.positive) ||
      !Array.isArray(scenario.negative) ||
      scenario.positive.length + scenario.negative.length > 100 ||
      [...scenario.positive, ...scenario.negative].some(
        (text) => typeof text !== "string" || text.replace(/\r\n?/gu, "\n").length > 2048,
      )
    ) {
      throw new Error("Invalid example recipe data");
    }
    compile(scenario.rules);
    if (scenario.expectations !== undefined) {
      if (
        !Array.isArray(scenario.expectations) ||
        scenario.expectations.length !== scenario.positive.length
      )
        throw new Error("Invalid example recipe data");
      scenario.expectations = scenario.expectations.map((/** @type {unknown} */ value) =>
        readExpectation(value),
      );
    }
    ids.add(scenario.id);
  }
  scenarios = loaded;
  for (const picker of [ui.recipeCategory, ui.recipeLevel]) {
    const values = picker === ui.recipeCategory ? categories : levels;
    for (const [id, label] of values) {
      const option = make("option", "", message(label));
      option.value = id;
      picker.append(option);
    }
  }
  ui.recipeSearch.disabled = false;
  ui.recipeCategory.disabled = false;
  ui.recipeLevel.disabled = false;
  renderScenarioButtons();
  const requested = new URLSearchParams(window.location.search).get("example");
  const scenario = scenarios.find((item) => item.id === requested) ?? scenarios[0];
  if (!scenario) throw new Error("No example recipes are available.");
  if (!hasEdits) useScenario(scenario);
} catch (error) {
  const notice = make(
    "p",
    "empty-trace",
    message("Example recipes could not load ({error}). You can still write rules manually.", {
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  notice.setAttribute("role", "status");
  ui.examples.replaceChildren(notice);
  if (!hasEdits) setText(ui.testSummary, message("Write rules and add an example to test them."));
}
