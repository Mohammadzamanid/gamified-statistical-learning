/**
 * The Region 2 topics `STAGE2_RECONSTRUCTION_SCOPE.md` §2 requires, as skill ids.
 *
 * Taken from the scope's own list — frequency · proportion · percentage · mean ·
 * median · mode · range · quartiles · percentiles · interquartile range ·
 * variance intuition · standard-deviation intuition · outliers · skew · bar
 * charts · histograms · dot plots · box plots · scatterplots · choosing graphs ·
 * misleading graphs — plus **choosing a measure of centre**, which is a Stage 1
 * skill (`skill.choose-measure`) that the scope's Region 2 description implies
 * and which would otherwise have no lesson to live in.
 *
 * Three of these are taught by lessons inherited from the Stage 1 baseline
 * rather than by lessons this stage wrote, which is why the list records the
 * lesson as well as the skill: the architecture audit checks that each topic has
 * exactly one lesson, and "inherited" is a fact about that lesson, not a gap.
 */
export interface Region2Topic {
  topic: string;
  skillId: string;
  lessonId: string;
  /** True where the lesson came from the Stage 1 baseline rather than S2-11. */
  inherited?: boolean;
}

export const REGION_2_TOPICS: readonly Region2Topic[] = [
  { topic: "Frequency", skillId: "skill.r2-frequency", lessonId: "l.r2-frequency" },
  { topic: "Proportion", skillId: "skill.r2-proportion", lessonId: "l.r2-proportion" },
  { topic: "Percentage", skillId: "skill.r2-percentage", lessonId: "l.r2-percentage" },
  { topic: "Mean", skillId: "skill.mean", lessonId: "l.reading-tallies", inherited: true },
  { topic: "Median", skillId: "skill.median", lessonId: "l.middle-harbor", inherited: true },
  { topic: "Mode", skillId: "skill.r2-mode", lessonId: "l.r2-mode" },
  { topic: "Choosing a measure of centre", skillId: "skill.choose-measure", lessonId: "l.r2-choosing-measures" },
  { topic: "Range", skillId: "skill.range", lessonId: "l.spread-1", inherited: true },
  { topic: "Quartiles", skillId: "skill.r2-quartiles", lessonId: "l.r2-quartiles" },
  { topic: "Percentiles", skillId: "skill.r2-percentiles", lessonId: "l.r2-percentiles" },
  { topic: "Interquartile range", skillId: "skill.r2-iqr", lessonId: "l.r2-iqr" },
  { topic: "Variance intuition", skillId: "skill.r2-variance", lessonId: "l.r2-variance" },
  { topic: "Standard-deviation intuition", skillId: "skill.r2-standard-deviation", lessonId: "l.r2-standard-deviation" },
  { topic: "Outliers", skillId: "skill.r2-outliers", lessonId: "l.r2-outliers" },
  { topic: "Skew", skillId: "skill.r2-skew", lessonId: "l.r2-skew" },
  { topic: "Bar charts", skillId: "skill.r2-bar-charts", lessonId: "l.r2-bar-charts" },
  { topic: "Histograms", skillId: "skill.r2-histograms", lessonId: "l.r2-histograms" },
  { topic: "Dot plots", skillId: "skill.r2-dot-plots", lessonId: "l.r2-dot-plots" },
  { topic: "Box plots", skillId: "skill.r2-box-plots", lessonId: "l.r2-box-plots" },
  { topic: "Scatterplots", skillId: "skill.r2-scatterplots", lessonId: "l.r2-scatterplots" },
  { topic: "Choosing graphs", skillId: "skill.r2-choosing-graphs", lessonId: "l.r2-choosing-graphs" },
  { topic: "Misleading graphs", skillId: "skill.r2-misleading-graphs", lessonId: "l.r2-misleading-graphs" }
];
