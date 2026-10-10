const MAX_SOURCE_LENGTH = 16_384;
export const LIMITS = Object.freeze({
  sourceLength: MAX_SOURCE_LENGTH,
  regexSourceLength: MAX_SOURCE_LENGTH * 8, // U+2028 and U+2029 each escape to eight code units.
  lines: 200,
  repetition: 1_000,
  groupDepth: 64,
});
