/**
 * S2-08: the 18 lesson-completeness requirements of `STAGE2_RECONSTRUCTION_SCOPE.md`
 * §5, enforced rather than asserted in prose.
 *
 * Every lesson named in `tests/helpers/complete-lessons.ts` is held to all 18.
 * The scope is explicit that "a lesson that is only explanatory text plus
 * questions is not Complete" and that placeholder controls do not count, so the
 * checks here deliberately go past presence:
 *
 *  - the demonstration is *driven* through the real core module and its readout
 *    must actually change (requirement 4 — an inert widget fails);
 *  - notation must be explained by the lesson or one of its prerequisites, in
 *    the lesson prose, its questions and its remediations (requirements 9-10 and
 *    the beginner-safety rule);
 *  - review schedulability is checked against the real queue (requirement 17).
 */
import { describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import {
  DEMONSTRATION_ARITY,
  createEmptySave,
  type Lesson,
  type Question,
  type SaveFile
} from "../../src/shared/schemas";
import { demonstrationReadout, describeDemonstration, initialValues, setControlValue } from "../../src/core/curriculum/demonstration";
import { pickQuestionForSkill } from "../../src/core/spaced-repetition/review-queue";
import { getDetector, registerBuiltInDetectors, listDetectorNames } from "../../src/core/misconceptions/detectors";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";

const content = loadShippedContent();

if (listDetectorNames().length === 0) registerBuiltInDetectors();

const lessons = COMPLETE_LESSONS.map((id) => {
  const lesson = content.curriculum.lessons.find((l) => l.id === id);
  if (!lesson) throw new Error(`COMPLETE_LESSONS names ${id}, which is not in the curriculum`);
  return lesson;
});

const ROLE_KEYS = [
  "guidedQuestionIds",
  "independentQuestionIds",
  "misconceptionQuestionIds",
  "applicationQuestionIds",
  "teachBackQuestionIds",
  "masteryCheckQuestionIds"
] as const;

function questionsOf(lesson: Lesson): Question[] {
  return lesson.questionIds.map((qid) => {
    const q = content.questions.get(qid);
    if (!q) throw new Error(`${lesson.id} references missing question ${qid}`);
    return q;
  });
}

function skillsOf(lesson: Lesson): string[] {
  return [
    ...new Set(
      lesson.objectiveIds.flatMap((oid) => content.curriculum.objectives.find((o) => o.id === oid)?.skillIds ?? [])
    )
  ];
}

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.structure",
    name: "Auditor",
    createdAt: new Date().toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

/**
 * Symbols that never appear in ordinary English, so finding one is always
 * notation. Operators like + and x are handled separately, because they only
 * count as notation when they sit between two numbers ("exactly" contains an x).
 *
 * Two marks are deliberately out of scope, because in this curriculum they are
 * punctuation far more often than notation and a guard that cannot tell the
 * difference is worse than none:
 *
 *  - `=` is read aloud as "is" throughout, never introduced as a symbol.
 *  - `:` was tried here and immediately produced a false positive on
 *    "Count on 5: 8, 9, 10, 11, 12" — a colon ending a clause, not a ratio.
 *
 * Neither is unchecked overall: requirement 10 below still forces any lesson
 * whose *notation* contains them (ratios, proportions) to explain them.
 */
const ALWAYS_NOTATION = ["×", "÷", "√", "∑", "σ", "μ", "π", "≥", "≤", "≠", "≈", "^", "%"];
const OPERATOR_BETWEEN_NUMBERS = /\d\s*([+\-x×÷/*])\s*\d/g;

/** Every operator and symbol a stretch of learner-facing text actually uses. */
function notationUsedIn(text: string): Set<string> {
  const found = new Set<string>();
  for (const symbol of ALWAYS_NOTATION) {
    if (text.includes(symbol)) found.add(symbol);
  }
  for (const match of text.matchAll(OPERATOR_BETWEEN_NUMBERS)) {
    found.add(match[1]!);
  }
  return found;
}

/** Symbols this lesson explains, plus everything its prerequisites explained. */
function symbolsAvailableTo(lessonId: string, seen = new Set<string>()): Set<string> {
  const available = new Set<string>();
  if (seen.has(lessonId)) return available;
  seen.add(lessonId);
  const lesson = content.curriculum.lessons.find((l) => l.id === lessonId);
  if (!lesson) return available;
  for (const s of lesson.formalTerm?.symbols ?? []) available.add(s.symbol);
  for (const p of lesson.prerequisites) {
    for (const s of symbolsAvailableTo(p, seen)) available.add(s);
  }
  return available;
}

/** Every piece of learner-facing prose a lesson puts in front of someone. */
function learnerFacingText(lesson: Lesson): Array<{ where: string; text: string }> {
  const parts: Array<{ where: string; text: string }> = [];
  if (lesson.narrativeIntro) parts.push({ where: "narrativeIntro", text: lesson.narrativeIntro });
  for (const c of lesson.concepts) {
    parts.push({ where: `concept ${c.id} summary`, text: c.summary });
    parts.push({ where: `concept ${c.id} body`, text: c.body });
  }
  const d = lesson.demonstration;
  if (d) {
    parts.push({ where: "demonstration experience", text: d.experience });
    parts.push({ where: "demonstration accessibleDescription", text: d.accessibleDescription });
    parts.push({ where: "demonstration observation", text: d.observation });
    parts.push({ where: "demonstration prediction", text: d.prediction.prompt });
    parts.push({ where: "demonstration revealNote", text: d.prediction.revealNote });
    for (const o of d.prediction.options) parts.push({ where: `prediction option ${o.id}`, text: o.text });
  }
  if (lesson.formalTerm) parts.push({ where: "formalTerm definition", text: lesson.formalTerm.definition });

  for (const q of questionsOf(lesson)) {
    parts.push({ where: `${q.id} prompt`, text: q.prompt });
    parts.push({ where: `${q.id} explanation`, text: q.explanation });
    for (const h of q.hints) parts.push({ where: `${q.id} hint ${h.level}`, text: h.text });
    for (const [i, s] of q.solutionSteps.entries()) parts.push({ where: `${q.id} solution step ${i + 1}`, text: s });
    for (const c of q.choices ?? []) parts.push({ where: `${q.id} choice ${c.id}`, text: c.text });
    if (q.answer.kind === "steps") {
      for (const s of q.answer.steps) {
        parts.push({ where: `${q.id}/${s.id} prompt`, text: s.prompt });
        parts.push({ where: `${q.id}/${s.id} explanation`, text: s.explanation });
        for (const h of s.hints) parts.push({ where: `${q.id}/${s.id} hint`, text: h });
      }
    }
    // Remediation prose is lesson-facing too: it is the first thing a struggling
    // learner reads, so it is held to the same rule.
    for (const mcId of q.misconceptionIds) {
      const mc = content.misconceptions.find((m) => m.id === mcId);
      const rem = content.remediations.find((r) => r.id === mc?.remediationId);
      if (!rem) continue;
      parts.push({ where: `${rem.id} explanation`, text: rem.explanation });
      if (rem.microLesson) parts.push({ where: `${rem.id} microLesson`, text: rem.microLesson });
    }
  }
  return parts;
}

describe("Complete lessons are declared honestly", () => {
  it("names lessons that exist and are not duplicated", () => {
    expect(new Set(COMPLETE_LESSONS).size).toBe(COMPLETE_LESSONS.length);
    expect(lessons.length).toBe(COMPLETE_LESSONS.length);
  });
});

describe("requirement 1 — learning objective", () => {
  it("every Complete lesson has objectives that resolve to real skills", () => {
    for (const lesson of lessons) {
      expect(lesson.objectiveIds.length, `${lesson.id}`).toBeGreaterThan(0);
      for (const oid of lesson.objectiveIds) {
        const objective = content.curriculum.objectives.find((o) => o.id === oid);
        expect(objective, `${lesson.id} references missing objective ${oid}`).toBeDefined();
        expect(objective!.text.trim().length, `${oid} has no text`).toBeGreaterThan(10);
        expect(objective!.skillIds.length, `${oid} teaches no skill`).toBeGreaterThan(0);
        for (const sid of objective!.skillIds) {
          expect(
            content.curriculum.skills.some((s) => s.id === sid),
            `${oid} names missing skill ${sid}`
          ).toBe(true);
        }
      }
    }
  });
});

describe("requirement 2 — narrative or practical purpose", () => {
  it("says why the topic is worth learning, not just what it is", () => {
    for (const lesson of lessons) {
      expect(lesson.narrativeIntro, `${lesson.id} has no narrative intro`).toBeTruthy();
      expect(lesson.narrativeIntro!.trim().length, `${lesson.id} narrative intro is a stub`).toBeGreaterThan(80);
    }
  });
});

describe("requirements 3-6 — a demonstration the learner drives", () => {
  it("requirement 3: a concrete beginner-level experience", () => {
    for (const lesson of lessons) {
      expect(lesson.demonstration, `${lesson.id} has no demonstration`).toBeDefined();
      expect(lesson.demonstration!.experience.trim().length, `${lesson.id} experience is a stub`).toBeGreaterThan(80);
    }
  });

  it("requirement 4: the controls really move the readout", () => {
    // The scope rules out "placeholder simulations or inactive controls". The
    // only way to know is to drive the thing: every control must change the
    // readout when it moves, or it is decoration.
    for (const lesson of lessons) {
      const demo = lesson.demonstration!;
      expect(demo.controls.length, `${demo.id} has no controls`).toBe(DEMONSTRATION_ARITY[demo.formula]);

      const start = initialValues(demo);
      const baseline = demonstrationReadout(demo, start);
      expect(Number.isFinite(baseline), `${demo.id} readout is not a finite number at its initial settings`).toBe(true);

      demo.controls.forEach((control, i) => {
        // Move to whichever end of the range is furthest from where we started.
        const target = Math.abs(control.max - start[i]!) >= Math.abs(start[i]! - control.min) ? control.max : control.min;
        const moved = setControlValue(demo, start, i, target);
        expect(moved[i], `${demo.id}/${control.id} refused to move`).not.toBe(start[i]);
        expect(
          demonstrationReadout(demo, moved),
          `${demo.id}/${control.id} is an inactive control — moving it does not change the readout`
        ).not.toBe(baseline);
      });
    }
  });

  it("requirement 5: the prediction is answerable before anything is revealed", () => {
    for (const lesson of lessons) {
      const p = lesson.demonstration!.prediction;
      expect(p.options.length, `${lesson.id} prediction needs a real choice`).toBeGreaterThanOrEqual(2);
      expect(
        p.options.some((o) => o.id === p.correctOptionId),
        `${lesson.id} prediction has no correct option`
      ).toBe(true);
      expect(p.revealNote.trim().length, `${lesson.id} reveal note is a stub`).toBeGreaterThan(40);
    }
  });

  it("requirement 6: an observation of what changed", () => {
    for (const lesson of lessons) {
      expect(lesson.demonstration!.observation.trim().length, `${lesson.id} observation is a stub`).toBeGreaterThan(60);
    }
  });
});

describe("requirement 7 — plain-language explanation", () => {
  it("every concept has a title, a summary and a body that explains", () => {
    for (const lesson of lessons) {
      expect(lesson.concepts.length, `${lesson.id} has no concepts`).toBeGreaterThan(0);
      for (const c of lesson.concepts) {
        expect(c.title.trim().length, `${lesson.id}/${c.id} title`).toBeGreaterThan(0);
        expect(c.summary.trim().length, `${lesson.id}/${c.id} summary`).toBeGreaterThan(20);
        expect(c.body.trim().length, `${lesson.id}/${c.id} body is too short to explain anything`).toBeGreaterThan(150);
      }
    }
  });

  it("never calls the idea obvious, trivial or elementary", () => {
    // Beginner safety, scope §5. Cheap to check and easy to slip into.
    const banned = ["obvious", "trivial", "elementary", "simply just", "of course", "easy enough"];
    for (const lesson of lessons) {
      for (const part of learnerFacingText(lesson)) {
        const lower = part.text.toLowerCase();
        for (const word of banned) {
          expect(lower.includes(word), `${lesson.id} ${part.where} calls the idea "${word}"`).toBe(false);
        }
      }
    }
  });
});

describe("requirements 8-10 — the formal term and its notation", () => {
  it("requirement 8: a named term with a definition", () => {
    for (const lesson of lessons) {
      expect(lesson.formalTerm, `${lesson.id} names no formal term`).toBeDefined();
      expect(lesson.formalTerm!.term.trim().length, `${lesson.id} term`).toBeGreaterThan(0);
      expect(lesson.formalTerm!.definition.trim().length, `${lesson.id} definition is a stub`).toBeGreaterThan(60);
    }
  });

  it("requirement 9: notation is optional, but never empty when present", () => {
    for (const lesson of lessons) {
      const t = lesson.formalTerm!;
      if (t.notation === undefined) {
        expect(t.symbols.length, `${lesson.id} explains symbols but shows no notation`).toBe(0);
      } else {
        expect(t.notation.trim().length, `${lesson.id} notation is blank`).toBeGreaterThan(0);
        expect(t.symbols.length, `${lesson.id} shows notation and explains nothing`).toBeGreaterThan(0);
      }
    }
  });

  it("requirement 10: every symbol in the notation is explained", () => {
    for (const lesson of lessons) {
      const t = lesson.formalTerm!;
      if (!t.notation) continue;
      const explained = new Set(t.symbols.map((s) => s.symbol));
      const tokens = t.notation.split(/\s+/).filter((tok) => tok.length > 0);
      for (const token of tokens) {
        expect(explained.has(token), `${lesson.id} notation "${t.notation}" never explains "${token}"`).toBe(true);
      }
      for (const s of t.symbols) {
        expect(s.meaning.trim().length, `${lesson.id} symbol ${s.symbol} has no meaning`).toBeGreaterThan(10);
      }
    }
  });

  it("beginner safety: no notation is used before some lesson has explained it", () => {
    // The scope's rule is "never use unexplained notation". A symbol counts as
    // explained if this lesson or any lesson upstream of it in the prerequisite
    // graph explains it — so the counting lesson may not use +, but division may.
    for (const lesson of lessons) {
      const available = symbolsAvailableTo(lesson.id);
      for (const part of learnerFacingText(lesson)) {
        for (const symbol of notationUsedIn(part.text)) {
          expect(
            available.has(symbol),
            `${lesson.id} ${part.where} uses "${symbol}" but neither it nor any prerequisite lesson explains it`
          ).toBe(true);
        }
      }
    }
  });
});

describe("requirements 11-16 — the practice a lesson has to offer", () => {
  it("fills every practice role", () => {
    for (const lesson of lessons) {
      for (const key of ROLE_KEYS) {
        expect(lesson[key].length, `${lesson.id} has nothing for ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("asks every role question during the lesson, and asks each one once", () => {
    for (const lesson of lessons) {
      const roleIds = ROLE_KEYS.flatMap((k) => lesson[k]);
      for (const qid of roleIds) {
        expect(lesson.questionIds, `${lesson.id}: ${qid} has a role but is never asked`).toContain(qid);
        expect(content.questions.get(qid), `${lesson.id} references missing question ${qid}`).toBeDefined();
      }
      // A question doing two jobs would let one section stand in for another.
      expect(new Set(roleIds).size, `${lesson.id} reuses a question across two practice roles`).toBe(roleIds.length);
      expect(new Set(lesson.questionIds).size, `${lesson.id} asks a question twice`).toBe(lesson.questionIds.length);
      for (const qid of lesson.questionIds) {
        expect(roleIds, `${lesson.id}: ${qid} is asked but has no declared role`).toContain(qid);
      }
    }
  });

  it("requirement 11: guided practice offers help before the learner is stuck", () => {
    for (const lesson of lessons) {
      for (const qid of lesson.guidedQuestionIds) {
        const q = content.questions.get(qid)!;
        expect(q.hints.length, `${qid} is guided practice with no hints`).toBeGreaterThan(0);
        expect(q.solutionSteps.length, `${qid} is guided practice with no worked steps`).toBeGreaterThan(0);
      }
    }
  });

  it("requirement 13: the misconception challenge targets a declared, detectable misconception", () => {
    for (const lesson of lessons) {
      for (const qid of lesson.misconceptionQuestionIds) {
        const q = content.questions.get(qid)!;
        expect(q.misconceptionIds.length, `${qid} targets no misconception`).toBeGreaterThan(0);
        for (const mcId of q.misconceptionIds) {
          const mc = content.misconceptions.find((m) => m.id === mcId);
          expect(mc, `${qid} names undeclared misconception ${mcId}`).toBeDefined();
          expect(getDetector(mc!.detector), `${mcId} names unregistered detector ${mc!.detector}`).toBeDefined();
          const rem = content.remediations.find((r) => r.id === mc!.remediationId);
          expect(rem, `${mcId} has no remediation`).toBeDefined();
          expect(rem!.explanation.trim().length, `${rem!.id} explains nothing`).toBeGreaterThan(60);
          for (const fid of rem!.followUpQuestionIds) {
            expect(content.questions.get(fid), `${rem!.id} follows up with missing question ${fid}`).toBeDefined();
          }
        }
      }
    }
  });

  it("requirement 15: teach-it-back is answered in the learner's own words", () => {
    for (const lesson of lessons) {
      for (const qid of lesson.teachBackQuestionIds) {
        const q = content.questions.get(qid)!;
        expect(q.interaction, `${qid} is teach-it-back but is not a written explanation`).toBe("short-explanation");
        expect(q.answer.kind, `${qid} teach-it-back answer`).toBe("text");
      }
    }
  });

  it("requirement 16: the mastery check is not easier than the practice", () => {
    for (const lesson of lessons) {
      const practice = [...lesson.guidedQuestionIds, ...lesson.independentQuestionIds]
        .map((qid) => content.questions.get(qid)!)
        .map((q) => q.difficulty);
      const hardestPractice = Math.max(...practice);
      for (const qid of lesson.masteryCheckQuestionIds) {
        const q = content.questions.get(qid)!;
        expect(
          q.difficulty,
          `${qid} is the mastery check but is easier than the practice it follows`
        ).toBeGreaterThanOrEqual(hardestPractice);
      }
    }
  });

  it("requirements 12 and 14: no question in a Complete lesson is a stub", () => {
    // Applied to every role, not just independent practice and application: a
    // one-line explanation anywhere in a finished lesson is the "explanatory text
    // plus questions" the scope rules out.
    for (const lesson of lessons) {
      for (const q of questionsOf(lesson)) {
        expect(q.prompt.trim().length, `${q.id} prompt is a stub`).toBeGreaterThan(30);
        expect(q.explanation.trim().length, `${q.id} explains nothing`).toBeGreaterThan(40);
      }
      expect(lesson.independentQuestionIds.length, `${lesson.id} independent practice`).toBeGreaterThan(0);
      expect(lesson.applicationQuestionIds.length, `${lesson.id} application`).toBeGreaterThan(0);
    }
  });
});

describe("requirement 17 — spaced-review scheduling", () => {
  it("every question a lesson asks carries a skill the lesson teaches", () => {
    for (const lesson of lessons) {
      const taught = new Set(skillsOf(lesson));
      expect(taught.size, `${lesson.id} teaches no skill`).toBeGreaterThan(0);
      for (const q of questionsOf(lesson)) {
        const overlap = q.skillIds.filter((s) => taught.has(s));
        expect(
          overlap.length,
          `${q.id} is asked by ${lesson.id} but carries none of its skills, so answering it schedules nothing`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("every skill a lesson teaches can be surfaced by the review queue", () => {
    const save = freshSave();
    for (const lesson of lessons) {
      for (const skillId of skillsOf(lesson)) {
        const picked = pickQuestionForSkill(content.questions, save, skillId);
        expect(picked, `${skillId} is taught by ${lesson.id} but the review queue has nothing to ask`).not.toBeNull();
        expect(picked!.skillIds, `review pick for ${skillId} does not practise it`).toContain(skillId);
      }
    }
  });
});

describe("requirement 18 — accessible textual equivalents", () => {
  it("the demonstration describes itself in words", () => {
    for (const lesson of lessons) {
      const demo = lesson.demonstration!;
      expect(demo.accessibleDescription.trim().length, `${demo.id} accessible description is a stub`).toBeGreaterThan(80);

      // And the generated live-region text must actually name every control and
      // the readout, so a screen-reader user is told the same state a sighted
      // one can see.
      const spoken = describeDemonstration(demo, initialValues(demo));
      for (const control of demo.controls) {
        expect(spoken, `${demo.id} spoken state omits ${control.id}`).toContain(control.label);
      }
      expect(spoken, `${demo.id} spoken state omits the readout`).toContain(demo.readoutLabel);
    }
  });

  it("every question a Complete lesson asks describes itself in words", () => {
    for (const lesson of lessons) {
      for (const q of questionsOf(lesson)) {
        expect(
          (q.accessibilityDescription ?? "").trim().length,
          `${q.id} has no accessibility description`
        ).toBeGreaterThan(20);
        if (q.visual.kind !== "none") {
          expect((q.visual.accessibleDescription ?? "").trim().length, `${q.id} visual`).toBeGreaterThan(0);
        }
      }
    }
  });
});
