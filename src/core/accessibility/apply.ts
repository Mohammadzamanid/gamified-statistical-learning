/**
 * Accessibility application layer: translates Settings into DOM data attributes
 * the design system's CSS keys off of. Kept in core so it is testable.
 */
import type { Settings } from "../../shared/schemas";

export interface AccessibilityAttributes {
  "data-theme": string;
  "data-text-scale": string;
  "data-reduced-motion": "true" | "false";
  "data-colorblind-safe": "true" | "false";
}

export function settingsToAttributes(settings: Settings): AccessibilityAttributes {
  return {
    "data-theme": settings.theme,
    "data-text-scale": settings.textScale,
    "data-reduced-motion": settings.reducedMotion ? "true" : "false",
    "data-colorblind-safe": settings.colorBlindSafe ? "true" : "false"
  };
}

export function applyToRoot(settings: Settings, root: HTMLElement): void {
  const attrs = settingsToAttributes(settings);
  for (const [key, value] of Object.entries(attrs)) {
    root.setAttribute(key, value);
  }
}
