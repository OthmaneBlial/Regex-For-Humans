const MAX_MATCHES = 100;
const MAX_OUTPUT = 65536;
const MAX_TEMPLATE = 128;

/** @param {string} input @param {RegExpExecArray} match @param {string} template @param {number} budget */
function substitution(input, match, template, budget) {
  /** @type {string[]} */
  const parts = [];
  let length = 0;
  /** @param {string} value */
  const append = (value) => {
    length += value.length;
    if (length > budget)
      throw new RangeError("Replacement output exceeds 65,536 UTF-16 code units.");
    parts.push(value);
  };
  for (let index = 0; index < template.length; ) {
    if (template[index] !== "$") {
      append(template[index++]);
      continue;
    }
    const next = template[index + 1];
    if (next === "$" || next === "&" || next === "`" || next === "'") {
      append(
        next === "$"
          ? "$"
          : next === "&"
            ? match[0]
            : next === "`"
              ? input.slice(0, match.index)
              : input.slice(match.index + match[0].length),
      );
      index += 2;
      continue;
    }
    if (next !== undefined && /[0-9]/u.test(next)) {
      let count = 1;
      let capture = Number(next);
      const second = template[index + 2];
      if (second !== undefined && /[0-9]/u.test(second)) {
        const pair = Number(next + second);
        if (pair > 0 && pair < match.length) {
          count = 2;
          capture = pair;
        }
      }
      if (capture > 0 && capture < match.length) {
        append(match[capture] ?? "");
        index += count + 1;
        continue;
      }
    }
    if (next === "<" && match.groups !== undefined) {
      const end = template.indexOf(">", index + 2);
      if (end >= 0) {
        append(match.groups[template.slice(index + 2, end)] ?? "");
        index = end + 1;
        continue;
      }
    }
    append("$");
    index += 1;
  }
  return parts.join("");
}

/** Apply ECMAScript string replacement with bounded native matching and allocation.
 * @param {string} source @param {string} flags @param {string} input @param {string} template
 * @returns {string}
 */
export function replaceBounded(source, flags, input, template) {
  if (typeof input !== "string" || input.length > 2048)
    throw new TypeError("Replacement input must be a string of at most 2,048 UTF-16 code units.");
  if (typeof template !== "string" || template.length > MAX_TEMPLATE)
    throw new TypeError("Replacement template must be a string of at most 128 UTF-16 code units.");
  const expression = new RegExp(source, flags);
  /** @type {string[]} */
  const parts = [];
  let length = 0;
  let previousEnd = 0;
  let count = 0;
  /** @param {string} value */
  const append = (value) => {
    length += value.length;
    if (length > MAX_OUTPUT)
      throw new RangeError("Replacement output exceeds 65,536 UTF-16 code units.");
    parts.push(value);
  };
  // Native String.replace gathers every global match before substitution; stream native exec instead.
  for (let match = expression.exec(input); match; match = expression.exec(input)) {
    if (++count > MAX_MATCHES) throw new RangeError("Replacement stopped after 100 matches.");
    append(input.slice(previousEnd, match.index));
    append(substitution(input, match, template, MAX_OUTPUT - length));
    previousEnd = match.index + match[0].length;
    if (!expression.global) break;
    if (match[0].length === 0)
      expression.lastIndex +=
        (input.codePointAt(expression.lastIndex) ?? 0) > 0xffff &&
        (expression.unicode || expression.unicodeSets)
          ? 2
          : 1;
  }
  append(input.slice(previousEnd));
  return parts.join("");
}
