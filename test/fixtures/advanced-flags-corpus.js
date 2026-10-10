export const patterns = [
  "(?<value>a|ab)",
  "(?<word>\\p{L}+)\\s+\\k<word>",
  "(?<empty>)(?<optional>a)?",
  "(?=(?<ahead>a))a",
  "(?<=(?<behind>a))b",
  "^(?<part>.*)$",
  "(?<part>[\\p{L}\\p{M}_0-9]+)",
  "(?:a(?<last>b)?)+",
  "[^\\p{Lowercase_Letter}]",
  "[\\P{Lowercase_Letter}]",
];

export const inputs = [
  "",
  "a",
  "ab",
  "abab",
  "aa",
  "ba",
  "a a",
  "A A",
  "a\nb",
  "A\n",
  "😀a",
  "😀ab",
  "αα",
  "e\u0301",
  " اردو",
  "K ſ",
];

export const flagSets = ["u", "v"].flatMap((unicode) =>
  Array.from({ length: 64 }, (_, bits) =>
    [..."dgimsy"]
      .filter((_, index) => bits & (1 << index))
      .concat(unicode)
      .sort()
      .join(""),
  ),
);
