import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { writeFileSync, mkdirSync } from 'node:fs';
import { matchField } from '../packages/matching-engine/src/index';
import { sampleProfile } from '../packages/profile-schema/src/index';
import { developmentCases, type BenchmarkCase } from '../packages/form-fixtures/src/index';
import { heldOutCases } from '../packages/form-fixtures/src/held-out';
function evaluate(cases: BenchmarkCase[]) {
  const results = cases.map((c) => {
    const m = matchField(c.field, sampleProfile);
    const proposed = !m.excluded && m.confidence !== 'none' && !!m.property;
    return {
      id: c.id,
      expected: c.expected,
      actual: proposed ? m.property : null,
      expectedExcluded: c.excluded,
      excluded: !!m.excluded,
      confidence: m.confidence,
      correct:
        !!m.excluded === c.excluded &&
        (c.excluded || (proposed ? m.property : null) === c.expected),
      proposed,
    };
  });
  const eligible = cases.filter((c) => !c.excluded).length;
  const proposed = results.filter((r) => r.proposed).length;
  const correctProposals = results.filter(
    (r) => r.proposed && !r.expectedExcluded && r.actual === r.expected,
  ).length;
  const eligibleProposed = results.filter((r) => r.proposed && !r.expectedExcluded).length;
  const abstentions = eligible - eligibleProposed;
  const expectedAbstentions = results.filter((r) => !r.expectedExcluded && r.expected === null);
  const incorrectHigh = results.filter(
    (r) => r.proposed && r.confidence === 'high' && (r.actual !== r.expected || r.expectedExcluded),
  ).length;
  return {
    cases: cases.length,
    eligible,
    excluded: cases.length - eligible,
    proposed,
    correctProposals,
    precision: proposed ? correctProposals / proposed : 1,
    coverage: eligibleProposed / eligible,
    abstentions,
    abstentionRate: abstentions / eligible,
    expectedAbstentions: expectedAbstentions.length,
    correctExpectedAbstentions: expectedAbstentions.filter((r) => !r.proposed && !r.excluded)
      .length,
    incorrectHigh,
    exclusionErrors: results.filter((r) => r.excluded !== r.expectedExcluded).length,
    failures: results.filter((r) => !r.correct),
  };
}
const timings: number[] = [];
for (let i = 0; i < 20; i++) for (const c of heldOutCases) matchField(c.field, sampleProfile);
for (let i = 0; i < 100; i++)
  for (const c of heldOutCases) {
    const t = performance.now();
    matchField(c.field, sampleProfile);
    timings.push(performance.now() - t);
  }
timings.sort((a, b) => a - b);
const report = {
  generatedAt: new Date().toISOString(),
  dataset: 'FormPilot synthetic English field benchmark v1',
  environment: {
    node: process.version,
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpu: os.cpus()[0]?.model,
    timingSamples: timings.length,
    warmupCalls: 20 * heldOutCases.length,
  },
  runtimeMs: {
    median: timings[Math.floor(timings.length * 0.5)],
    p95: timings[Math.floor(timings.length * 0.95)],
  },
  development: evaluate(developmentCases),
  heldOut: evaluate(heldOutCases),
  byScenario: Object.fromEntries(
    ['event', 'job', 'shipping', 'saas', 'difficult'].map((s) => [
      s,
      evaluate(heldOutCases.filter((c) => c.scenario === s)),
    ]),
  ),
};
mkdirSync('docs/benchmarks', { recursive: true });
writeFileSync('docs/benchmarks/results.json', JSON.stringify(report, null, 2) + '\n');
const pct = (v: number) => (v * 100).toFixed(1) + '%';
const lines = [
  '# Measured benchmark results',
  '',
  `Generated ${report.generatedAt}. Synthetic fixtures only; not a claim about all websites.`,
  ``,
  `Held-out: ${report.heldOut.cases} cases; ${report.heldOut.eligible} eligible; ${report.heldOut.excluded} expected exclusions.`,
  ``,
  `- Precision among proposals: ${pct(report.heldOut.precision)} (${report.heldOut.correctProposals}/${report.heldOut.proposed}).`,
  `- Coverage of eligible fields: ${pct(report.heldOut.coverage)}.`,
  `- Abstention rate among eligible fields: ${pct(report.heldOut.abstentionRate)}.`,
  `- Incorrect high-confidence matches: ${report.heldOut.incorrectHigh}.`,
  `- Correct intentional abstentions: ${report.heldOut.correctExpectedAbstentions}/${report.heldOut.expectedAbstentions}.`,
  `- Exclusion classification errors: ${report.heldOut.exclusionErrors}.`,
  `- Matcher median: ${report.runtimeMs.median?.toFixed(4)} ms; p95: ${report.runtimeMs.p95?.toFixed(4)} ms per field.`,
  ``,
  `| Scenario | Cases | Precision | Coverage | Abstention | Incorrect high |`,
  `|---|---:|---:|---:|---:|---:|`,
  ...Object.entries(report.byScenario).map(
    ([s, r]) =>
      `| ${s} | ${r.cases} | ${pct(r.precision)} | ${pct(r.coverage)} | ${pct(r.abstentionRate)} | ${r.incorrectHigh} |`,
  ),
  '',
  `Environment: ${JSON.stringify(report.environment)}.`,
  '',
  'All failures are retained in results.json. The runtime excludes DOM scanning, rendering, storage and browser messaging. See methodology.md for denominators and limitations.',
];
writeFileSync('docs/benchmarks/results.md', lines.join('\n') + '\n');
console.log(lines.join('\n'));
