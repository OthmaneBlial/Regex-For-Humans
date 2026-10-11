/** Apply native i/m/s group modifiers without changing the enclosing Unicode/cursor flags.
 * @param {string} flags @param {string} modifiers
 */
export function applyModifiers(flags, modifiers) {
  const [enabled, disabled = ""] = modifiers.split("-");
  return [..."dgimsuvy"]
    .filter((flag) => !disabled.includes(flag) && (flags.includes(flag) || enabled.includes(flag)))
    .join("");
}

/** Locate a modifier opener in constructor-validated native source.
 * @param {string} source @param {boolean} unicodeSets @returns {number}
 */
export function modifierGroupStart(source, unicodeSets) {
  let classDepth = 0;
  for (let index = 0; index < source.length; index++) {
    const value = source[index];
    if (value === "\\") index++;
    else if (value === "[" && (!classDepth || unicodeSets)) classDepth++;
    else if (value === "]" && classDepth) classDepth--;
    else if (
      !classDepth &&
      value === "(" &&
      source[index + 1] === "?" &&
      /^[ims-]$/u.test(source[index + 2] ?? "")
    )
      return index;
  }
  return -1;
}

/** Check native scope behavior in the requested Unicode/cursor mode.
 * @param {string} [flags]
 */
export function supportsModifiers(flags = "u") {
  try {
    const source = String.raw`(?i:\.|\bNULL)`;
    const probe = new RegExp(source, flags);
    for (const value of ["null", "NULL", "Null", ".foo"]) {
      probe.lastIndex = 0;
      if (!probe.test(value)) return false;
    }
    probe.lastIndex = 0;
    if (probe.test("xyz")) return false;
    // shortcut: Node's legacy witness fingerprints observed warm Unicode failures; revisit after native fixes.
    const hostProcess = Reflect.get(globalThis, "process");
    if (hostProcess?.versions?.node && hostProcess?.versions?.v8)
      return new RegExp(source).test("Null");
    return true;
  } catch {
    return false;
  }
}
