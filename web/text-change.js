import { escapeControls } from "../src/display.js";
import { LIMITS } from "../src/limits.js";

/** One first-to-last changed region; retain line breaks and expose other controls.
 * @param {string} before
 * @param {string} after
 */
export function textChange(before, after) {
  // shortcut: one region can include unchanged text; use finer diffing when reviews need separate edits.
  const visible = (/** @type {string} */ text) => text.split("\n").map(escapeControls).join("\n");
  const previous = [...visible(before)];
  const next = [...visible(after)];
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start])
    start += 1;
  let end = 0;
  while (
    end < previous.length - start &&
    end < next.length - start &&
    previous[previous.length - end - 1] === next[next.length - end - 1]
  )
    end += 1;
  return {
    prefix: previous.slice(0, start).join(""),
    before: previous.slice(start, previous.length - end).join(""),
    after: next.slice(start, next.length - end).join(""),
    suffix: previous.slice(previous.length - end).join(""),
  };
}

/** Align complete lines before comparing changed runs; inputs come from validated workshop rules.
 * @param {string} before
 * @param {string} after
 */
export function textChanges(before, after) {
  const previous = before.match(/[^\n]*\n|[^\n]+$/gu) ?? [];
  const next = after.match(/[^\n]*\n|[^\n]+$/gu) ?? [];
  // shortcut: oversized direct calls use one region; raise the bound only with a new editor budget.
  if (previous.length > LIMITS.lines || next.length > LIMITS.lines)
    return [textChange(before, after)];
  const lengths = Array.from(
    { length: previous.length + 1 },
    () => new Uint16Array(next.length + 1),
  );
  for (let old = previous.length - 1; old >= 0; old -= 1)
    for (let added = next.length - 1; added >= 0; added -= 1)
      lengths[old][added] =
        previous[old] === next[added]
          ? lengths[old + 1][added + 1] + 1
          : Math.max(lengths[old + 1][added], lengths[old][added + 1]);
  const changes = [];
  let old = 0;
  let added = 0;
  let removedText = "";
  let addedText = "";
  const flush = () => {
    if (removedText || addedText) changes.push(textChange(removedText, addedText));
    removedText = "";
    addedText = "";
  };
  while (old < previous.length || added < next.length) {
    if (old < previous.length && added < next.length && previous[old] === next[added]) {
      flush();
      changes.push(textChange(previous[old], next[added]));
      old += 1;
      added += 1;
    } else if (
      old < previous.length &&
      (added === next.length || lengths[old + 1][added] >= lengths[old][added + 1])
    ) {
      removedText += previous[old++];
    } else {
      addedText += next[added++];
    }
  }
  flush();
  return changes;
}
