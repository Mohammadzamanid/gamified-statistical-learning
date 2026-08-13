/**
 * S2-20: the presentation half of scope §6 — themes, text size, motion, colour
 * independence, and the charts' text equivalents.
 *
 * These are the settings the app already had; what was missing was any check
 * that the stylesheet actually answers them. `tests/unit/accessibility.test.ts`
 * proves the settings map to root attributes, which is one end of the wire.
 * This is the other: with the attribute set, the CSS shipped alongside it
 * defines the tokens it promises.
 *
 * The limit, stated rather than left to be discovered: jsdom parses CSS but
 * computes no layout and resolves no custom properties, so "readable at this
 * contrast" and "the focus ring is visible" cannot be measured here. Those stay
 * GUI review, recorded as such (scope §6, last paragraph).
 */
import { describe, expect, it, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { computeAccessibleName } from "dom-accessibility-api";
import { loadShippedContent } from "../../src/content";
import { applyToRoot, settingsToAttributes } from "../../src/core/accessibility/apply";
import { SettingsSchema } from "../../src/shared/schemas";
import { BarChart } from "../../src/renderer/components/BarChart";
import { Histogram } from "../../src/renderer/components/Histogram";
import { DotPlot } from "../../src/renderer/components/DotPlot";
import { BoxPlot } from "../../src/renderer/components/BoxPlot";
import { ScatterPlot } from "../../src/renderer/components/ScatterPlot";

const content = loadShippedContent();

/** Every rule text in the shipped stylesheet, as loaded into this document. */
let cssText = "";

beforeAll(() => {
  cssText = document.getElementById("statlas-app-css")!.textContent ?? "";
  expect(cssText.length, "the stylesheet did not load into the test document").toBeGreaterThan(1000);
});

describe("the settings a learner can change are answered by the stylesheet", () => {
  it.each([
    ["dark", "data-theme"],
    ["light", "data-theme"],
    ["high-contrast", "data-theme"]
  ] as const)("defines the %s theme the setting selects", (theme, attribute) => {
    applyToRoot(SettingsSchema.parse({ theme }), document.documentElement);
    expect(document.documentElement.getAttribute(attribute)).toBe(theme);

    // The attribute is only a promise; the stylesheet has to keep it. A theme
    // the app can select and the CSS never mentions renders as the default and
    // says nothing about having failed.
    expect(
      cssText.includes(`[data-theme="${theme}"]`),
      `the stylesheet never mentions [data-theme="${theme}"], so selecting it changes nothing`
    ).toBe(true);
  });

  it.each(["s", "m", "l", "xl"] as const)("defines the %s text scale", (scale) => {
    applyToRoot(SettingsSchema.parse({ textScale: scale }), document.documentElement);
    expect(document.documentElement.getAttribute("data-text-scale")).toBe(scale);
    expect(
      cssText.includes(`[data-text-scale="${scale}"]`),
      `text scale ${scale} can be chosen and is not defined`
    ).toBe(true);
  });

  it("answers reduced motion in the stylesheet rather than only in a setting", () => {
    applyToRoot(SettingsSchema.parse({ reducedMotion: true }), document.documentElement);
    expect(document.documentElement.getAttribute("data-reduced-motion")).toBe("true");
    expect(
      cssText.includes('[data-reduced-motion="true"]'),
      "reduced motion is a setting the stylesheet does not act on"
    ).toBe(true);
  });

  it("answers the colour-blind-safe setting in the stylesheet", () => {
    applyToRoot(SettingsSchema.parse({ colorBlindSafe: true }), document.documentElement);
    expect(document.documentElement.getAttribute("data-colorblind-safe")).toBe("true");
    expect(
      cssText.includes('[data-colorblind-safe="true"]'),
      "the colour-blind-safe setting changes no rule"
    ).toBe(true);
  });

  it("keeps a visible focus style rather than removing the outline and stopping there", () => {
    // `outline: none` with nothing in its place is the classic way a keyboard
    // user loses the cursor. A rule may replace it — the app's global rule uses
    // a box shadow, and the map's node paints a ring on a *child* element —
    // but it may not simply delete it.
    //
    // The child case is why this is not a per-rule regex. The first draft was,
    // and it flagged `.region-node:focus-visible { outline: none }` as a defect
    // while the very next line drew the ring. A check that fails on correct
    // markup is the pattern being too eager, not the markup being wrong (D-047).
    const rules = cssText
      .split("}")
      .map((rule) => rule.trim())
      .filter((rule) => rule.includes(":focus-visible"));
    expect(rules.length, "nothing in the stylesheet styles :focus-visible").toBeGreaterThan(0);

    // Declarations are parsed rather than pattern-matched, because the first
    // attempt at a regex here matched the very thing it was written to reject:
    // `/outline\s*:\s*(?!none)/` backtracks over the `\s*`, evaluates the
    // lookahead against " none" instead of "none", and reports an indicator on
    // `outline: none`. A probe removing the focus ring then failed nothing.
    const declarations = (rule: string) =>
      (rule.split("{")[1] ?? "")
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const at = d.indexOf(":");
          return { property: d.slice(0, at).trim(), value: d.slice(at + 1).trim() };
        });

    const PAINTS_FOCUS = new Set([
      "box-shadow", "outline-offset", "border", "border-color", "border-width",
      "background", "background-color", "stroke", "stroke-width", "fill",
      "text-decoration", "text-decoration-line"
    ]);
    const suppliesIndicator = (rule: string) =>
      declarations(rule).some(({ property, value }) =>
        property === "outline" ? value !== "none" && value !== "0" : PAINTS_FOCUS.has(property)
      );
    const removesOutline = (rule: string) =>
      declarations(rule).some(({ property, value }) => property === "outline" && (value === "none" || value === "0"));

    for (const rule of rules) {
      if (!removesOutline(rule)) continue;
      if (suppliesIndicator(rule)) continue; // replaced in place

      // Otherwise something else must paint focus for the same subject.
      const selector = rule.split("{")[0]!.trim();
      const supplied = rules.some(
        (other) => other !== rule && other.startsWith(selector) && suppliesIndicator(other)
      );
      expect(
        supplied,
        `${selector} removes the focus outline and nothing puts an indicator back`
      ).toBe(true);
    }
  });

  it("maps every setting the schema allows, so none is silently ignored", () => {
    // The reverse direction: a setting that exists in the schema and produces no
    // attribute is a control that does nothing, which is worse than absent.
    const attrs = settingsToAttributes(
      SettingsSchema.parse({ theme: "light", textScale: "s", reducedMotion: true, colorBlindSafe: true })
    );
    expect(Object.keys(attrs).sort()).toEqual([
      "data-colorblind-safe",
      "data-reduced-motion",
      "data-text-scale",
      "data-theme"
    ]);
  });
});

describe("every chart the app draws carries its text equivalent into the DOM", () => {
  /** One shipped question per chart kind, so the props are the real ones. */
  const byKind = new Map<string, { datasetId: string; description: string; caption?: string; binWidth?: number; axisMin?: number }>();
  for (const question of content.questions.values()) {
    const visual = question.visual;
    if (visual.kind === "none" || byKind.has(visual.kind) || !visual.datasetId) continue;
    byKind.set(visual.kind, {
      datasetId: visual.datasetId,
      description: visual.accessibleDescription ?? "",
      caption: visual.caption,
      binWidth: visual.binWidth,
      axisMin: visual.axisMin
    });
  }

  it("has a shipped example of every kind it can draw", () => {
    expect([...byKind.keys()].sort()).toEqual(["bar-chart", "box-plot", "dot-plot", "histogram", "scatter"]);
  });

  it.each(["bar-chart", "histogram", "dot-plot", "box-plot", "scatter"])(
    "gives the %s an accessible name a reader can hear",
    (kind) => {
      const spec = byKind.get(kind)!;
      const dataset = content.datasets.get(spec.datasetId)!;
      const props = { dataset, caption: spec.caption, accessibleDescription: spec.description };

      if (kind === "bar-chart") render(<BarChart {...props} axisMin={spec.axisMin} />);
      else if (kind === "histogram") render(<Histogram {...props} binWidth={spec.binWidth} />);
      else if (kind === "dot-plot") render(<DotPlot {...props} />);
      else if (kind === "box-plot") render(<BoxPlot {...props} />);
      else render(<ScatterPlot {...props} />);

      const chart = screen.getByRole("img");
      const name = computeAccessibleName(chart).trim();
      expect(name.length, `the ${kind} renders as an unlabelled image`).toBeGreaterThan(20);
      // The picture is the data; the name has to be the description the content
      // wrote for it, not the dataset's title standing in for one.
      expect(name).toBe(spec.description.trim());
    }
  );

  it("never draws a chart as a bare graphic with no role at all", () => {
    const spec = byKind.get("histogram")!;
    const { container } = render(
      <Histogram
        dataset={content.datasets.get(spec.datasetId)!}
        caption={spec.caption}
        accessibleDescription={spec.description}
        binWidth={spec.binWidth}
      />
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role"), "an svg with no role is a picture a reader is not told about").toBe("img");
  });
});
