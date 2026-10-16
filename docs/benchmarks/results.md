# Measured benchmark results

Generated 2026-10-16T14:59:15.008Z. Synthetic fixtures only; not a claim about all websites.

Held-out: 100 cases; 81 eligible; 19 expected exclusions.

- Precision among proposals: 98.3% (58/59).
- Coverage of eligible fields: 72.8%.
- Abstention rate among eligible fields: 27.2%.
- Incorrect high-confidence matches: 0.
- Correct intentional abstentions: 21/21.
- Exclusion classification errors: 0.
- Matcher median: 0.0093 ms; p95: 0.0153 ms per field.

| Scenario  | Cases | Precision | Coverage | Abstention | Incorrect high |
| --------- | ----: | --------: | -------: | ---------: | -------------: |
| event     |    20 |    100.0% |    72.2% |      27.8% |              0 |
| job       |    20 |    100.0% |    76.5% |      23.5% |              0 |
| shipping  |    20 |    100.0% |    86.7% |      13.3% |              0 |
| saas      |    20 |    100.0% |    75.0% |      25.0% |              0 |
| difficult |    20 |     87.5% |    53.3% |      46.7% |              0 |

Environment: {"node":"v22.22.0","platform":"darwin","release":"25.4.0","arch":"arm64","cpu":"Apple M1 Pro","timingSamples":10000,"warmupCalls":2000}.

All failures are retained in results.json. The runtime excludes DOM scanning, rendering, storage and browser messaging. See methodology.md for denominators and limitations.
