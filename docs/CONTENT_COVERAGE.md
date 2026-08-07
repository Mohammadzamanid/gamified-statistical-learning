# CONTENT_COVERAGE.md — per-topic interaction coverage

**Generated** by `npm run report:coverage`. Do not edit by hand.

Topics come from the **curriculum graph**, never from the set of generator modules (`STAGE2_RECONSTRUCTION_SCOPE.md` §4). A topic with no generators appears here as a failure rather than being omitted.

**17 of 22 topics** meet §4: at least 100 validated available interactions spanning at least 4 reasoning families, with nothing unreachable.

## The seven metrics, per topic

| Topic | Authored records | Generator families | Reasoning families | Raw combinations | Valid combinations | Validated generated | **Total available** | Meets §4 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Choosing measures (`skill.choose-measure`) | 4 | 0 | 0 | 0 | 0 | 0 | **4** | **No** |
| Data literacy (`skill.data-literacy`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Mean (`skill.mean`) | 6 | 0 | 0 | 0 | 0 | 0 | **6** | **No** |
| Median (`skill.median`) | 5 | 0 | 0 | 0 | 0 | 0 | **5** | **No** |
| Addition (`skill.r1-addition`) | 7 | 8 | 8 | 800 | 800 | 800 | **807** | Yes |
| Cases and observations (`skill.r1-cases`) | 7 | 4 | 4 | 392 | 392 | 304 | **311** | Yes |
| Coordinates (`skill.r1-coordinates`) | 7 | 6 | 6 | 384 | 322 | 322 | **329** | Yes |
| Counting (`skill.r1-counting`) | 7 | 8 | 8 | 1000 | 848 | 848 | **855** | Yes |
| Decimals (`skill.r1-decimals`) | 7 | 6 | 6 | 324 | 264 | 264 | **271** | Yes |
| Division (`skill.r1-division`) | 7 | 8 | 6 | 800 | 301 | 284 | **291** | Yes |
| Fractions (`skill.r1-fractions`) | 8 | 6 | 6 | 324 | 263 | 263 | **271** | Yes |
| Multiplication (`skill.r1-multiplication`) | 7 | 8 | 8 | 800 | 761 | 761 | **768** | Yes |
| Negative numbers (`skill.r1-negatives`) | 7 | 6 | 6 | 172 | 167 | 167 | **174** | Yes |
| Number lines (`skill.r1-number-lines`) | 7 | 5 | 5 | 175 | 155 | 155 | **162** | Yes |
| Percentages (`skill.r1-percentages`) | 7 | 6 | 6 | 324 | 264 | 264 | **271** | Yes |
| Proportions (`skill.r1-proportions`) | 7 | 6 | 6 | 324 | 264 | 264 | **271** | Yes |
| Ratios (`skill.r1-ratios`) | 7 | 8 | 8 | 468 | 453 | 453 | **460** | Yes |
| Subtraction (`skill.r1-subtraction`) | 7 | 8 | 8 | 800 | 797 | 797 | **804** | Yes |
| Reading tables (`skill.r1-tables`) | 7 | 5 | 5 | 228 | 228 | 225 | **232** | Yes |
| Kinds of variable (`skill.r1-variable-kinds`) | 7 | 5 | 5 | 240 | 228 | 208 | **215** | Yes |
| Variables (`skill.r1-variables`) | 7 | 5 | 5 | 272 | 232 | 228 | **235** | Yes |
| Range (`skill.range`) | 1 | 0 | 0 | 0 | 0 | 0 | **1** | **No** |

## Rejections, per topic

| Topic | Invalid combinations | Schema failures | Correct-answer failures | Missing a11y | Missing misconception mapping | Exact duplicates | Near duplicates | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Choosing measures | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 25% |
| Data literacy | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Mean | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 17% |
| Median | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 20% |
| Addition | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10% |
| Cases and observations | 0 | 0 | 0 | 0 | 0 | 0 | 88 | 0 | 13% |
| Coordinates | 62 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 17% |
| Counting | 152 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 12% |
| Decimals | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Division | 499 | 0 | 0 | 0 | 0 | 0 | 17 | 0 | 13% |
| Fractions | 61 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Multiplication | 39 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10% |
| Negative numbers | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 26% |
| Number lines | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 18% |
| Percentages | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Proportions | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Ratios | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 22% |
| Subtraction | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10% |
| Reading tables | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 13% |
| Kinds of variable | 12 | 0 | 0 | 0 | 0 | 0 | 20 | 0 | 0% |
| Variables | 40 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 14% |
| Range | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100% |

## Why combinations were rejected

**Coordinates**

- 22 x the move would run off the edge of the grid
- 8 x the pair is symmetric, so placing it the wrong way round gives the same point
- 8 x the pair is symmetric, so the swapped option is the same pair
- 8 x the two stores share a berth, so there is nothing to compare
- 8 x the pair is symmetric, so writing it the wrong way round changes nothing
- 8 x the pair is symmetric, so the swapped option names the same seat

**Counting**

- 84 x more groups than a shift sheet holds
- 60 x a tally never leaves five or more loose marks
- 8 x the two values are equal, so the wrong-order distractor is identical

**Decimals**

- 36 x the total does not divide into this many equal parts
- 24 x the share needs a fourth decimal place, which these topics do not ask for

**Division**

- 499 x the share does not come out exactly, and remainders are a later lesson

**Fractions**

- 36 x the total does not divide into this many equal parts
- 24 x the share needs a fourth decimal place, which these topics do not ask for
- 1 x the mistake happens to give the right answer here

**Multiplication**

- 39 x the product is larger than this topic's range

**Negative numbers**

- 4 x the account would not go below zero, so nothing negative is recorded
- 1 x zero has no side of the waterline to describe

**Number lines**

- 6 x the reading lies beyond the end of this gauge
- 6 x one of the two readings lies beyond the end of its line
- 5 x the second mark lies beyond the end of this line
- 3 x the value lies beyond the end of this line

**Percentages**

- 36 x the total does not divide into this many equal parts
- 24 x the share needs a fourth decimal place, which these topics do not ask for

**Proportions**

- 36 x the total does not divide into this many equal parts
- 24 x the share needs a fourth decimal place, which these topics do not ask for

**Ratios**

- 8 x adding the same amount to both leaves this mix unchanged, so the wrong option is not wrong
- 3 x the whole batch is larger than the shed the lesson shows
- 2 x the two parts are equal, so the misconception option is also correct
- 2 x the scaled batch is larger than the shed the lesson shows

**Subtraction**

- 3 x the result would fall below zero, which this topic has not taught yet

**Kinds of variable**

- 12 x only two framings of this question are distinct; the rest repeat one of them

**Variables**

- 32 x with one varying column there is no counting step before the multiplication
- 8 x too few columns for a constant and more than one variable

## Reasoning families represented

- **Choosing measures** — 0: _none_
- **Data literacy** — 0: _none_
- **Mean** — 0: _none_
- **Median** — 0: _none_
- **Addition** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Cases and observations** — 4: Calculation · Comparison · Multi-step reasoning · Recognition
- **Coordinates** — 6: Comparison · Error identification · Multi-step reasoning · Recognition · Transfer to an unfamiliar context · Visual interpretation
- **Counting** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Decimals** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Division** — 6: Calculation · Error identification · Irrelevant-information filtering · Multi-step reasoning · Real-world application · Recognition
- **Fractions** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Multiplication** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Negative numbers** — 6: Calculation · Comparison · Error identification · Ordering · Representation conversion · Transfer to an unfamiliar context
- **Number lines** — 5: Calculation · Comparison · Error identification · Real-world application · Visual interpretation
- **Percentages** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Proportions** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Ratios** — 8: Calculation · Comparison · Error identification · Multi-step reasoning · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Subtraction** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Reading tables** — 5: Comparison · Error identification · Multi-step reasoning · Transfer to an unfamiliar context · Visual interpretation
- **Kinds of variable** — 5: Comparison · Error identification · Recognition · Transfer to an unfamiliar context · Visual interpretation
- **Variables** — 5: Comparison · Error identification · Multi-step reasoning · Recognition · Transfer to an unfamiliar context
- **Range** — 0: _none_

## Topics that do not meet §4

- **Choosing measures** (`skill.choose-measure`)
  - no generator families produce for this topic
  - 4 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Data literacy** (`skill.data-literacy`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Mean** (`skill.mean`)
  - no generator families produce for this topic
  - 6 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Median** (`skill.median`)
  - no generator families produce for this topic
  - 5 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Range** (`skill.range`)
  - no generator families produce for this topic
  - 1 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
  - 100% of interactions share one reasoning shape, above the 50% ceiling — this is the "numeric variants of one pattern" case
