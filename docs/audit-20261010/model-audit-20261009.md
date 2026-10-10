# ABCM independent model audit — 9 October 2026

Scope: maintained source `/workspace/scratch/92bff2eff2a5/abcm`, release86; read-only research, no application edits or deployment. Evidence categories below distinguish direct production payload inspection from source-only edge cases. Public API GET saved as `model-production-20261009.json`; edition `2026-10-09T11:39:09.081Z`, engine `abcm-sites-7-ten-signal`, context `abcm-six-force-1`. This is a reproduction of arithmetic from API observations, not an independent certification that every upstream observation matches its original publisher.

## Outcome

**PASS: current eligible arithmetic. FAIL: missing-score contract and classification presentation.** Eight eligible scores, all transformations feeding them, four valid parent aggregates, composite, both market/gold ratios and six correlations independently reproduce. The public score52 is mathematically correct under the deployed method. No numerical reweighting or threshold change is justified by this result.

Run: `python /workspace/scratch/92bff2eff2a5/model-independent-check-20261009.py`. Output: `model-independent-results-20261009.json`. Uses Python standard library only, reads original public observation arrays, independently computes transformations and rounding, and asserts equality to published eligible outputs. No production TypeScript helpers imported. Fiscal signals cannot be live-verified because their inputs are excluded for age; historical arithmetic below is explicitly ineligible.

## Issue register

| ID | Severity | Evidence | Finding and minimal action |
|---|---|---|---|
| M01 | P1 | LIVE + SOURCE | Hero labels score-band52 `Mixed transition` beneath `CURRENT REGIME`; Return Desk and API classify liquidity67/credit45 as `liquidity-led-expansion`. `app/monitor.tsx:cycleBand` and `regimeText` encode different concepts. Preserve legitimate distinction: name first `Composite pressure band`, second `Pillar-based regime`, expose both consistently. Do not rewrite score or classifier to force agreement. |
| M02 | P0 contract / UI guarded | LIVE + SOURCE | API `derived.scores.debtBurden`, `fiscalImpulse`, `fiscal` are35 while their readiness flags arefalse and debtGrowth isnull. `app/api/data/route.ts:n`, score formulas convert missing input to0, then add35. Composite correctly excludes these, and UI hides them; nevertheless public numerical components falsely appear calculated. Emit nullable unavailable scores and nullable composite below70% coverage; preserve readiness, adjust readers/types and bump schema contract as needed. |
| M03 | P1 | LIVE + SOURCE | Six-force `debt` uses April1 observation yet available=true and state=`debt-accelerating`; context iscomplete6/6 and synthesizes current refinancing pressure. `buildSixForceContext` only tests finite numbers, not freshness, and does not annotate age in force output. Preserve historical value/date, mark STALE, exclude stale evidence from current pattern claims (or explicitly label historical synthesis). |
| M04 | P1 | SOURCE VERIFIED, not currently active | `debtSeries = treasuryDebt.length ? treasuryDebt : modelSeries.federalDebt...` bypasses `modelSeries` freshness for retained daily Treasury history. Failed provider + old daily Treasury history can yield eligible fiscalImpulse although its observation is stale. Apply source-specific freshness to chosen daily series before scoring, while retaining it for historical display. Test both current and expired retained histories. |
| M05 | P1 | SOURCE VERIFIED | `readPersistedEdition` normalizes absent ten-signal scores by aliasing parent values (`money=liquidity`, `creditRisk=credit`, etc.). This supplies uncomputed contributions for old editions. Retain authentic historical parent scores separately, withhold nonexistent native signals, or recompute from validated eligible observations under versioned migration. |
| M06 | P1 methodology label | SOURCE + LIVE example | `fiscalImpulse` is annual nominal debt-stock growth, not expenditure/tax/structural-balance fiscal impulse. Context `debt-accelerating` uses debtGrowth>5 without a change-of-growth calculation. Rename descriptions to `Debt growth (fiscal proxy)` and `Debt growing above 5%`, or separately version a new definition. No need to change current coefficients. |
| M07 | P2 | SOURCE VERIFIED | `valueBefore` picks any older point at/before365-day cutoff, without a maximum period gap. Missing exact year-ago month can silently produce13/14-month change labelledYoY. Monthly/quarterly growth should require matched period or explicitly report actual endpoints and approximate interval; version any arithmetic policy change. |
| M08 | P2 | SOURCE VERIFIED | Real-economy pillar explanatory copy lists consumer prices, but formula uses production/capacity/labour only. CPI feeds separate price-pressure engine. Correct text to actual inputs. |
| M09 | P2 | SOURCE VERIFIED | `pillarCards.available` depends on global modelAvailable, hiding a fully eligible pillar when composite iswithheld. This conflicts with text saying available pillars remain visible. Gate each pillar by its own complete inputs, independent of composite threshold. |

## Exact ten-signal contract

Source: `app/api/data/route.ts`, helpers `change`, `delta`, `alignedRealRate`, `clamp`, model block near1000–1080. `C(x)=max(0,min(100,Math.round(x)))`, so scores are integer-rounded **before** weighting. `g_X(d)=100*(X_latest/X_before_d-1)`; `Δ_X(d)=X_latest-X_before_d`. Before-d is last available observation no later than latest date minusd calendar days. Current source age gates: macro monthly75days, market daily14days, quarterly debt160days. Frequency-specific constants exist, but actual release calendars/holidays are not modeled.

| Signal | Base weight | Required input and formula | Independent example from actual stored observations | Direction / limitation |
|---|---:|---|---|---|
| Money supply |14%|`C(50+6*g_M2(365))`|Aug2026 M2 23342.8 / Aug2025 22092.6 =>5.6589084128%; score84|Higher money growth increases pressure; M2 is not total credit.|
| Monetary stance |13%|`C(45-8*Δ_FEDFUNDS(365)-3*realRate)`|Sep2026 3.75−Sep2025 4.22=−.47pp. RealRate aligned **Aug** FEDFUNDS3.63−CPIYoY3.3530163228=.2769836772pp; score48|Lower rates/inflation-adjusted proxy increase pressure; not natural-rate deviation. Latest annual policy change and ex-post real-rate proxy use different disclosed observation months.|
| Credit risk |13%|`C(15+17*BAA10Y+.9*VIX)`|Oct7 spread1.46pp,VIX15.08 =>53.392=>53|Higher spread and implied equity volatility increase pressure. Not direct bank-credit conditions.|
| Term structure |10%|`C(35+35*max(0,-T10Y2Y))`|Oct8 curve+.47pp =>35. Independently same-dateOct7 DGS10 5.28−DGS2 4.77=.51 equalsOct7 T10Y2Y. Latest component yields must not be subtracted and compared against next-day curve without dates.|Only inversion depth is scored; nonnegative slopes all score35. Re-steepening narrative exceeds what this static formula measures.|
| Productive structure |12%|`C(45-6*g_INDPRO(365)-5*Δ_TCU(365))`|Aug31 IP103.0682/101.6247=>1.4204223973%; TCU76.2717−76.1055=.1662pp; score36|Weak production/capacity raises pressure; limited proxy for heterogeneous capital structure/malinvestment.|
| Labour adjustment |8%|`C(35+25*Δ_UNRATE(365))`|Sep2026 4.2−Sep2025 4.4=−.2pp=>30|Rising unemployment increases stress; not all labour-market dimensions.|
| Consumer prices |9%|`C(25+12*g_CPI(365))`|Aug2026 334.131/Aug2025 323.291=>3.3530163228%; score65|Inflation raises pressure; price level is not itself inflation or complete cost of living.|
| Resources/currency |6%|`C(40+.55*g_WTI(90)-.65*g_dollar(90))`|Oct6 WTI96.24/Jul8 74.56=>29.0772532189%; Oct2 dollar121.3848/Jul2 120.6902=>.5755231162%; score56|Oil up raises pressure, dollar up lowers this score; mixed supply/demand causes cannot be inferred from prices. Dates differ.|
| Debt burden |9%|`C(35+.75*max(0,debtGDP−80))`|Latest actual ratio122.59387%, **Jan1 stale/ineligible**. Hypothetical historical arithmetic using this actual value is66.9454025=>67; no current eligible score.|Higher debt ratio raises pressure; not crisis timing. Actual API35 is an invalid placeholder.|
| Fiscal impulse |6%|`C(35+3*g_debt(365))`|Actual federal debtApr1 2026 39,462,398 million / Apr1 2025 36,211,469=>8.9776225317%; historicalscore62. **Not currently eligible**.|Debt growth is a fiscal proxy, not a formally measured fiscal impulse. Actual API35 is invalid placeholder.|

Core raw-input count14 = M2growth,ratechange,realrate,Baa,curve,VIX,IPgrowth,unemploymentchange,capacitychange,CPIgrowth,oil90d,dollar90d,debtGDP,debtgrowth. Twelve eligible inputs produce eight eligible signals; 19-series registry includes chart/context-only series. These are different, reconcilable denominators. `fredAvailable=14/19` is a source-result count, not the14 model-input count, and source naming can mislead when backups supply data.

## Aggregation, missing data and classification

Each signal is eligible only when all its required transformed inputs arefinite, after source freshness filtering (daily Treasury exception M04). `modelReady=true` requires allten. Available base weight `W=sum(w_i for eligible i)`. Composite is published when `W>=.70`; provisional if any signal missing, complete if allten. Weight is redistributed among eligible signals: effectiveweight=`w_i/W`. Below70% API internally currently uses0, while UI withholds it; M02 recommendsnull.

Production: `[84,48,53,35,36,30,65,56]` withweights `[.14,.13,.13,.10,.12,.08,.09,.06]` yieldsweighted numerator44.32 andW=.85; `C(44.32/.85)=C(52.1411764706)=52`. Effectiveweights16.4706%,15.2941%,15.2941%,11.7647%,14.1176%,9.4118%,10.5882%,7.0588%. Fiscal weights9%+6% excluded, never scored as35 in thecomposite.

Parents: liquidity=`C((.14*84+.13*48)/.27)=67`; credit=`C((.13*53+.10*35)/.23)=45`; real economy=`C((.12*36+.08*30)/.20)=34`; prices=`C((.09*65+.06*56)/.15)=61`. Fiscal requires both eligible fiscal signals; not presently valid. Three-pillar UI displays liquidity/credit/real economy only, not thefull five-parent decomposition.

Pillar-based regime classifier is ordered: defaultmixed; liquidity>=62 andcredit<55=>liquidityexpansion (orcreditpending ifcreditmissing); credit>=65 andreal>=58=>creditcontraction; inflation>=68 andreal>=55=>stagflation; liquidity<42 andreal<45=>disinflationreset. Relevantparents must becomplete. Later conditions overrideearlierones. Production67/45 yieldsliquidityexpansion. Separate score bands0–20,21–40,41–60,61–80,81–100 areintensity categories;52 ismiddleband. They are not the same classifier.

The100pointscale combines monetary expansion and macroeconomic stress proxies in hand-set normalized bands. It is not a probability, natural interest rate, objective malinvestment measurement, or validated recession forecast. Large component disagreement can yield the same mean. Model uses CPI both directly and in real-rateproxy; economic double exposure is intentional mathematical structure but deserves explicit disclosure. No empirical calibration justification for coefficients or threshold accuracy was established by thisaudit.

## Ratios and correlations

Actual September monthly averages: BTC80308.166 / gold4319=18.5941574439ounces; SPX7669.414285714285 /4319=1.7757384315indexpoints/ounceprice. Thirty BTCdays,21SPXdays, one already-monthly gold observation. Ratios correctly align commonmonth; **they do not combine liveBTC with monthlygold**. Not a spot ratio. Historical daily samples and already aggregated monthly gold carry different sampling definitions. Debt/M2 April commonmonth39462.398billion/22756.6billion≈1.73411, correctly withheld because commonperiodstale.

Pearson correlations use last available month-level observations, month-over-month percent changes, consecutive common-month pairs only; last60pairs, minimum24; zero variance=>null. Independent standard-library result: M2/SPX.16597530835(n60); dollar/gold−.35335578326(n60); oil/CPI.32985915481(n60); BTC/M2−.04468568665(n58); BTC/gold.07873537958(n59); SPX/gold.02141484930(n60). All agreewithin1e−12. Endpoint dates span variable calendarwidth where sharedconsecutivepairs aremissing. This uses available revised history, not as-of public-information vintages. Historical association is not causal evidence or predictive validation.

## Six-force separation

`buildSixForceContext` is called **after** scores/regime and never writes score inputs; correct non-scored separation verified. Treasury/yields, nominal debtgrowth, oil90d, manufacturing survey, dollar90d, BTC90d feed hand-codedpatternlabels. Currentdebtgrowth8.98% and90dyieldchange+.74pp yieldrefinancingpressure; riseinyields andBTC27.365% produce divergence. No explicit source-age gating in this layer causesM03. Debt `accelerating` is an absolute annual growth threshold, not second derivative; change alone cannot prove acceleration. Treasuryavailable can betruewithout90dhistory althoughpattern needs it. BTC value usuallycomesfrom latesthistory rather than livequote; date must staypaired to it.

## Required regression tests and boundaries

1. Exact current edition: assert eligible scores and52, bands andpillarregime rendered with distinct semanticlabels inES/EN. Test with samecomposite but differentparentcomposition.
2. Missingdebt andmissingall: nullable APIcomponents, unchanged eligibility/reweighting, no visible neutral/fake0; test69% vs70% weight, with a floatingpoint-tolerant integer-weight implementation if needed.
3. Primarytimeout+retainedoldTreasury: historicalseriesremains, fiscalImpulseexcluded, correctSTALEage; freshretaineddaily input allowed only under documentedpolicy.
4. Six-force olddebt: stale status/date explicit and no currentpattern unsupported by eligibleinputs; thresholds unchanged.
5. Snapshotmigration missingnative ten-signal fields: do not cloneparents intochildren. Preservehistoricalparents andmetadata.
6. Calendartransform: missing exactly12monthsago; sparsequarterlyhistory; leapyear; duplicate/out-of-order observations; no denominatorzero; bothinputs finite.
7. Ratioalignment: independentmonths, dailyBTC with monthlygold, freshindividual endpoints but stale latestcommonmonth; absenthistoricalCPIyearago producesnullrealrate.
8. Same-dateTreasurycurve comparison and Baa componentdifference; differentlatestdates cannot be called discrepantwithoutalignment.
9. Correlation24/23boundary, zero variance, missingmonth, revision-labelled history; no fictitious highconfidence or probability.
10. Each formula clamping and roundingboundary, eligibilityweight, parentcompletegate and exact classifier precedence.
11. Adding/removing six-force inputs must not change ten-signal composite.

Historical model-stability/weight-sensitivity/real-time backtests remain **NOT TESTED**: no verified as-of vintage dataset or archived eligible source snapshots supplied to this audit. Provider-original economic truth remains outside this arithmetic audit. No claim of economic predictive validity is made.
