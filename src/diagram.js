import { compileAst } from "./compiler.js";
import { escapeControls } from "./display.js";
import { explainNode } from "./explain.js";
import { parse } from "./parser.js";

/** @typedef {import('./ast.js').RuleNode} RuleNode */
/** @typedef {{kind: string, width: number, height: number, entry: number, label: string, node: RuleNode|null, children: Box[], body?: Box, id?: string, start?: number, end?: number, flags?: string}} Box */
const GAP = 28;
const PAD = 20;

/** @param {string} value */
function visible(value) {
  return escapeControls(value).replace(
    /[\ud800-\udfff\ufffe\uffff]/gu,
    (unit) => `\\u${unit.charCodeAt(0).toString(16)}`,
  );
}

/** @param {string} value */
function xml(value) {
  return visible(value).replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

/** @param {string} value */
function caption(value) {
  const points = [...visible(value)];
  return points.length > 48 ? `${points.slice(0, 47).join("")}…` : points.join("");
}

/** @param {string} label */
function labelWidth(label) {
  return Math.max(
    100,
    [...label].reduce((sum, point) => sum + (point.charCodeAt(0) > 127 ? 16 : 8), 0) + 24,
  );
}

/** @param {Box[]} children @returns {Box} */
function sequence(children) {
  if (!children.length)
    return {
      kind: "sequence",
      width: 100,
      height: 40,
      entry: 20,
      label: "Empty sequence",
      node: null,
      children,
    };
  const entry = Math.max(...children.map((child) => child.entry));
  return {
    kind: "sequence",
    width: children.reduce((width, child) => width + child.width, 0) + GAP * (children.length - 1),
    height: entry + Math.max(...children.map((child) => child.height - child.entry)),
    entry,
    label: "",
    node: null,
    children,
  };
}

/** Render validated rules as a standalone, dependency-free structural SVG.
 * @param {string} source
 * @param {import('../index.d.ts').CompileOptions} [options]
 * @returns {string}
 */
export function toSVG(source, options = {}) {
  const parsed = parse(source);
  const compiled = compileAst(parsed, options);
  let nextId = 0;

  /** @param {RuleNode} node @returns {Box} */
  function layout(node) {
    const opening = compiled.segments.find(
      (segment) =>
        segment.kind === node.kind &&
        segment.line === node.location.line &&
        segment.column === node.location.column &&
        (!("edge" in segment) || segment.edge === "start" || segment.kind === "anchor"),
    );
    if (!opening) throw new Error("A diagram rule is missing its compiler segment.");
    const closing =
      node.kind === "group" || node.kind === "assertion" || node.kind === "alternation"
        ? compiled.segments.find(
            (segment) =>
              segment.kind === node.kind &&
              "edge" in segment &&
              segment.edge === "end" &&
              segment.line === node.endLocation.line &&
              segment.column === node.endLocation.column,
          )
        : opening;
    if (!closing) throw new Error("A diagram block is missing its closing compiler segment.");
    const unit = node.kind === "anchor" ? node : { ...node, repetition: null };
    const label = caption(explainNode(unit, opening.flags ?? compiled.flags));
    /** @type {Box} */
    let box = {
      kind: node.kind,
      width: labelWidth(label),
      height: 48,
      entry: 24,
      label,
      node,
      flags: opening.flags ?? compiled.flags,
      children: [],
      id: `rule-${nextId++}`,
      start: opening.sourceStart,
      end: closing.sourceEnd,
    };
    if (node.kind === "group" || node.kind === "assertion") {
      const child = sequence(node.nodes.map(layout));
      box.children = [child];
      box.width = Math.max(box.width, child.width + PAD * 2);
      box.height = child.height + (node.kind === "assertion" ? 86 : 54);
      box.entry = node.kind === "assertion" ? 24 : child.entry + 40;
    } else if (node.kind === "alternation") {
      box.children = node.branches.map((branch) => sequence(branch.map(layout)));
      box.width = Math.max(
        box.width,
        Math.max(...box.children.map((child) => child.width)) + PAD * 4,
      );
      box.height = box.children.reduce((height, child) => height + child.height + 20, 40);
      box.entry = box.children[0].entry + 40;
    }
    if (node.kind !== "anchor" && node.repetition) {
      box = {
        ...box,
        kind: "repeat",
        body: box,
        children: [],
        width: Math.max(box.width + PAD * 2, 280),
        height: box.height + 58,
        entry: box.entry + 28,
      };
    }
    return box;
  }

  const root = sequence(parsed.nodes.map(layout));
  const width = root.width + 112;
  const height = root.height + 88;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Regex structure" data-flags="${compiled.flags}" font-family="IBM Plex Mono, monospace" font-size="13" fill="#172c29">`,
    "<title>Regex structure</title>",
    `<desc>Structural paths of the readable rules. Flags: ${compiled.flags}. Choices are ordered from top to bottom. Assertions check their subpattern without consuming input. Loops show repetition bounds, not runtime backtracking steps.</desc>`,
    `<rect width="${width}" height="${height}" fill="#fffdf5" rx="12"/>`,
    `<text x="20" y="24" class="hint" font-size="11" fill="#45645a">PATTERN STRUCTURE · ${compiled.flags}</text>`,
  ];

  /** @param {number} x @param {number} y @param {string} value @param {string} [className] */
  function text(x, y, value, className = "") {
    const fill =
      className === "hint" ? "#45645a" : className === "branch-number" ? "#785d18" : "#172c29";
    const size = className === "hint" ? 11 : className === "branch-number" ? 10 : 13;
    parts.push(
      `<text x="${x}" y="${y}" class="${className}" font-size="${size}" fill="${fill}" direction="ltr" unicode-bidi="plaintext">${xml(value)}</text>`,
    );
  }

  /** @param {string} path @param {boolean} [dashed] */
  function rail(path, dashed = false) {
    parts.push(
      `<path class="rail" fill="none" stroke="#50776b" stroke-width="2" d="${path}"${dashed ? ' stroke-dasharray="4 4"' : ""}/>`,
    );
  }

  /** @param {number} x @param {number} y @param {number} direction */
  function arrow(x, y, direction) {
    parts.push(
      `<path class="arrow" fill="#50776b" d="M ${x - direction * 5} ${y - 4} L ${x} ${y} L ${x - direction * 5} ${y + 4} Z"/>`,
    );
  }

  /** @param {Box} box */
  function attributes(box) {
    if (!box.node) return "";
    const location = box.node.location;
    return `data-diagram-key="${box.id}" data-line="${location.line}" data-column="${location.column}" data-source-start="${box.start}" data-source-end="${box.end}" data-kind="${box.node.kind}"`;
  }

  /** @param {Box} box @param {number} x @param {number} y @param {number} [direction] */
  function draw(box, x, y, direction = 1) {
    const level = y + box.entry;
    if (box.kind === "sequence") {
      if (!box.children.length) {
        rail(`M ${x} ${level} H ${x + box.width}`);
        text(x + 8, level - 7, "Empty sequence", "hint");
        return;
      }
      let cursor = x;
      for (const [index, child] of box.children.entries()) {
        draw(child, cursor, level - child.entry, direction);
        cursor += child.width;
        if (index < box.children.length - 1) {
          rail(`M ${cursor} ${level} H ${cursor + GAP}`);
          arrow(cursor + (direction === 1 ? GAP - 6 : 6), level, direction);
          cursor += GAP;
        }
      }
      return;
    }
    if (box.kind === "repeat") {
      if (!box.body || !box.node || box.node.kind === "anchor" || !box.node.repetition)
        throw new Error("A repeated diagram rule is missing its body.");
      const repetition = box.node.repetition;
      const min =
        repetition.kind === "zeroOrMore" ? 0 : repetition.kind === "oneOrMore" ? 1 : repetition.min;
      const max =
        repetition.kind === "exact"
          ? repetition.min
          : repetition.kind === "range"
            ? repetition.max
            : Infinity;
      const bounds = min === max ? `${min} times` : `${min}–${max === Infinity ? "∞" : max} times`;
      text(
        x + PAD,
        y + 15,
        bounds + (min === max ? "" : repetition.lazy ? " · lazy" : " · greedy"),
        "hint",
      );
      parts.push(max === 0 ? '<g class="never" opacity=".45">' : "<g>");
      const left = x + (box.width - box.body.width) / 2;
      draw(box.body, left, y + 28, direction);
      rail(
        `M ${x} ${level} H ${left} M ${left + box.body.width} ${level} H ${x + box.width}`,
        max === 0,
      );
      parts.push("</g>");
      const bottom = y + box.height - 12;
      if (min === 0) {
        rail(`M ${x} ${level} V ${bottom} H ${x + box.width} V ${level}`);
        arrow(x + box.width / 2 + direction * 4, bottom, direction);
      }
      if (max > 1) {
        const loop = bottom - (min === 0 ? 14 : 0);
        const from = direction === 1 ? x + box.width - PAD / 2 : x + PAD / 2;
        const to = direction === 1 ? x + PAD / 2 : x + box.width - PAD / 2;
        rail(`M ${from} ${level} V ${loop} H ${to} V ${level}`);
        arrow(x + box.width / 2 - direction * 4, loop, -direction);
      }
      return;
    }
    if (!box.node) throw new Error("A diagram node is missing its rule.");
    const explanation = explainNode(box.node, box.flags ?? compiled.flags);
    if (box.kind === "group" || box.kind === "alternation" || box.kind === "assertion") {
      const style =
        box.kind === "assertion"
          ? "scope probe"
          : box.kind === "alternation"
            ? "scope choice"
            : "scope";
      const fill =
        box.kind === "assertion" ? "#eff5fa" : box.kind === "alternation" ? "#fff9e0" : "#ffffff";
      const stroke =
        box.kind === "assertion" ? "#517992" : box.kind === "alternation" ? "#b89a46" : "#90aaa1";
      parts.push(
        `<rect class="${style}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" rx="10"${box.kind === "assertion" ? ' stroke-dasharray="5 4"' : ""} x="${x}" y="${y}" width="${box.width}" height="${box.height}" ${attributes(box)}/>`,
      );
      parts.push(`<g class="diagram-rule" ${attributes(box)}><title>${xml(explanation)}</title>`);
      text(x + 12, y + 19, box.label);
      parts.push("</g>");
      if (box.kind === "group") {
        const child = box.children[0];
        const left = x + (box.width - child.width) / 2;
        rail(`M ${x} ${level} H ${left} M ${left + child.width} ${level} H ${x + box.width}`);
        draw(child, left, y + 40, direction);
      } else if (box.kind === "assertion") {
        rail(`M ${x} ${level} H ${x + box.width}`);
        const child = box.children[0];
        const left = x + (box.width - child.width) / 2;
        const childY = y + 62;
        const behind = box.node.kind === "assertion" && box.node.direction === "behind";
        const childDirection = behind ? -1 : 1;
        text(
          x + 12,
          y + 46,
          behind ? "Check ends here · backwards · zero width" : "Check starts here · zero width",
          "hint",
        );
        rail(`M ${x + box.width / 2} ${level} V ${y + 51}`, true);
        draw(child, left, childY, childDirection);
        arrow(left + (behind ? 6 : child.width - 6), childY + child.entry, childDirection);
      } else {
        let top = y + 40;
        for (const [index, child] of box.children.entries()) {
          const branchLevel = top + child.entry;
          const left = x + PAD * 2;
          rail(`M ${x} ${level} H ${x + PAD} V ${branchLevel} H ${left}`);
          rail(
            `M ${left + child.width} ${branchLevel} H ${x + box.width - PAD} V ${level} H ${x + box.width}`,
          );
          text(x + PAD + 3, branchLevel - 6, String(index + 1), "branch-number");
          arrow(direction === 1 ? left - 5 : x + box.width - PAD + 5, branchLevel, direction);
          draw(child, left, top, direction);
          top += child.height + 20;
        }
      }
      return;
    }
    const zero = box.node.kind === "anchor" || box.node.kind === "boundary";
    const style = zero
      ? "tile zero-width"
      : box.node.kind === "backreference"
        ? "tile reference"
        : "tile";
    const fill = zero ? "#fff1bb" : box.node.kind === "backreference" ? "#e8f3ec" : "#ffffff";
    parts.push(
      `<g class="diagram-rule" ${attributes(box)}><title>${xml(explanation)}</title><rect class="${style}" fill="${fill}" stroke="#50776b" stroke-width="1.5" rx="7"${zero ? ' stroke-dasharray="4 3"' : ""} x="${x}" y="${y}" width="${box.width}" height="${box.height}"/>`,
    );
    text(x + 12, y + 29, box.label);
    parts.push("</g>");
  }

  const entry = 44 + root.entry;
  rail(`M 20 ${entry} H 56 M ${56 + root.width} ${entry} H ${width - 20}`);
  parts.push(
    `<circle cx="20" cy="${entry}" r="5" fill="#172c29"/><circle cx="${width - 20}" cy="${entry}" r="5" fill="#172c29"/>`,
  );
  draw(root, 56, 44);
  parts.push("</svg>");
  return parts.join("");
}
