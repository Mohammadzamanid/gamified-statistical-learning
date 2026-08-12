# CONTENT_COVERAGE.md — per-topic interaction coverage

**Generated** by `npm run report:coverage`. Do not edit by hand.

Topics come from the **curriculum graph**, never from the set of generator modules (`STAGE2_RECONSTRUCTION_SCOPE.md` §4). A topic with no generators appears here as a failure rather than being omitted.

**41 of 41 topics** meet §4: at least 100 validated available interactions spanning at least 4 reasoning families, with nothing unreachable.

## The seven metrics, per topic

| Topic | Authored records | Generator families | Reasoning families | Raw combinations | Valid combinations | Validated generated | **Total available** | Meets §4 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Choosing measures (`skill.choose-measure`) | 10 | 4 | 4 | 253 | 253 | 253 | **263** | Yes |
| Data literacy (`skill.data-literacy`) | 7 | 4 | 4 | 322 | 272 | 272 | **279** | Yes |
| Mean (`skill.mean`) | 15 | 4 | 4 | 138 | 105 | 105 | **120** | Yes |
| Median (`skill.median`) | 11 | 4 | 4 | 322 | 272 | 272 | **283** | Yes |
| Addition (`skill.r1-addition`) | 9 | 8 | 8 | 800 | 800 | 800 | **809** | Yes |
| Cases and observations (`skill.r1-cases`) | 9 | 4 | 4 | 392 | 392 | 304 | **313** | Yes |
| Coordinates (`skill.r1-coordinates`) | 7 | 6 | 6 | 384 | 322 | 322 | **329** | Yes |
| Counting (`skill.r1-counting`) | 8 | 8 | 8 | 1000 | 848 | 848 | **856** | Yes |
| Decimals (`skill.r1-decimals`) | 7 | 6 | 6 | 324 | 264 | 264 | **271** | Yes |
| Division (`skill.r1-division`) | 9 | 8 | 6 | 800 | 301 | 284 | **293** | Yes |
| Fractions (`skill.r1-fractions`) | 10 | 6 | 6 | 324 | 263 | 263 | **273** | Yes |
| Multiplication (`skill.r1-multiplication`) | 10 | 8 | 8 | 800 | 761 | 761 | **771** | Yes |
| Negative numbers (`skill.r1-negatives`) | 8 | 6 | 6 | 172 | 167 | 167 | **175** | Yes |
| Number lines (`skill.r1-number-lines`) | 8 | 5 | 5 | 175 | 155 | 155 | **163** | Yes |
| Percentages (`skill.r1-percentages`) | 8 | 6 | 6 | 324 | 264 | 264 | **272** | Yes |
| Proportions (`skill.r1-proportions`) | 8 | 6 | 6 | 324 | 264 | 264 | **272** | Yes |
| Ratios (`skill.r1-ratios`) | 10 | 8 | 8 | 468 | 453 | 453 | **463** | Yes |
| Subtraction (`skill.r1-subtraction`) | 8 | 8 | 8 | 800 | 797 | 797 | **805** | Yes |
| Reading tables (`skill.r1-tables`) | 13 | 5 | 5 | 228 | 228 | 225 | **238** | Yes |
| Kinds of variable (`skill.r1-variable-kinds`) | 8 | 5 | 5 | 240 | 228 | 208 | **216** | Yes |
| Variables (`skill.r1-variables`) | 8 | 5 | 5 | 272 | 232 | 228 | **236** | Yes |
| Bar charts (`skill.r2-bar-charts`) | 8 | 4 | 4 | 322 | 312 | 312 | **320** | Yes |
| Box plots (`skill.r2-box-plots`) | 7 | 4 | 4 | 322 | 301 | 301 | **308** | Yes |
| Choosing a graph (`skill.r2-choosing-graphs`) | 6 | 5 | 4 | 345 | 285 | 285 | **291** | Yes |
| Comparing distributions (`skill.r2-comparing-distributions`) | 6 | 4 | 4 | 322 | 302 | 302 | **308** | Yes |
| Dot plots (`skill.r2-dot-plots`) | 9 | 4 | 4 | 322 | 145 | 145 | **154** | Yes |
| Frequency (`skill.r2-frequency`) | 8 | 5 | 5 | 120 | 116 | 116 | **124** | Yes |
| Histograms (`skill.r2-histograms`) | 8 | 4 | 4 | 322 | 299 | 299 | **307** | Yes |
| Interquartile range (`skill.r2-iqr`) | 8 | 4 | 4 | 322 | 302 | 302 | **310** | Yes |
| Misleading graphs (`skill.r2-misleading-graphs`) | 7 | 4 | 4 | 322 | 316 | 316 | **323** | Yes |
| Mode (`skill.r2-mode`) | 8 | 4 | 4 | 345 | 285 | 285 | **293** | Yes |
| Outliers (`skill.r2-outliers`) | 6 | 4 | 4 | 322 | 319 | 319 | **325** | Yes |
| Percentage of a dataset (`skill.r2-percentage`) | 8 | 5 | 5 | 165 | 135 | 135 | **143** | Yes |
| Percentiles (`skill.r2-percentiles`) | 6 | 4 | 4 | 463 | 365 | 365 | **371** | Yes |
| Proportion of a dataset (`skill.r2-proportion`) | 8 | 5 | 5 | 165 | 135 | 135 | **143** | Yes |
| Quartiles (`skill.r2-quartiles`) | 10 | 4 | 4 | 322 | 315 | 315 | **325** | Yes |
| Scatterplots (`skill.r2-scatterplots`) | 7 | 5 | 5 | 248 | 200 | 200 | **207** | Yes |
| Skew (`skill.r2-skew`) | 7 | 4 | 4 | 322 | 302 | 302 | **309** | Yes |
| Standard-deviation intuition (`skill.r2-standard-deviation`) | 6 | 4 | 4 | 322 | 318 | 318 | **324** | Yes |
| Variance intuition (`skill.r2-variance`) | 9 | 5 | 5 | 345 | 329 | 329 | **338** | Yes |
| Range (`skill.range`) | 8 | 4 | 4 | 322 | 299 | 299 | **307** | Yes |

## Rejections, per topic

| Topic | Invalid combinations | Schema failures | Correct-answer failures | Missing a11y | Missing misconception mapping | Exact duplicates | Near duplicates | Unreachable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Choosing measures | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Data literacy | 50 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Mean | 33 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2% |
| Median | 50 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
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
| Bar charts | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Box plots | 21 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Choosing a graph | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Comparing distributions | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Dot plots | 177 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1% |
| Frequency | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1% |
| Histograms | 23 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Interquartile range | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Misleading graphs | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Mode | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Outliers | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Percentage of a dataset | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2% |
| Percentiles | 98 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2% |
| Proportion of a dataset | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2% |
| Quartiles | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Scatterplots | 48 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4% |
| Skew | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Standard-deviation intuition | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Variance intuition | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| Range | 23 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |

## Why combinations were rejected

**Data literacy**

- 50 x the two number of casess are equal

**Mean**

- 22 x the missing figure is not whole, and a part-crate reads as an error
- 11 x the mean does not land on a hundredth, so the answer cannot be typed exactly

**Median**

- 17 x the middle of the unsorted list is already the median, so ordering makes no difference
- 17 x the middle of the list as written is the median here, so the clerk is right
- 15 x the two medians are equal, so there is no higher one
- 1 x fewer than four distinct figures makes the ordering trivial

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

**Bar charts**

- 8 x the two tallest bars are equal
- 2 x two bars tie for tallest

**Box plots**

- 20 x the two boxs are equal
- 1 x two of the three cuts coincide, so the options repeat

**Choosing a graph**

- 60 x the two number of distinct valuess are equal

**Comparing distributions**

- 20 x the two middle halfs are equal

**Dot plots**

- 177 x the two tallest columns are equal

**Frequency**

- 2 x another category has the same column height, so two options read identically
- 1 x this category's frequency equals the number of categories, so the mistake is invisible
- 1 x two categories tie for most frequent, so there is no single answer

**Histograms**

- 23 x the two spread across intervalss are equal

**Interquartile range**

- 20 x the two middle halves are the same width

**Misleading graphs**

- 2 x the readings do not admit a baseline above zero that still shows every bar
- 2 x no baseline above zero leaves every bar visible
- 2 x the two vulnerability to a raised baselines are equal

**Mode**

- 43 x one of these logs has more than one mode, so there is no single figure to compare
- 13 x the two modes are the same figure
- 2 x this log has more than one mode, so a single-answer question would be wrong
- 2 x two columns tie for tallest, so no single column is the mode

**Outliers**

- 3 x the two distance past the upper fences are equal

**Percentage of a dataset**

- 19 x the expected number is not whole, and a fractional count of cases reads as an error rather than an estimate
- 11 x equal totals let the counts be compared directly, so the share is not needed

**Percentiles**

- 60 x the percentile does not land on a hundredth, so it cannot be typed exactly
- 23 x the largest figure stands at the hundredth percentile, which is true of every log and teaches nothing
- 15 x the two median as a percentile standings are equal, so there is no greater one

**Proportion of a dataset**

- 19 x the expected number is not whole, and a fractional count of cases reads as an error rather than an estimate
- 11 x equal totals let the counts be compared directly, so the share is not needed

**Quartiles**

- 7 x the two third quartiles are equal, so there is no greater one

**Scatterplots**

- 19 x both clouds drift the same way, so there is nothing to choose
- 16 x two points share this horizontal position, so naming it does not name a point
- 11 x no point sits above this level, so the question has a trivial answer
- 2 x a cloud with no drift gives nobody a cause to claim

**Skew**

- 16 x the two gap between mean and medians are equal
- 2 x the mean sits on the median, so there is no tail to name
- 2 x no tail to see

**Standard-deviation intuition**

- 4 x the two standard deviations agree to two places

**Variance intuition**

- 11 x the mean does not land on a hundredth, so the squared distances cannot be worked by hand
- 3 x the two variances are equal, so there is no greater one
- 2 x the variance does not land on a hundredth, so it cannot be typed exactly

**Range**

- 23 x the two ranges are equal, so there is no greater one

## Reasoning families represented

- **Choosing measures** — 4: Comparison · Error identification · Real-world application · Recognition
- **Data literacy** — 4: Calculation · Comparison · Error identification · Recognition
- **Mean** — 4: Calculation · Error identification · Multi-step reasoning · Prediction
- **Median** — 4: Calculation · Comparison · Error identification · Ordering
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
- **Bar charts** — 4: Comparison · Prediction · Recognition · Visual interpretation
- **Box plots** — 4: Calculation · Comparison · Recognition · Visual interpretation
- **Choosing a graph** — 4: Comparison · Error identification · Real-world application · Recognition
- **Comparing distributions** — 4: Comparison · Error identification · Prediction · Recognition
- **Dot plots** — 4: Comparison · Error identification · Recognition · Visual interpretation
- **Frequency** — 5: Calculation · Comparison · Error identification · Multi-step reasoning · Visual interpretation
- **Histograms** — 4: Calculation · Comparison · Prediction · Recognition
- **Interquartile range** — 4: Comparison · Error identification · Multi-step reasoning · Recognition
- **Misleading graphs** — 4: Comparison · Error identification · Prediction · Recognition
- **Mode** — 4: Calculation · Comparison · Recognition · Visual interpretation
- **Outliers** — 4: Calculation · Comparison · Error identification · Prediction
- **Percentage of a dataset** — 5: Calculation · Comparison · Multi-step reasoning · Real-world application · Representation conversion
- **Percentiles** — 4: Calculation · Comparison · Prediction · Recognition
- **Proportion of a dataset** — 5: Calculation · Comparison · Multi-step reasoning · Real-world application · Representation conversion
- **Quartiles** — 4: Calculation · Comparison · Multi-step reasoning · Recognition
- **Scatterplots** — 5: Calculation · Comparison · Error identification · Recognition · Visual interpretation
- **Skew** — 4: Comparison · Prediction · Recognition · Visual interpretation
- **Standard-deviation intuition** — 4: Calculation · Comparison · Real-world application · Recognition
- **Variance intuition** — 5: Calculation · Comparison · Error identification · Prediction · Recognition
- **Range** — 4: Calculation · Comparison · Error identification · Prediction

## Topics that do not meet §4

None.
