import type { InteractionType } from "../../shared/schemas";

/**
 * Renderer registry: the renderer process registers a component per interaction
 * type; the engine only needs to know whether a type is supported so lessons can
 * gate content and the UI can label unavailable interactions honestly.
 */
export interface InteractionDescriptor {
  type: InteractionType;
  /** Which RawResponse kind this interaction produces. */
  responseKind: "choice" | "numeric" | "ordering" | "matching" | "text" | "steps" | "point";
  /** True once a working renderer exists. */
  implemented: boolean;
}

const registry = new Map<InteractionType, InteractionDescriptor>();

export function registerInteraction(descriptor: InteractionDescriptor): void {
  registry.set(descriptor.type, descriptor);
}

export function getInteraction(type: InteractionType): InteractionDescriptor | undefined {
  return registry.get(type);
}

export function listInteractions(): InteractionDescriptor[] {
  return [...registry.values()];
}

/** Baseline descriptors for every planned interaction type. */
export function registerDefaultInteractions(): void {
  const rows: Array<[InteractionType, InteractionDescriptor["responseKind"], boolean]> = [
    ["multiple-choice", "choice", true],
    ["multiple-selection", "choice", true],
    ["numeric-input", "numeric", true],
    ["percentage-input", "numeric", true],
    ["fraction-input", "numeric", true],
    ["ordering", "ordering", true],
    ["matching", "matching", true],
    ["drag-and-drop", "ordering", false],
    ["graph-interpretation", "choice", true],
    ["point-placement", "point", true],
    ["formula-construction", "ordering", false],
    ["simulation-prediction", "numeric", false],
    ["error-identification", "choice", true],
    ["method-selection", "choice", true],
    ["step-by-step-calculation", "steps", true],
    ["short-explanation", "text", true],
    ["confidence-rating", "numeric", false]
  ];
  for (const [type, responseKind, implemented] of rows) {
    registerInteraction({ type, responseKind, implemented });
  }
}
