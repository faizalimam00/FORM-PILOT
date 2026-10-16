---
layout: ../layouts/Document.astro
title: From familiar details to a reviewed form
description: A clear walkthrough of FormPilot’s profile, scan, review, fill and undo workflow.
---

## Choose the right version of your details

Create a personal profile and a separate work profile if you need both. Each has its own contact details, address, professional information and optional custom fields. Make one active in settings or select a saved profile in the toolbar popup. Unsaved edits do not affect a fill.

Full name is derived from first, middle and last name. You can override it. Country calling code is stored separately; the Phone value is used as entered, so include a calling code there when your forms expect a complete international number.

## Click Fill form

Open FormPilot from the toolbar and click **Fill form**. It scans the current page and fills all empty, high-confidence matches together. Existing values, uncertain matches and sensitive fields stay untouched. No new tab or window opens. For manual control, choose **Review fields & corrections** instead; this scans without filling and shows the review controls in the same popup. The extension reads supported control metadata, including labels, accessibility text, input type, autocomplete tokens, section context and select options.

It does not change form values while scanning. It knows whether a field already contains a value, but does not show that existing value in the review UI. Background tabs are not continuously monitored.

## Read the suggestion and its reason

High-confidence matches have strong semantic evidence. Needs-review matches rely on weaker hints or have a conflict, duplicate or contextual concern. No-reliable-match fields are left unmapped when evidence is weak. These categories are rules-based judgments, not calibrated probabilities.

In the optional review view, use the filters to examine each group. Every suggestion shows its proposed property and value. Expand **Why this suggestion?** to see its explanation. Use **Show on page** to briefly outline the corresponding control without moving its layout or capturing input.

You can change or clear each mapping. A changed mapping is deselected until you explicitly select it. Sensitive or unsupported controls stay excluded and cannot be overridden in this release.

## Fill only your selection

Only high-confidence, empty fields with profile values are selected automatically. Review uncertain mappings and select them yourself. Existing values need two deliberate actions: allow replacement, then select the field.

Filling rechecks each live control. If its identity, metadata, options or value changed after scanning, FormPilot reports that and leaves it alone. Country selection can replace state controls: fill the country, then rescan to review the new state field.

FormPilot emits input and change events for supported inputs, including tested React-controlled fields. It never clicks submit or goes to the next step. Always inspect the final form yourself.

## Undo or remember a correction

Undo applies to the most recent fill, within five minutes in the same page session. It restores only the values that FormPilot changed and skips later edits or changed controls. A rescan clears the prior undo state. Closing the toolbar popup, leaving the page, or expiry also clears temporary state.

For a correction, **Remember this mapping for this website when filled** is opt-in. Only a successful fill stores it. The remembered mapping contains a profile property key and form/field metadata, not another copy of your value. It applies only to the exact origin and matching context. Inspect or remove it in settings.

Try the [interactive playground](/demo/) or see the [supported controls and limits](/limitations/).
