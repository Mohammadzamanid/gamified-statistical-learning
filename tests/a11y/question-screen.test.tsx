/**
 * S2-20: the accessibility harness, rendering the real screens into a real DOM.
 *
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §6 requires a **DOM-capable** accessibility
 * command, and until this unit there was none: accessibility was covered by
 * `tests/unit/accessibility.test.ts`, which checks that settings map to root
 * attributes — true and useful, and not a check on anything rendered. Every
 * report since S2-14 has said `test:a11y` does not exist rather than claim it.
 *
 * It exists now. What it can and cannot see is worth stating plainly, because an
 * accessibility suite that overstates itself is worse than none:
 *
 *  - **It can** read the accessibility tree jsdom builds — roles, accessible
 *    names, live regions, tab order, disabled state — and operate the app by
 *    keyboard alone through `user-event`.
 *  - **It cannot** see contrast ratios, actual paint, or whether a focus ring is
 *    visible to an eye. jsdom computes no layout and resolves no custom
 *    properties. Where a check would need that, it is recorded as needing GUI
 *    review (scope §6's last paragraph) rather than faked here.
 */
import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { computeAccessibleName } from "dom-accessibility-api";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { registerDefaultInteractions } from "../../src/core/questions/registry";
import { QuestionScreen } from "../../src/renderer/screens/QuestionScreen";
import { useStore } from "../../src/renderer/state/store";
import { startLesson } from "../../src/renderer/state/session";
import { createEmptySave } from "../../src/shared/schemas";

const content = loadShippedContent();

const LESSON = "l.r1-addition";

function freshSave() {
  return createEmptySave({
    id: "p.a11y",
    name: "Keyboard Explorer",
    createdAt: new Date(0).toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

/** Puts the store in the state the app is in while a lesson question is on screen. */
function openQuestion(index = 0) {
  const session = startLesson(content, LESSON, 0)!;
  useStore.setState({
    content,
    save: freshSave(),
    session: { ...session, currentIndex: index },
    screen: { name: "question" }
  });
  return content.questions.get(session.questionQueue[index]!)!;
}

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
  registerDefaultInteractions();
});

beforeEach(() => {
  useStore.setState({ session: null, save: null, reviewFeedback: null });
});

describe("every control on a question has an accessible name", () => {
  it("names every button, input and control the screen renders", () => {
    openQuestion(0);
    render(<QuestionScreen />);

    // Names are computed by the real algorithm, not guessed at. The first draft
    // read `aria-label ?? textContent` and reported the answer field as unnamed
    // — it is named by a `<label for>`, which is the *better* way to do it, and
    // a hand-rolled heuristic that flags correct markup is worse than no check.
    const controls = [
      ...screen.queryAllByRole("button"),
      ...screen.queryAllByRole("textbox"),
      ...screen.queryAllByRole("radio"),
      ...screen.queryAllByRole("checkbox"),
      ...screen.queryAllByRole("combobox")
    ];
    expect(controls.length, "the question screen rendered no controls at all").toBeGreaterThan(0);

    for (const control of controls) {
      const name = computeAccessibleName(control).trim();
      expect(
        name.length,
        `${control.tagName.toLowerCase()}.${control.className} has no accessible name — a reader meets its role and nothing else`
      ).toBeGreaterThan(0);
    }
  });

  it("labels the progress bar and gives it a value a reader can announce", () => {
    openQuestion(2);
    render(<QuestionScreen />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-label");
    expect(bar.getAttribute("aria-label")!.trim().length).toBeGreaterThan(0);
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(0);
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });
});

describe("the question can be answered without a mouse", () => {
  it("reaches and operates the answer control by keyboard alone", async () => {
    const question = openQuestion(0);
    expect(question.interaction).toBe("numeric-input");
    const user = userEvent.setup();
    render(<QuestionScreen />);

    // Tab until the answer field has focus; no click anywhere.
    const field = screen.getByRole("textbox");
    let guard = 0;
    while (document.activeElement !== field) {
      expect(guard++, "the answer field could not be reached by tabbing").toBeLessThan(20);
      await user.tab();
    }

    await user.keyboard("12");
    expect(field).toHaveValue("12");

    // And submitting is a keyboard action too: Enter in the field sends it,
    // which is the whole difference between "operable" and "reachable".
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("status"), "Enter did not submit the answer").toBeTruthy();
  });

  it("leaves no control that only a pointer can reach", async () => {
    openQuestion(0);
    const user = userEvent.setup();
    const { container } = render(<QuestionScreen />);

    // Everything the screen offers, against everything tabbing can reach.
    const offered = [...container.querySelectorAll("button, input, select, textarea, [role='radio'], [role='checkbox']")]
      .filter((el) => !(el as HTMLButtonElement).disabled);

    const reached = new Set<Element>();
    for (let i = 0; i < offered.length + 6; i += 1) {
      await user.tab();
      if (document.activeElement && document.activeElement !== document.body) reached.add(document.activeElement);
    }

    for (const el of offered) {
      expect(
        reached.has(el),
        `${el.tagName.toLowerCase()}.${el.className} can be clicked but never focused`
      ).toBe(true);
    }
  });

  it("follows the reading order: abandon, then answer, then hint", async () => {
    openQuestion(0);
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const field = screen.getByRole("textbox");
    const hint = screen.getByRole("button", { name: /hint/i });
    const abandon = screen.getByRole("button", { name: /abandon/i });

    const order: Element[] = [];
    for (let i = 0; i < 10; i += 1) {
      await user.tab();
      const el = document.activeElement;
      if (el && el !== document.body && !order.includes(el)) order.push(el);
    }

    const at = (el: Element) => order.indexOf(el);
    expect(at(field), "the answer field is not reachable").toBeGreaterThan(-1);
    expect(at(hint), "the hint button is not reachable").toBeGreaterThan(-1);
    // Focus follows the page, not the DOM's convenience: the way out is at the
    // top where it is drawn, the answer next, and the hint after the thing it
    // is a hint about.
    expect(at(abandon)).toBeLessThan(at(field));
    expect(at(field)).toBeLessThan(at(hint));
  });
});

describe("feedback is announced, and says what it means without colour", () => {
  it("puts the verdict in a live region", async () => {
    openQuestion(0);
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const field = screen.getByRole("textbox");
    await user.click(field);
    await user.keyboard("12{Enter}");

    const status = await screen.findByRole("status");
    expect(status, "the verdict must be announced, not merely drawn").toBeTruthy();
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent!.trim().length).toBeGreaterThan(0);
  });

  it("states correctness in words, so the colour is not carrying it alone", async () => {
    openQuestion(0);
    const user = userEvent.setup();
    render(<QuestionScreen />);

    const field = screen.getByRole("textbox");
    await user.click(field);
    await user.keyboard("12{Enter}");

    const status = await screen.findByRole("status");
    // The class carries the colour; the text has to carry the meaning. A reader
    // who cannot see the panel, and a reader who cannot distinguish its green
    // from its red, both have only this.
    expect(status.className).toMatch(/correct|incorrect/);
    expect(status.textContent).toMatch(/correct|not quite|[A-Z]/i);
    const verdict = status.querySelector(".verdict")!;
    expect(verdict, "the panel has no verdict line").toBeTruthy();
    expect(
      verdict.textContent!.replace(/[✓✕\s]/g, "").length,
      "the verdict is symbols only, so its meaning is carried by the glyph and the colour"
    ).toBeGreaterThan(0);
  });

  it("hides the tick and cross from the reader, since the words already say it", async () => {
    openQuestion(0);
    const user = userEvent.setup();
    render(<QuestionScreen />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("12{Enter}");

    const status = await screen.findByRole("status");
    const symbol = status.querySelector("[aria-hidden='true']");
    expect(symbol, "the ✓/✕ should be decorative, with the word beside it").toBeTruthy();
    expect(["✓", "✕"]).toContain(symbol!.textContent);
  });
});
