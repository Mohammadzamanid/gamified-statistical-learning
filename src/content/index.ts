/** Assembles and validates the shipped content bundle. Throws at startup on invalid content. */
import curriculum from "./worlds/curriculum.json";
import questions from "./questions/questions.json";
import misconceptions from "./questions/misconceptions.json";
import remediations from "./questions/remediations.json";
import datasets from "./datasets/datasets.json";
import achievements from "./questions/achievements.json";
import { loadContentBundle, type ContentBundle } from "../core/curriculum/loader";
import { generatedRun } from "./generated";
import type { Question } from "../shared/schemas";

/**
 * The authored bundle: exactly what the JSON files declare.
 *
 * Every audit that reasons about hand-written content — lesson structure,
 * reachability, the interaction audit — works from this, so adding generated
 * practice cannot quietly satisfy a check about authored content.
 */
export function loadShippedContent(): ContentBundle {
  const result = loadContentBundle({ curriculum, questions, misconceptions, remediations, datasets, achievements });
  if (!result.ok) {
    throw new Error(`Shipped content failed validation: ${result.error}`);
  }
  return result.value;
}

/**
 * The authored bundle plus the validated generated practice bank.
 *
 * This is what the running app loads, so a learner's spaced review can draw on
 * generated questions. Generated ids are prefixed `q.gen.` and never appear in a
 * lesson's `questionIds` — lessons stay hand-authored.
 */
export function loadPlayableContent(): ContentBundle {
  const bundle = loadShippedContent();
  const authored = [...bundle.questions.values()];
  const run = generatedRun(authored, bundle.misconceptions, bundle.remediations);

  const merged = new Map<string, Question>(bundle.questions);
  for (const q of run.accepted) {
    if (merged.has(q.id)) throw new Error(`generated question ${q.id} collides with an authored id`);
    merged.set(q.id, q);
  }
  return { ...bundle, questions: merged };
}

export const rawContent = { curriculum, questions, misconceptions, remediations, datasets, achievements };
