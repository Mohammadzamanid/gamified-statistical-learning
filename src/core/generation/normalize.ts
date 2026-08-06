/**
 * Three different ways two questions can be "the same", and why they are three.
 *
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §4 asks for two things that are easy to
 * conflate, and conflating them makes the whole coverage exercise meaningless:
 *
 *  - "Near-duplicate detection normalises numbers, names, whitespace,
 *    punctuation, and equivalent phrasing where practical."
 *  - "A topic with 100 numeric variants of one reasoning pattern is not
 *    Complete."
 *
 * The first is a *rejection* rule and the second is a *diversity* rule, and they
 * cannot be the same fingerprint. If a near-duplicate were "any two questions
 * with the same wording once the numbers are stripped", then every variant of a
 * calculation would collapse onto one and no topic could ever reach a hundred
 * of anything. So:
 *
 *  - `exactFingerprint` — the same question twice. A generator bug.
 *  - `nearDuplicateFingerprint` — the same numbers and the same task, dressed in
 *    different names or phrasing. This is the renaming trick the scope names,
 *    and it is rejected.
 *  - `reasoningShape` — the task with its particulars removed. Two questions
 *    sharing a shape are legitimate variants of each other, but a topic built
 *    mostly from one shape fails the diversity rule. Reported, not rejected.
 */
import type { Question } from "../../shared/schemas";

/** Names used across the harbour content, stripped so a renamed clone collapses. */
const NAMES = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "mira", "kirkwall", "stromness", "north", "south", "east", "west",
  "crate", "crates", "barrel", "barrels", "boat", "boats", "pallet", "pallets",
  "coin", "coins", "net", "nets", "hold", "holds", "measure", "measures",
  "deckhand", "deckhands", "crew", "crews", "jetty", "quay", "harbour", "harbourmaster",
  "cooper", "clerk", "shift", "ledger", "catch", "landing", "sheet", "store", "rope",
  "morning", "afternoon", "evening", "dawn", "noon", "day", "week"
];

/** Phrasings that mean the same thing, mapped to one form. */
const EQUIVALENT_PHRASES: ReadonlyArray<[RegExp, string]> = [
  [/\baltogether\b|\bin total\b|\bin all\b/g, "total"],
  [/\bhow many\b|\bwhat is the number of\b|\bhow much\b/g, "howmany"],
  [/\bwork out\b|\bcalculate\b|\bfind\b|\bwhat is\b/g, "compute"],
  [/\bare left\b|\bremain\b|\bare still\b/g, "remain"],
  [/\bshared equally between\b|\bsplit equally between\b|\bdivided between\b/g, "sharedbetween"],
  [/\bfor every\b|\bper\b|\beach\b/g, "perunit"],
  [/\bwhich is (larger|bigger|greater)\b/g, "whichlarger"],
  [/\bwhich is (smaller|less)\b/g, "whichsmaller"],
  // Verbs of recording. In this content "the quay holds 12" and "the ledger
  // recorded 12" are the same sentence wearing a different coat.
  [/\b(holds|held|has|had|was|were|is|are|recorded|records|logged|logs|shows|showed|carries|carried)\b/g, "hasv"]
];

/** Canonical form of a number, so 0.50 and 0.5 and 1/2 do not look different. */
function canonicalNumber(raw: string): string {
  if (raw.includes("/")) {
    const [top, bottom] = raw.split("/").map(Number);
    if (top !== undefined && bottom) return String(Number((top / bottom).toFixed(6)));
  }
  const value = Number(raw);
  return Number.isFinite(value) ? String(Number(value.toFixed(6))) : raw;
}

function normalizeWords(text: string): string {
  let out = text.toLowerCase();
  for (const [pattern, replacement] of EQUIVALENT_PHRASES) out = out.replace(pattern, replacement);
  for (const name of NAMES) out = out.replace(new RegExp(`\\b${name}\\b`, "g"), "@");
  out = out.replace(/@(\s*@)+/g, "@");
  return out;
}

/** Names, phrasing and punctuation normalised; the numbers kept and canonicalised. */
export function normalizeKeepingNumbers(text: string): string {
  const out = normalizeWords(text).replace(/-?\d+(?:[./]\d+)?/g, (n) => `#${canonicalNumber(n)}`);
  return out.replace(/[^a-z0-9#@. ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Everything particular removed: names, phrasing, punctuation **and** numbers. */
export function normalizeText(text: string): string {
  const out = normalizeWords(text).replace(/-?\d+(?:[./]\d+)?/g, "#");
  return out
    .replace(/#(\s*#)+/g, "#")
    .replace(/[^a-z0-9#@ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The same question twice — right down to its wording. A generator bug. */
export function exactFingerprint(question: Question): string {
  return [
    question.interaction,
    question.prompt.trim().replace(/\s+/g, " ").toLowerCase(),
    JSON.stringify(question.answer),
    (question.choices ?? []).map((c) => c.text.trim().toLowerCase()).sort().join("|")
  ].join("::");
}

/**
 * The same task on the same numbers, wearing different names or phrasing.
 *
 * This is the one that is rejected: it is precisely the "rename the objects and
 * call it a new question" move, and it inflates a count while teaching nothing
 * new. Two questions with different numbers are variants, not near duplicates.
 */
export function nearDuplicateFingerprint(question: Question): string {
  return [
    question.interaction,
    question.answer.kind,
    JSON.stringify(question.answer),
    normalizeKeepingNumbers(question.prompt),
    (question.choices ?? []).map((c) => normalizeKeepingNumbers(c.text)).sort().join("|"),
    (question.items ?? []).map((i) => normalizeKeepingNumbers(i.text)).sort().join("|")
  ].join("::");
}

/**
 * The shape of the thinking, with every particular stripped.
 *
 * Reported rather than rejected: variants of one shape are legitimate practice,
 * but a topic made almost entirely of one shape is the degenerate case §4 rules
 * out, and the coverage report fails a topic on it.
 */
export function reasoningShape(question: Question): string {
  return [
    question.interaction,
    question.answer.kind,
    normalizeText(question.prompt),
    (question.choices ?? []).map((c) => normalizeText(c.text)).sort().join("|"),
    (question.items ?? []).map((i) => normalizeText(i.text)).sort().join("|")
  ].join("::");
}
