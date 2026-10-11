import { translate } from "./i18n.js";

/** @typedef {{id: string, title: string, note: string, rules: string, source: string, flags: string, matchMode: "full" | "search", categories: string[], level: string, positive: string[], negative: string[], expectations?: import('./worker-protocol.d.ts').ExpectedDetails[]}} ProductScenario */

export const categories = [
  ["usernames", "Usernames"],
  ["identifiers", "IDs and identifiers"],
  ["slugs", "Slugs"],
  ["filenames", "Filenames"],
  ["file-extensions", "File extensions"],
  ["hex-colors", "Hexadecimal colors"],
  ["dates", "Dates"],
  ["times", "Times"],
  ["iso-8601", "ISO 8601-shaped strings"],
  ["urls", "URLs"],
  ["ipv4", "IPv4"],
  ["log-extraction", "Log extraction"],
  ["http-headers", "HTTP headers"],
  ["markdown", "Markdown fragments"],
  ["version-numbers", "Version numbers"],
  ["semantic-versions", "Semantic versions"],
  ["git-hashes", "Git commit hashes"],
  ["uuids", "UUIDs"],
  ["named-fields", "Named fields"],
  ["repeated-words", "Repeated words"],
  ["duplicate-detection", "Duplicate detection"],
  ["structured-extraction", "Structured text extraction"],
  ["unicode-text", "International Unicode text"],
  ["search-replacement", "Search and replacement"],
];

export const levels = [
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["expert", "Expert"],
];

/** @param {ProductScenario[]} recipes @param {string} query @param {string} category @param {string} level @param {string} locale */
export function filterRecipes(recipes, query, category, level, locale) {
  const terms = query.trim().toLocaleLowerCase(locale).split(/\s+/u).filter(Boolean);
  return recipes.filter((recipe) => {
    if (category && !recipe.categories.includes(category)) return false;
    if (level && recipe.level !== level) return false;
    const labels = [
      recipe.id,
      recipe.title,
      recipe.note,
      translate(locale, recipe.title),
      translate(locale, recipe.note),
      recipe.rules,
      ...categories
        .filter(([id]) => recipe.categories.includes(id))
        .flatMap(([, label]) => [label, translate(locale, label)]),
      ...levels
        .filter(([id]) => recipe.level === id)
        .flatMap(([, label]) => [label, translate(locale, label)]),
    ]
      .join("\n")
      .toLocaleLowerCase(locale);
    return terms.every((term) => labels.includes(term));
  });
}
