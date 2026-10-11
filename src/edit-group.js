import { compileAst } from "./compiler.js";
import { fail } from "./diagnostics.js";
import { quoteText } from "./display.js";
import { LIMITS, parse, splitLines } from "./parser.js";

/** Change one group while preserving the targets of existing references.
 * @param {string} source
 * @param {import('./ast.js').Location} location Opening-rule location from a group segment.
 * @param {{capturing: boolean, name: string|null}} definition
 * @param {{flags?: string|undefined}} [options]
 * @returns {string} Validated editable rules; the input is never mutated.
 */
export function editGroup(source, location, definition, options = {}) {
  if (
    !location ||
    !Number.isSafeInteger(location.line) ||
    !Number.isSafeInteger(location.column) ||
    location.line < 1 ||
    location.column < 1
  )
    throw new TypeError("Expected a positive group line and column.");
  if (
    !definition ||
    typeof definition.capturing !== "boolean" ||
    !(definition.name === null || typeof definition.name === "string") ||
    (!definition.capturing && definition.name !== null)
  )
    throw new TypeError(
      "Expected capturing and a string/null name; noncapturing groups need null.",
    );

  const parsed = parse(source);
  compileAst(parsed, options);
  /** @type {import('./ast.js').GroupNode[]} */
  const groups = [];
  /** @type {import('./ast.js').BackreferenceNode[]} */
  const references = [];
  /** @param {import('./ast.js').RuleNode[]} nodes */
  function visit(nodes) {
    for (const node of nodes) {
      if (node.kind === "group") {
        groups.push(node);
        visit(node.nodes);
      } else if (node.kind === "assertion") visit(node.nodes);
      else if (node.kind === "alternation") {
        for (const branch of node.branches) visit(branch);
      } else if (node.kind === "backreference") references.push(node);
    }
  }
  visit(parsed.nodes);
  const target = groups.find(
    (group) => group.location.line === location.line && group.location.column === location.column,
  );
  if (!target)
    fail(
      "UNKNOWN_GROUP",
      "No group opens at this location.",
      location,
      "Use a starting group segment's line and column.",
    );
  if (target.capturing === definition.capturing && target.name === definition.name) return source;
  if (definition.name !== null && definition.name.length > LIMITS.sourceLength)
    fail(
      "SOURCE_LIMIT",
      `A capture name cannot exceed ${LIMITS.sourceLength} UTF-16 code units.`,
      location,
    );
  if (!definition.capturing && target.captureIndex !== null) {
    const reference = references.find((node) => node.captureIndex === target.captureIndex);
    if (reference)
      fail(
        "REFERENCED_CAPTURE",
        `Capture #${target.captureIndex} cannot become noncapturing while a reference targets it.`,
        reference.referenceLocation,
        "Remove or change its references first; the original rules have not changed.",
      );
  }

  const indices = new Map();
  let count = 0;
  for (const group of groups) {
    if (group === target ? definition.capturing : group.capturing) {
      count += 1;
      if (group.captureIndex !== null) indices.set(group.captureIndex, count);
    }
  }
  const lines = splitLines(source);
  const offsets = [];
  let start = 0;
  for (const line of lines) {
    offsets.push(start);
    start += line.length;
    start += source.slice(start, start + 2) === "\r\n" ? 2 : 1;
  }
  const header =
    /(?:group|capture)(?:\s+"(?:[^"\\]|\\.)*")?(?:\s+with flags\s+"(?:[^"\\]|\\.)*")?\s*(?=\{$)/iu.exec(
      target.text,
    );
  if (!header) throw new Error("A parsed group is missing its opening header.");
  const headerStart = offsets[location.line - 1] + location.column - 1 + header.index;
  const separator = source.match(/\r\n|[\n\r\u2028\u2029]/u)?.[0] ?? "\n";
  const indent = lines[location.line - 1].match(/^\s*/u)?.[0] ?? "";
  const scopedHeader = target.modifiers
    ? `group with flags ${quoteText(target.modifiers)} `
    : "group ";
  // Native option groups are noncapturing; place the requested capture around the same scope.
  const text = definition.capturing
    ? `capture${definition.name === null ? "" : ` ${quoteText(definition.name)}`} ${target.modifiers ? `{${separator}${indent}${scopedHeader}` : ""}`
    : scopedHeader;
  const patches = [{ start: headerStart, end: headerStart + header[0].length, text }];
  if (target.modifiers && definition.capturing) {
    const close = offsets[target.endLocation.line - 1] + target.endLocation.column;
    patches.push({ start: close, end: close, text: `${separator}${indent}}` });
  }
  for (const reference of references) {
    const index = indices.get(reference.captureIndex);
    if (index === undefined) throw new Error("A retained reference is missing its capture.");
    const value =
      typeof reference.reference === "number"
        ? index
        : reference.captureIndex === target.captureIndex
          ? (definition.name ?? index)
          : reference.reference;
    if (value === reference.reference) continue;
    const offset = offsets[reference.referenceLocation.line - 1];
    patches.push({
      start: offset + reference.referenceLocation.column - 1,
      end: offset + lines[reference.referenceLocation.line - 1].trimEnd().length,
      text: typeof value === "number" ? String(value) : quoteText(value),
    });
  }
  let rules = source;
  for (const patch of patches.sort((a, b) => b.start - a.start))
    rules = rules.slice(0, patch.start) + patch.text + rules.slice(patch.end);
  compileAst(parse(rules), options);
  return rules;
}
