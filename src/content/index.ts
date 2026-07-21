/** Assembles and validates the shipped content bundle. Throws at startup on invalid content. */
import curriculum from "./worlds/curriculum.json";
import questions from "./questions/questions.json";
import misconceptions from "./questions/misconceptions.json";
import remediations from "./questions/remediations.json";
import datasets from "./datasets/datasets.json";
import achievements from "./questions/achievements.json";
import { loadContentBundle, type ContentBundle } from "../core/curriculum/loader";

export function loadShippedContent(): ContentBundle {
  const result = loadContentBundle({ curriculum, questions, misconceptions, remediations, datasets, achievements });
  if (!result.ok) {
    throw new Error(`Shipped content failed validation: ${result.error}`);
  }
  return result.value;
}

export const rawContent = { curriculum, questions, misconceptions, remediations, datasets, achievements };
