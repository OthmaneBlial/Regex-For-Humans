import { LIMITS } from "../src/limits.js";

/** @typedef {"text"|"keyword"|"string"|"capture"|"quantifier"|"assertion"|"alternation"|"comment"|"invalid"} TokenKind */
/** @typedef {{start: number, end: number, kind: TokenKind}} SyntaxToken */
/** @typedef {{line: number, column: number}} DiagnosticLocation */

const gap = String.raw`[^\S\r\n\u2028\u2029]+`;
const pieces = new RegExp(
  `(?:not${gap})?(?:followed|preceded)${gap}by|(?:not${gap})?word${gap}boundary|line${gap}(?:start|end)|same${gap}as${gap}capture|(?:zero|one)${gap}or${gap}more|at${gap}least|[+-]?[\\p{Nd}]+(?:\\.[\\p{Nd}]*)?|[\\p{L}\\p{N}_]+|[^\\S\\r\\n\\u2028\\u2029]+|.`,
  "iyu",
);
const keywords = new Set(
  "word character characters not digit digits letter letters uppercase lowercase hex space spaces path segment any text except one of none unicode property range to class string strings set union intersection subtraction code point sequence".split(
    " ",
  ),
);
const captures = new Set(["capture", "group", "same as capture"]);
const assertions = new Set([
  "start",
  "end",
  "line start",
  "line end",
  "word boundary",
  "not word boundary",
  "followed by",
  "not followed by",
  "preceded by",
  "not preceded by",
]);
const quantifiers = new Set([
  "lazy",
  "optional",
  "between",
  "and",
  "at least",
  "zero or more",
  "one or more",
]);

/** @param {string} source @param {DiagnosticLocation|null} [diagnostic] @returns {SyntaxToken[]|null} */
export function tokenizeRules(source, diagnostic = null) {
  if (source.length > LIMITS.sourceLength) return null;
  /** @type {SyntaxToken[]} */
  const tokens = [];
  let index = 0;
  let line = 1;
  let column = 1;
  let leading = true;
  let previous = "";
  let marked = false;
  while (index < source.length) {
    const start = index;
    /** @type {TokenKind} */
    let kind = "text";
    let newline = false;
    if ("\r\n\u2028\u2029".includes(source[index])) {
      index += source[index] === "\r" && source[index + 1] === "\n" ? 2 : 1;
      newline = true;
    } else if (leading && source[index] === "#") {
      while (index < source.length && !"\r\n\u2028\u2029".includes(source[index])) index++;
      kind = "comment";
    } else if (source[index] === '"') {
      index++;
      let closed = false;
      while (index < source.length) {
        const character = source[index++];
        if (character === "\\") {
          if (index < source.length) index++;
        } else if (character === '"') {
          closed = true;
          break;
        }
      }
      kind = closed
        ? captures.has(previous) && previous !== "group"
          ? "capture"
          : "string"
        : "invalid";
    } else {
      pieces.lastIndex = index;
      const text = pieces.exec(source)?.[0] ?? source[index];
      index += text.length;
      const phrase = text.toLowerCase().replace(/\s+/gu, " ");
      if (captures.has(phrase)) kind = "capture";
      else if (assertions.has(phrase)) kind = "assertion";
      else if (phrase === "either") kind = "alternation";
      else if (quantifiers.has(phrase) || /^[+-]?[0-9]+(?:\.[0-9]*)?$/u.test(phrase))
        kind = previous === "same as capture" ? "capture" : "quantifier";
      else if (keywords.has(phrase) || /^[{}:,]$/u.test(phrase)) kind = "keyword";
      if (text.trim()) previous = phrase;
    }
    if (
      diagnostic?.line === line &&
      diagnostic.column >= column &&
      diagnostic.column < column + index - start
    ) {
      kind = "invalid";
      marked = true;
    }
    const last = tokens.at(-1);
    if (last?.kind === kind) last.end = index;
    else tokens.push({ start, end: index, kind });
    if (newline) {
      line++;
      if (line > LIMITS.lines && (index < source.length || line > LIMITS.lines + 1)) return null;
      column = 1;
      leading = true;
      previous = "";
    } else {
      column += index - start;
      if (source.slice(start, index).trim()) leading = false;
    }
  }
  if (line - Number(column === 1) > LIMITS.lines) return null;
  if (!marked && diagnostic?.line === line && diagnostic.column === column)
    tokens.push({ start: index, end: index, kind: "invalid" });
  return tokens;
}

/** @param {HTMLTextAreaElement} input @param {HTMLDivElement} viewport */
export function initializeSyntaxEditor(input, viewport) {
  const parent = input.parentElement;
  if (!parent) throw new Error("The rule editor needs its highlight container.");
  const content = document.createElement("pre");
  content.className = "syntax-source";
  viewport.append(content);
  function sync() {
    if (viewport.hidden) return;
    const style = getComputedStyle(input);
    Object.assign(viewport.style, {
      top: `${input.clientTop}px`,
      left: `${input.clientLeft}px`,
      right: `${input.offsetWidth - input.clientWidth - input.clientLeft}px`,
      height: `${input.clientHeight}px`,
    });
    Object.assign(content.style, {
      padding: style.padding,
      font: style.font,
      tabSize: style.tabSize,
      letterSpacing: style.letterSpacing,
      wordSpacing: style.wordSpacing,
      fontKerning: style.fontKerning,
      direction: style.direction,
      unicodeBidi: style.unicodeBidi,
      textAlign: style.textAlign,
      transform: `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`,
    });
  }
  input.addEventListener("scroll", sync, { passive: true });
  new ResizeObserver(sync).observe(input);
  /** @param {string} source @param {DiagnosticLocation|null} [diagnostic] */
  return (source, diagnostic = null) => {
    const tokens = tokenizeRules(source, diagnostic);
    if (!tokens) {
      content.replaceChildren();
      viewport.hidden = true;
      delete parent.dataset.colorized;
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const token of tokens) {
      const text = source.slice(token.start, token.end);
      if (token.kind === "text") fragment.append(document.createTextNode(text));
      else {
        const span = document.createElement("span");
        span.className = `syntax-${token.kind}`;
        span.textContent = text;
        fragment.append(span);
      }
    }
    content.replaceChildren(fragment);
    parent.dataset.colorized = "true";
    viewport.hidden = false;
    sync();
  };
}
