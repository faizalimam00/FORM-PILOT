---
layout: ../layouts/Document.astro
title: Supported controls & troubleshooting
description: Honest compatibility limits, practical fixes and manual verification steps for FormPilot version one.
---

## Supported in version one

Desktop Chromium browsers, native text, email, telephone and URL inputs, textareas, and single native select elements in the top-level document. Explicit labels, wrapping labels, aria-label and resolved aria-labelledby are supported. Multiple forms, repeated address sections and dynamically inserted controls are handled through rescanning and conservative context review.

React-controlled inputs are included in the integration tests. Other frameworks and individual websites can intercept or transform events differently. This is not universal compatibility.

## Excluded by design

Hidden, disabled and read-only fields; passwords; OTP and verification prompts; suspected payment, government ID and token fields; file uploads; CAPTCHA; submit controls; checkboxes, radio buttons, legal consent and marketing agreements. Number and date inputs are also outside the initial supported set. You cannot override an exclusion in version one.

## Not inspected

All embedded frames, including cross-origin iframes; open and closed shadow roots; rich-text editors; canvas controls and unsupported custom dropdowns. Some protected websites reject extension access. Browser-internal pages and extension stores are restricted by the browser. The review window explains access failures instead of requesting persistent access to every site.

## “This page could not be inspected”

Return to the target website, click its FormPilot toolbar icon, and open a new review window. Access belongs to the tab where you invoked the extension. A cross-origin navigation revokes that access. Reloading or updating the extension also invalidates existing sessions.

## “Field changed since scan”

The form changed its metadata, dropdown choices, element identity or existing value. Rescan and review the current fields. For country-dependent address forms, fill country first, then rescan and fill region. FormPilot intentionally does not guess how to navigate a multi-step form.

## “No compatible dropdown option”

Matching uses exact normalized labels and values, plus a small documented alias set for countries and regions. It does not choose the nearest string. Country aliases cover the United States, United Kingdom, India, Canada, Australia, Germany, France, Japan and New Zealand. Region aliases cover a subset in the US, India and Canada; other names can still match exactly. Fill unsupported dropdown values manually.

## An expected field has no suggestion

A blank profile value, vague label, conflicting signals or unsupported language may lead to abstention. Choose a property yourself only when you understand the field. Version one’s built-in label aliases are English. Custom fields match their explicit labels and compatible input types.

## Undo restores only some fields

Undo skips fields that disappeared, changed meaning, or were edited after filling. Input/change events record later edits even when a value is changed back. Silent programmatic edits that leave exactly the same value cannot be distinguished. After five minutes, a rescan, another fill, closing review or page navigation, old undo data is no longer available.

## Scope and performance bounds

A scan includes at most 500 controls and at most 1,000 options per select. Metadata and profile values have length limits. Remembered mappings are disabled for semantically indistinguishable duplicates. Multiple review windows for the same tab invalidate each other’s scan sessions: use one at a time.

If a problem persists, report the browser version, supported control type and a minimal fictional reproduction. Never attach a real profile export. Compare the [five demo forms](/forms/event/) and [benchmark methodology](/benchmarks/) before assuming compatibility with a new site.
