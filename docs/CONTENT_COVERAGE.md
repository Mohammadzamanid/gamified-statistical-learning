# CONTENT_COVERAGE.md — per-topic interaction coverage

**Generated** by `npm run report:coverage`. Do not edit by hand.

Topics come from the **curriculum graph**, never from the set of generator modules (`STAGE2_RECONSTRUCTION_SCOPE.md` §4). A topic with no generators appears here as a failure rather than being omitted.

**9 of 22 topics** meet §4: at least 100 validated available interactions spanning at least 4 reasoning families, with nothing unreachable.

## The seven metrics, per topic

| Topic | Authored records | Generator families | Reasoning families | Raw combinations | Valid combinations | Validated generated | **Total available** | Meets §4 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Choosing measures (`skill.choose-measure`) | 4 | 0 | 0 | 0 | 0 | 0 | **4** | **No** |
| Data literacy (`skill.data-literacy`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Mean (`skill.mean`) | 6 | 0 | 0 | 0 | 0 | 0 | **6** | **No** |
| Median (`skill.median`) | 5 | 0 | 0 | 0 | 0 | 0 | **5** | **No** |
| Addition (`skill.r1-addition`) | 7 | 8 | 8 | 800 | 800 | 800 | **807** | Yes |
| Cases and observations (`skill.r1-cases`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Coordinates (`skill.r1-coordinates`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Counting (`skill.r1-counting`) | 7 | 8 | 8 | 1000 | 848 | 848 | **855** | Yes |
| Decimals (`skill.r1-decimals`) | 7 | 6 | 6 | 324 | 264 | 264 | **271** | Yes |
| Division (`skill.r1-division`) | 7 | 8 | 6 | 800 | 301 | 284 | **291** | Yes |
| Fractions (`skill.r1-fractions`) | 8 | 6 | 6 | 324 | 263 | 263 | **271** | Yes |
| Multiplication (`skill.r1-multiplication`) | 7 | 8 | 8 | 800 | 761 | 761 | **768** | Yes |
| Negative numbers (`skill.r1-negatives`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Number lines (`skill.r1-number-lines`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Percentages (`skill.r1-percentages`) | 7 | 6 | 6 | 324 | 264 | 264 | **271** | Yes |
| Proportions (`skill.r1-proportions`) | 7 | 6 | 6 | 324 | 264 | 264 | **271** | Yes |
| Ratios (`skill.r1-ratios`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Subtraction (`skill.r1-subtraction`) | 7 | 8 | 8 | 800 | 797 | 797 | **804** | Yes |
| Reading tables (`skill.r1-tables`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Kinds of variable (`skill.r1-variable-kinds`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Variables (`skill.r1-variables`) | 7 | 0 | 0 | 0 | 0 | 0 | **7** | **No** |
| Range (`skill.range`) | 1 | 0 | 0 | 0 | 0 | 0 | **1** | **No** |

## Rejections, per topic

| Topic | Invalid combinations | Schema failures | Correct-answer failures | Missing a11y | Missing misconception mapping | Exact duplicates | Near duplicates | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Choosing measures | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 25% |
| Data literacy | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Mean | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 17% |
| Median | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 20% |
| Addition | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10% |
| Cases and observations | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Coordinates | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Counting | 152 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 12% |
| Decimals | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Division | 499 | 0 | 0 | 0 | 0 | 0 | 17 | 0 | 13% |
| Fractions | 61 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Multiplication | 39 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10% |
| Negative numbers | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Number lines | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Percentages | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Proportions | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37% |
| Ratios | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Subtraction | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10% |
| Reading tables | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Kinds of variable | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Variables | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14% |
| Range | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100% |

## Why combinations were rejected

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

**Percentages**

- 36 x the total does not divide into this many equal parts
- 24 x the share needs a fourth decimal place, which these topics do not ask for

**Proportions**

- 36 x the total does not divide into this many equal parts
- 24 x the share needs a fourth decimal place, which these topics do not ask for

**Subtraction**

- 3 x the result would fall below zero, which this topic has not taught yet

## Reasoning families represented

- **Choosing measures** — 0: _none_
- **Data literacy** — 0: _none_
- **Mean** — 0: _none_
- **Median** — 0: _none_
- **Addition** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Cases and observations** — 0: _none_
- **Coordinates** — 0: _none_
- **Counting** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Decimals** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Division** — 6: Calculation · Error identification · Irrelevant-information filtering · Multi-step reasoning · Real-world application · Recognition
- **Fractions** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Multiplication** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Negative numbers** — 0: _none_
- **Number lines** — 0: _none_
- **Percentages** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Proportions** — 6: Comparison · Error identification · Ordering · Real-world application · Representation conversion · Transfer to an unfamiliar context
- **Ratios** — 0: _none_
- **Subtraction** — 8: Calculation · Comparison · Error identification · Irrelevant-information filtering · Multi-step reasoning · Ordering · Real-world application · Recognition
- **Reading tables** — 0: _none_
- **Kinds of variable** — 0: _none_
- **Variables** — 0: _none_
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
- **Cases and observations** (`skill.r1-cases`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Coordinates** (`skill.r1-coordinates`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Negative numbers** (`skill.r1-negatives`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Number lines** (`skill.r1-number-lines`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Ratios** (`skill.r1-ratios`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Reading tables** (`skill.r1-tables`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Kinds of variable** (`skill.r1-variable-kinds`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Variables** (`skill.r1-variables`)
  - no generator families produce for this topic
  - 7 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
- **Range** (`skill.range`)
  - no generator families produce for this topic
  - 1 available interactions, below the required 100
  - 0 reasoning families represented, below the required 4
  - 100% of interactions share one reasoning shape, above the 50% ceiling — this is the "numeric variants of one pattern" case
