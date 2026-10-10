import { translations } from "./translations.js";

/** @typedef {() => string} Message */
/** @typedef {Record<string, string | number | Message>} Values */
export const languages = ["en", "zh-CN", "es", "fr"];
export const languageStorageKey = "regex-for-humans:workshop-language";
let language = "en";
/** @type {WeakMap<Text, Message>} */
const textBindings = new WeakMap();
/** @type {WeakMap<Element, Map<string, Message>>} */
const attributeBindings = new WeakMap();

/** @param {string} locale @param {string} text @param {Values} [values] */
export function translate(locale, text, values = {}) {
  const column = languages.indexOf(locale) - 1;
  const template =
    column >= 0 && Object.hasOwn(translations, text) ? translations[text][column] : text;
  return template.replace(/\{(\w+)\}/gu, (token, key) => {
    if (!Object.hasOwn(values, key)) return token;
    const value = values[key];
    return String(typeof value === "function" ? value() : value);
  });
}

/** @param {string} text @param {Values} [values] @returns {Message} */
export function message(text, values) {
  return () => translate(language, text, values);
}

/** @param {Element} node @param {string | Message} text */
export function setText(node, text) {
  const child = document.createTextNode(typeof text === "function" ? text() : text);
  node.replaceChildren(child);
  if (typeof text === "function") textBindings.set(child, text);
}

/** @param {Element} node @param {string} name @param {Message} text */
export function setAttribute(node, name, text) {
  let bindings = attributeBindings.get(node);
  if (!bindings) {
    bindings = new Map();
    attributeBindings.set(node, bindings);
  }
  bindings.set(name, text);
  node.setAttribute(name, text());
}

/** @param {Document} document @param {HTMLSelectElement} picker */
export function initializeLanguage(document, picker) {
  // Bind trusted initial UI once; later user strings and generated code are never scanned.
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (
      !(node instanceof Text) ||
      node.parentElement?.closest("code, pre, textarea, script, style, noscript")
    )
      continue;
    const key = node.data.trim();
    if (!Object.hasOwn(translations, key)) continue;
    const before = node.data.slice(0, node.data.indexOf(key));
    const after = node.data.slice(before.length + key.length);
    textBindings.set(node, () => `${before}${translate(language, key)}${after}`);
  }
  for (const node of document.querySelectorAll("[aria-label], [title]")) {
    for (const name of ["aria-label", "title"]) {
      const text = node.getAttribute(name);
      if (text && Object.hasOwn(translations, text)) setAttribute(node, name, message(text));
    }
  }
  /** @param {string} requested */
  function apply(requested) {
    language = languages.includes(requested) ? requested : "en";
    document.documentElement.lang = language;
    picker.value = language;
    const nodes = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    );
    for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
      if (node instanceof Text) {
        const binding = textBindings.get(node);
        if (binding) node.data = binding();
      } else if (node instanceof Element) {
        for (const [name, binding] of attributeBindings.get(node) ?? [])
          node.setAttribute(name, binding());
      }
    }
  }
  let saved = "en";
  try {
    saved = localStorage.getItem(languageStorageKey) ?? "en";
  } catch {
    /* Storage is optional. */
  }
  apply(saved);
  picker.addEventListener("change", () => {
    apply(picker.value);
    try {
      localStorage.setItem(languageStorageKey, language);
    } catch {
      /* Storage is optional. */
    }
  });
  picker.disabled = false;
}
