/**
 * Setup for the accessibility harness.
 *
 * Two jobs, both about making jsdom honest rather than convenient:
 *
 *  - the app's stylesheet is loaded into the document, so a check about a
 *    *visible* focus ring or a colour-independent cue reads the real CSS rather
 *    than a value the test invented;
 *  - `matchMedia` is stubbed, because jsdom has none and the reduced-motion path
 *    asks for it. The stub reports "no preference" so a component that consults
 *    it takes the ordinary branch unless a test says otherwise.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

beforeAll(() => {
  // Both files, with the `@import` line dropped: jsdom does not resolve imports
  // inside an inline <style>, so concatenating is what actually loads the tokens
  // the rules below reference.
  const tokens = readFileSync(resolve(__dirname, "../../src/renderer/styles/tokens.css"), "utf8");
  const base = readFileSync(resolve(__dirname, "../../src/renderer/styles/base.css"), "utf8")
    .replace(/@import[^;]+;/g, "");
  const style = document.createElement("style");
  style.id = "statlas-app-css";
  style.textContent = `${tokens}\n${base}`;
  document.head.appendChild(style);

  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })) as unknown as typeof window.matchMedia;
  }
});

afterEach(() => {
  cleanup();
  // Attributes are set on <html> by `applyToRoot`; a test that changed the
  // theme must not decide the next test's theme.
  for (const name of [...document.documentElement.getAttributeNames()]) {
    if (name.startsWith("data-")) document.documentElement.removeAttribute(name);
  }
});
