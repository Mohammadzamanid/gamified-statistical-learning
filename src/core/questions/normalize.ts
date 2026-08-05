import { parseUserNumber } from "../../shared/utilities/numeric";
import type { NormalizedResponse, RawResponse } from "./types";

/** Deterministic normalization: trims, canonicalizes numbers, lowercases free text. */
export function normalizeResponse(raw: RawResponse): NormalizedResponse {
  switch (raw.kind) {
    case "choice":
      return { kind: "choice", choiceIds: [...raw.choiceIds].sort() };
    case "numeric":
      return { kind: "numeric", value: parseUserNumber(raw.text), rawText: raw.text.trim() };
    case "ordering":
      return { kind: "ordering", order: [...raw.order] };
    case "matching":
      return {
        kind: "matching",
        pairs: [...raw.pairs].sort((a, b) => a.left.localeCompare(b.left))
      };
    case "text":
      return { kind: "text", text: raw.text.trim().toLowerCase().replace(/\s+/g, " ") };
    case "steps":
      // Step order carries meaning, so it is preserved rather than sorted.
      return {
        kind: "steps",
        steps: raw.steps.map((s) => ({
          stepId: s.stepId,
          value: parseUserNumber(s.text),
          rawText: s.text.trim()
        }))
      };
  }
}
