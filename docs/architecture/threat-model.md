# Threat model and security review

## Assets and trust boundaries

Assets are personal profiles, original page values retained for undo, saved mapping metadata and user intent. Trusted code is the bundled extension UI/service worker and isolated content script. Website DOM and metadata, imported JSON, extension messages and persisted data are treated as untrusted input. The website playground intentionally uses only fictional data.

A malicious website may manipulate labels, autocomplete metadata, options or control lifecycle to induce a wrong fill. A person with device access can inspect browser-local data. A compromised dependency or modified extension can defeat the application’s guarantees. V1 does not defend a compromised browser or operating system.

## Threats and mitigations

| Threat                                      | Implemented control                                                                           | Residual boundary                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Silent background collection                | No persistent content scripts or all-site hosts; explicit Fill form or review action          | Invoked pages provide metadata, which can itself contain information          |
| Entire profile exposed to site-related code | Profiles stay in trusted extension storage; selected values only to detector                  | A website reads any value actually filled                                     |
| Forged/malformed commands                   | Sender ID + exact allowlisted extension-page URL + top frame; strict Zod message validation   | Trusted extension code remains privileged                                     |
| Malicious import/prototype keys             | Strict object schemas, UUID/URL/email/type limits, 500 KB import bound, no HTML rendering     | User can place sensitive text in an ordinary free-text property               |
| Filling a sensitive field                   | Conservative checks across labels/attributes/section/autocomplete; rechecked before filling   | Unknown sensitive wording and deliberate mislabelling can evade heuristics    |
| Stale or swapped control                    | Live element tokens, full semantic fingerprint, original-value comparison, URL/session checks | Arbitrary page scripts can change state immediately after a successful fill   |
| Destructive overwrite                       | Nonempty value opt-in plus explicit selection; just-in-time value check                       | Filled values are shared with the page regardless of submission               |
| Undo overwrites a later edit                | Value, edit-revision and fingerprint guard; changed/missing fields skipped                    | Silent changes that return exactly to the written value are indistinguishable |
| Cross-site memory leakage                   | Exact origin + form/field/section fingerprint; no copied personal values; duplicate handling  | Mapping metadata persists and can reveal browsing context                     |
| Concurrent editor overwrites                | Serialized service-worker writes with revision check                                          | Invalid local data requires troubleshooting, not an automatic reset           |
| Remote code execution through product       | Self-only MV3 CSP, no eval, no remote code, React escaping                                    | Dependency supply chain and developer tools remain trusted                    |
| Unbounded input                             | Profile, custom field, memory, message, scan and option limits                                | Extremely large/hostile DOMs still cost scan time                             |

The direct Fill form button skips uncertain and nonempty controls but does not require inspecting each high-confidence suggestion. High confidence is heuristic, not proof of a trustworthy site. Optional review is available before filling.

## Operational controls

No personal values are logged. Fixtures and captures use Alex Morgan’s fictional sample with example.com links. Browser tests use isolated temporary profiles. Trace files are ignored by Git and must never be captured from real personal forms. Do not expose the development server beyond loopback by default.

Dependency audit, static type/lint checks, unit/DOM tests and real extension tests are recorded in `docs/QA_REPORT.md`. These automated checks complement manual review; they are not an independent security audit.

## Safe reporting

Use a fictional minimal form and reproduce on a local origin. Do not include live profile JSON, credentials or sensitive page screenshots. Follow [SECURITY.md](../../SECURITY.md). Request a private channel through the documented contact-request link without disclosing sensitive details.
