# Security policy

FormPilot 0.1 is the initial locally tested release candidate. No store publication or external security audit is claimed. Report issues only with fictional data and the smallest useful reproduction.

## Private reporting route — maintainer setup required

**Before public launch**, the maintainer must create/configure the actual repository and enable GitHub private vulnerability reporting under Settings → Code security → Private vulnerability reporting. Then replace this paragraph with the actual repository’s **Security → Report a vulnerability** link. Alternatively supply and verify a dedicated security email address. No address or repository URL has been supplied, so this file does not invent one.

Until that private route is configured, do not post exploit details, profile exports, tokens or sensitive screenshots in public issues. A public issue can request that the maintainer enable private reporting without revealing vulnerability details.

## Include

Affected version/build, browser version, operating system, a local fictional HTML reproduction, expected/actual behavior, impact and whether the problem crosses a trust boundary. Avoid testing third-party sites without authorization.

The maintainer should acknowledge privately, reproduce, agree a disclosure timeline, prepare a regression test and patch, and publish a factual advisory after users can update. No response-time guarantee is promised before a reporting route and maintenance capacity are established.

See [the threat model](docs/architecture/threat-model.md) for privacy boundaries and residual risks. Ordinary browser storage is not encryption; a website can read values once filled.
