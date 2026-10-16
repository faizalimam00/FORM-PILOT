---
layout: ../../layouts/Document.astro
title: What browser autofill tools should explain about privacy
description: Local storage, extension permissions, exports and the moment a website can read a filled value should be explained plainly.
article: true
---

“Your data stays local” is useful only when the boundaries are clear. Which data? Local to the browser, a desktop app or a synchronized account? What happens when a tool fills a website’s form? What remains after you close the window?

These questions matter because an autofill tool sits between information you reuse and websites with different intentions. A good privacy explanation should help you make a decision, not ask you to trust a reassuring adjective.

## Local storage is a location, not encryption

FormPilot stores saved profiles in extension-local browser storage. It does not use cloud sync or a FormPilot account. The trusted extension UI can read those profiles, while the injected content script does not receive a complete profile.

That does not make ordinary browser storage encrypted by FormPilot. Someone with access to your browser profile, operating-system account or extension debugging tools may be able to read it. Device compromise is outside the protection offered by this extension. The privacy policy says this directly because “local” and “protected from everyone” are different claims.

Export deserves the same clarity. A backup file is readable JSON with personal information. Moving it to a shared drive, attaching it to an issue or sending it in a message creates another copy beyond the extension’s control. Delete controls inside FormPilot cannot retrieve that copy later.

## Explain when page access starts

An extension does not need permission to inspect every website all the time to help with a form you are currently using. FormPilot uses the browser’s activeTab permission and programmatic script injection after you invoke it. Scanning starts when you press Fill form or choose Review fields & corrections in the toolbar popup. Fill form also fills empty high-confidence matches; the optional review view lets you inspect before filling.

The scan reads supported controls and their metadata in the top-level document. It records whether fields have values. The content script temporarily keeps original values for change detection and undo, but does not return them to the review UI. It does not inspect frames or shadow-root controls in this release.

A browser-restricted page may refuse access. The useful response is an explanation and a supported alternative, not a demand for a broader permanent permission unrelated to the task.

## Filling is already sharing with the website

The submit button is not the first moment a website can see a value. Page scripts can read input values and observe input or change events. They can send that information elsewhere before the form is submitted.

FormPilot never submits a form automatically. That preserves your workflow, but it does not make a filled value invisible to the site. Only fill information into websites you trust, and review the destination as carefully as the suggested value.

The extension sends only the selected values needed for a fill to its content script. This reduces how much of your profile enters the page-related context. It cannot prevent the website from reading the values you deliberately put in its controls.

## Describe temporary data and remembered decisions

Undo requires remembering what changed. FormPilot keeps the most recent fill in document memory for up to five minutes. A new scan or fill, closing review, leaving the document or expiry clears that state. Browser scheduling can delay timers in suspended pages; memory is not a secure-erasure guarantee.

Remembered mappings have a different lifetime. They persist until deleted and describe an exact origin, form, field and profile property. They do not duplicate the profile value. Still, a mapping’s metadata may reveal the kind of website or form you used. It deserves an inspect-and-delete screen, which is included in settings.

## Ask what “no tracking” covers

The FormPilot extension has no telemetry, remote matching service or external AI API call. The demo site has no analytics scripts or remote fonts. A future public host may still generate ordinary access logs, so its operator and retention policy must be documented before launch.

That distinction keeps the claim honest. A tool can control its own requests and code, but not every behavior of a browser platform, a hosting service or a destination website.

Read the [plain-language privacy policy](/privacy/) for implementation-specific details. When comparing any autofill tool, look for these concrete boundaries: storage location, permissions, data sent to the page, temporary retention, export format and deletion scope. They tell you more than a promise that your information is “safe.”
