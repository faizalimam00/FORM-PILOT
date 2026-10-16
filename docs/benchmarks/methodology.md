# Benchmark methodology v1

Run `npm run benchmark` from the repository root. It executes the actual pure matcher and writes `results.json` and `results.md`; the website imports the JSON at build time. No manually entered performance numbers are published.

## Dataset

There are 156 labelled cases: 56 development fields from the five UI scenarios, plus 100 separately authored evaluation fields (20 each for event, job, shipping, SaaS and difficult forms). Each records a scenario, split, descriptor, expected property or null, expected exclusion and note. See `packages/form-fixtures/src/index.ts` and `held-out.ts`.

The fixed evaluation file was authored separately and saved before the first benchmark. It is a synthetic English-language challenge set, not a random sample of websites or a permanently blind independent evaluation. The initial report is retained as `baseline-initial.json`. Later development regression fixes (such as GitHub/LinkedIn name normalization) are reflected in the current results; the expected labels remain unchanged. Repeated evaluation can influence engineering decisions. Do not describe this as third-party validation.

Examples cover standard labels, synonyms, misleading labels, absent labels, repeated fields and section context, autocomplete, compatible and incompatible selects, empty values and sensitive-field exclusions. Dynamic changes are represented in fixtures and verified separately in DOM and real browser tests; the pure matcher does not simulate a browser lifecycle.

## Exact denominators

A proposal is a nonexcluded match with a non-null property and confidence other than `none`. Empty profile values are therefore abstentions, even if a candidate property was identified. Eligible fields are those **expected** not to be excluded, independent of the matcher’s decision.

- **Precision** = correct property proposals on eligible fields / all proposals. A proposal on an expected sensitive exclusion counts as wrong.
- **Coverage** = proposed eligible fields / all eligible fields. This is proposal coverage, not recall over matchable positives.
- **Abstention rate** = eligible fields without a proposal / all eligible fields. Expected exclusions are outside this denominator.
- **Incorrect high-confidence matches** = high-confidence proposals whose key is wrong or whose field should be excluded. Absolute count, not a probability.
- **Intentional abstention success** = expected-null eligible fields with no proposal and no erroneous exclusion / all expected-null eligible fields.
- **Exclusion errors** = fields whose predicted excluded state differs from the expected state.

An expected-null eligible field is correct when the engine abstains. It is not counted as a missed positive. Correctness for labelled excluded fields requires an exclusion. All property disagreements and exclusion errors are retained in JSON, including expected keys missing a profile value.

## Timing

20 full evaluation passes warm up the matcher, followed by 100 timed passes (10,000 field calls), using `performance.now()`. Sort durations and report index floor(n×0.5) and floor(n×0.95). Record Node, OS, architecture, CPU, timestamp, warmup and sample count. The measured unit is one matcher call.

This excludes DOM detection, browser messaging, storage, UI rendering, user review and filling. Clock resolution, JIT, background load and hardware affect results. Repeat locally; do not infer site-wide browser latency or comparisons against other products from these numbers.

## Limitations and next experiments

The corpus is small, authored by the implementer, English-oriented and partially shares the product’s vocabulary. It does not establish multilingual accuracy, broad platform compatibility, accessibility conformance, adversarial robustness or population-level confidence calibration. Future evaluation should add independently contributed, de-identified form metadata with explicit consent and provenance. Never scrape or publish entered personal values.
