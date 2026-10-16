# Security policy

FormPilot is maintained by [Faizal Imam (@faizalimam00)](https://github.com/faizalimam00) in [faizalimam00/FORM-PILOT](https://github.com/faizalimam00/FORM-PILOT). Version 0.1 is the initial locally tested release candidate. No browser-store publication or external security audit is claimed.

## Reporting a vulnerability

GitHub private vulnerability reporting is currently disabled for this repository, verified on 2026-10-16. There is no advertised private security inbox.

To arrange a private channel, open a [private-contact request](https://github.com/faizalimam00/FORM-PILOT/issues/new?title=Private%20security%20contact%20request&body=Please%20arrange%20a%20private%20channel%20for%20a%20security%20report.%20No%20sensitive%20details%20are%20included%20in%20this%20request.). **That request is public:** include only a request for a private reporting route. Wait for the maintainer to arrange a private channel before sharing vulnerability details. Do not post exploit instructions, profile exports, credentials, affected personal data or sensitive screenshots in public issues.

For ordinary bugs that contain no security-sensitive information, use the [bug report form](https://github.com/faizalimam00/FORM-PILOT/issues/new?template=bug_report.yml) with fictional data.

## What to include in a private report

Affected version/build, browser version, operating system, a minimal local fictional HTML reproduction, expected and actual behavior, impact, and whether the problem crosses a trust boundary. Avoid testing third-party sites without authorization.

The maintainer will assess the report, reproduce it where possible, and coordinate a fix and disclosure. No response-time guarantee is made. Private reporting availability must be rechecked before a browser-store launch.

See [the threat model](docs/architecture/threat-model.md) for privacy boundaries and residual risks. Ordinary browser storage is not encryption; a website can read values once filled.
