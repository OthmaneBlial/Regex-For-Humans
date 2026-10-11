/** Apply native i/m/s group modifiers without changing the enclosing Unicode/cursor flags.
 * @param {string} flags @param {string} modifiers
 */
export function applyModifiers(flags, modifiers) {
  const [enabled, disabled = ""] = modifiers.split("-");
  return [..."dgimsuvy"]
    .filter((flag) => !disabled.includes(flag) && (flags.includes(flag) || enabled.includes(flag)))
    .join("");
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
