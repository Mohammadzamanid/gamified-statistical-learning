/**
 * S2-20: the interaction types scope §6 names by hand — point placement, drag
 * and drop, the step calculation — plus what happens to focus after an answer.
 *
 * These are the three that cannot be answered by "every button has a name".
 * Each was built with a keyboard route (S2-02 through S2-04) and none of those
 * routes had ever been exercised through a DOM: the integration tests submit
 * responses to the engine directly, which is the right way to test evaluation
 * and says nothing about whether a learner without a mouse can produce one.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { computeAccessibleName } from "dom-accessibility-api";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { registerDefaultInteractions } from "../../src/core/questions/registry";
import { QuestionInteraction } from "../../src/renderer/components/QuestionRenderers";
import type { RawResponse } from "../../src/core/questions/types";
import type { Question } from "../../src/shared/schemas";

const content = loadShippedContent();

/** The first shipped question of a given interaction, so the props are real. */
function firstOfKind(interaction: string): Question {
  const found = [...content.questions.values()].find((q) => q.interaction === interaction);
  expect(found, `no shipped question uses ${interaction}`).toBeDefined();
  return found!;
}

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
  registerDefaultInteractions();
});

describe("placing a point needs no pointer", () => {
  const question = () => firstOfKind("point-placement");

  it("offers a labelled control for every axis the field has", () => {
    render(<QuestionInteraction question={question()} disabled={false} onSubmit={() => {}} />);

    const sliders = screen.getAllByRole("slider");
    const field = question().pointField!;
    const expected = field.kind === "coordinate-plane" ? 2 : 1;
    expect(sliders, `a ${field.kind} needs ${expected} keyboard control(s)`).toHaveLength(expected);

    for (const slider of sliders) {
      expect(computeAccessibleName(slider).trim().length, "an unlabelled slider").toBeGreaterThan(0);
      // A native range announces its own value, so `aria-valuenow` is not
      // required — but a reader should hear *what* the number means, which is
      // what `aria-valuetext` carries. Asserting `aria-valuenow` on correct
      // native markup was the first draft's mistake.
      expect(slider.getAttribute("aria-valuetext"), "the slider announces a bare number").toBeTruthy();
      expect((slider as HTMLInputElement).value).not.toBe("");
    }
  });

  it("steps by the field's own granularity, so a key press lands on a meaningful value", () => {
    render(<QuestionInteraction question={question()} disabled={false} onSubmit={() => {}} />);
    const field = question().pointField!;
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];

    // The declared step is what a browser moves by on an arrow key. jsdom does
    // not implement that interaction — see the note in the case below — so what
    // is checked here is the declaration the browser would act on.
    expect(Number(sliders[0]!.step)).toBeCloseTo(field.xStep, 6);
    expect(Number(sliders[0]!.min)).toBeCloseTo(field.xMin, 6);
    expect(Number(sliders[0]!.max)).toBeCloseTo(field.xMax, 6);
    if (field.kind === "coordinate-plane") {
      expect(Number(sliders[1]!.step)).toBeCloseTo(field.yStep!, 6);
    }
  });

  it("moves the marker when the slider changes, and submits from the keyboard", async () => {
    // **A limit of the harness, stated rather than papered over.** jsdom does
    // not implement a range input's arrow-key behaviour: focusing one and
    // pressing ArrowRight changes nothing, in jsdom, whatever the app does. A
    // first draft asserted the movement and failed — on jsdom, not on the app.
    //
    // So the check is split. The declaration a browser acts on is asserted
    // above; here the component's own response to a value change is driven with
    // `fireEvent.change`, which is what the browser dispatches after the key. A
    // real arrow key on a real build stays GUI review (scope §6).
    const submitted: RawResponse[] = [];
    const user = userEvent.setup();
    render(<QuestionInteraction question={question()} disabled={false} onSubmit={(r) => submitted.push(r)} />);

    const slider = screen.getAllByRole("slider")[0]! as HTMLInputElement;
    const field = question().pointField!;
    const before = Number(slider.value);
    const moved = Math.min(field.xMax, before + field.xStep);

    fireEvent.change(slider, { target: { value: String(moved) } });
    expect(Number(slider.value), "the component ignored the slider's new value").toBeCloseTo(moved, 6);
    expect(slider.getAttribute("aria-valuetext"), "the spoken value did not follow the marker").toContain(String(moved));

    const submit = screen.getByRole("button", { name: /place|submit/i });
    submit.focus();
    await user.keyboard("{Enter}");
    expect(submitted, "the point could not be submitted from the keyboard").toHaveLength(1);
    expect(submitted[0]!.kind).toBe("point");
  });

  it("describes the marker's position in words, since the plot is a picture", () => {
    render(<QuestionInteraction question={question()} disabled={false} onSubmit={() => {}} />);
    const plot = screen.getByRole("img");
    const name = computeAccessibleName(plot);
    expect(name.length).toBeGreaterThan(20);
    expect(name, "the description never says where the marker is").toMatch(/marker at/i);
  });
});

describe("drag and drop has a route that never drags", () => {
  const question = () => firstOfKind("drag-and-drop");

  it("gives every item a select naming every zone it could go to", () => {
    render(<QuestionInteraction question={question()} disabled={false} onSubmit={() => {}} />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length, "no keyboard alternative to dragging").toBe(question().items!.length);

    const zoneLabels = question().dropZones!.map((z) => z.label);
    for (const select of selects) {
      expect(computeAccessibleName(select).trim().length, "an unlabelled item select").toBeGreaterThan(0);
      const options = [...select.querySelectorAll("option")].map((o) => o.textContent);
      for (const label of zoneLabels) {
        expect(options, `a zone is unreachable without dragging: ${label}`).toContain(label);
      }
    }
  });

  it("places an item and submits, using only the keyboard", async () => {
    const submitted: RawResponse[] = [];
    const user = userEvent.setup();
    render(<QuestionInteraction question={question()} disabled={false} onSubmit={(r) => submitted.push(r)} />);

    const selects = screen.getAllByRole("combobox");
    const zones = question().dropZones!;
    for (const select of selects) {
      select.focus();
      await user.selectOptions(select, zones[0]!.id);
    }

    const submit = screen.getByRole("button", { name: /submit|check|place/i });
    submit.focus();
    await user.keyboard("{Enter}");

    expect(submitted, "the placement could not be submitted from the keyboard").toHaveLength(1);
    expect(submitted[0]!.kind).toBe("placement");
  });
});

describe("a multi-step calculation announces each step", () => {
  const question = () => firstOfKind("step-by-step-calculation");

  it("keeps a live region tied to the field by aria-describedby", () => {
    const { container } = render(
      <QuestionInteraction question={question()} disabled={false} onSubmit={() => {}} />
    );

    const field = screen.getByRole("textbox");
    const describedBy = field.getAttribute("aria-describedby");
    expect(describedBy, "the step field points at no description").toBeTruthy();

    const status = container.querySelector(`#${CSS.escape(describedBy!)}`)!;
    expect(status, "aria-describedby names an element that does not exist").toBeTruthy();
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("announces the outcome of a step rather than only recolouring it", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <QuestionInteraction question={question()} disabled={false} onSubmit={() => {}} />
    );

    const field = screen.getByRole("textbox");
    const status = container.querySelector(`#${CSS.escape(field.getAttribute("aria-describedby")!)}`)!;
    const before = status.textContent;

    field.focus();
    await user.keyboard("999999{Enter}");

    expect(status.textContent, "a wrong step changed nothing a reader would hear").not.toBe(before);
    expect(status.textContent!.trim().length).toBeGreaterThan(0);
  });
});

describe("answering does not throw focus away", () => {
  it("leaves focus inside the question after the verdict appears", async () => {
    // The failure this guards is specific and common: the answer control is
    // disabled the moment an answer lands, the browser drops focus to <body>,
    // and a keyboard user has to tab in from the top of the document to reach
    // "Continue". Anything still inside the question is fine; nothing is not.
    const user = userEvent.setup();
    const numeric = firstOfKind("numeric-input");
    const { container } = render(
      <QuestionInteraction question={numeric} disabled={false} onSubmit={() => {}} />
    );

    const field = screen.getByRole("textbox");
    field.focus();
    await user.keyboard("12{Enter}");

    expect(
      container.contains(document.activeElement),
      "focus left the question when the answer was submitted"
    ).toBe(true);
  });
});

/**
 * Scope §6 asks for "modal focus trapping and restoration **where modals
 * exist**". None do, so there is nothing to trap — and "nothing to test" is a
 * claim, not an exemption. It is defended here the way this repository defends
 * every other completeness claim (D-014): a declared list, checked against the
 * source, so the day a dialog is added this fails and says what is now owed.
 */
describe("modal focus trapping, where modals exist", () => {
  it("ships no modal, so the trap and restore checks are not yet owed", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");

    const roots = ["src/renderer/components", "src/renderer/screens", "src/renderer/layouts", "src/renderer/features"];
    const offenders: string[] = [];
    for (const root of roots) {
      let entries: string[] = [];
      try {
        entries = readdirSync(root);
      } catch {
        continue; // a directory that does not exist holds no modals
      }
      for (const file of entries.filter((f) => f.endsWith(".tsx"))) {
        const source = readFileSync(join(root, file), "utf8");
        if (/role=["']dialog["']|role=["']alertdialog["']|aria-modal/.test(source)) offenders.push(`${root}/${file}`);
      }
    }

    expect(
      offenders,
      `a modal has appeared in ${offenders.join(", ")} — scope §6 now requires focus trapping and restoration checks, which this file does not have`
    ).toEqual([]);
  });
});
