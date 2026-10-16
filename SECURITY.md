# Security policy

FormPilot is maintained by [Faizal Imam](https://github.com/faizalimam00). Security reports should describe the affected version and browser, the impact, and a minimal reproduction using fictional data.

## Reporting a vulnerability

To arrange a private reporting channel, open a [security contact request](https://github.com/faizalimam00/FORM-PILOT/issues/new?title=Private%20security%20contact%20request&body=Please%20arrange%20a%20private%20channel%20for%20a%20security%20report.%20No%20sensitive%20details%20are%20included%20in%20this%20request.). **The contact request is public:** include only the request for a private channel. Share vulnerability details after the maintainer provides that channel.

Keep exploit instructions, profile exports, credentials, personal information and sensitive screenshots out of public issues. Ordinary bugs with fictional examples can use the [bug report form](https://github.com/faizalimam00/FORM-PILOT/issues/new?template=bug_report.yml).

## Coordinating a fix

Include the FormPilot version, browser and operating-system versions, expected and actual behavior, reproduction steps, and the trust boundary affected. Test only systems you own or have permission to assess.

The maintainer will assess the report, reproduce the issue where possible, and coordinate a fix and disclosure. See the [threat model](docs/architecture/threat-model.md) for the implementation’s trust boundaries.

## Data boundaries

Profiles are stored locally in the browser. FormPilot does not encrypt browser storage or exported files. A website can read values filled into its form before submission. Read the [privacy policy](apps/website/src/pages/privacy.md) for storage, export and deletion details.
