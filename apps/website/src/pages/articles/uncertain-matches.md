---
layout: ../../layouts/Document.astro
title: Why uncertain field matches should require review
description: An explained abstention can be a better outcome than a confident-looking mistake. How FormPilot makes uncertainty visible.
article: true
---

A field labelled “Email address” gives an autofill tool a useful clue. A field labelled “Name” is less specific. It could ask for a person, a company, an account or a project. Treating both labels as equally clear makes an interface simpler at the cost of hiding a meaningful difference.

FormPilot is built around the review step. Its first release uses deterministic semantic rules, not an LLM. The rules combine standard autocomplete tokens, labels, accessibility text, names, IDs, placeholders, input types and section context. Those signals are helpful, but none is a universal guarantee.

## Confidence categories describe evidence

High confidence means the engine found strong, compatible evidence for a property. Needs review means a proposal rests on weaker clues or carries a contextual concern or conflict. No reliable match means the engine did not find enough evidence for a useful proposal.

These labels are not probabilities. “High confidence” does not mean a measured 99% chance of correctness on any website. A synthetic benchmark can measure results on its own cases, but it cannot calibrate the category for every language, site design or form library.

The interface therefore shows a reason alongside the proposed property and value. A user can see whether the engine relied on an autocomplete token, visible text, accessibility metadata, a weak placeholder, or a remembered correction.

## A correct property can still be the wrong person

Consider two address sections: shipping and billing. Both may contain “City,” “Country” and “Street address.” Mapping City to the city property is semantically reasonable, yet filling the same profile into both sections may be wrong.

FormPilot marks billing and shipping address proposals for review. Emergency-contact and reference contexts also raise a warning. These rules acknowledge that a property match does not settle whose details the form needs.

The same distinction applies to remembered corrections. A mapping saved on one origin does not become a global rule for an element ID. FormPilot includes form and field fingerprints, semantic metadata and section context, and ignores stale mappings. Indistinguishable duplicates do not receive remembered matches.

## Abstention is a product behavior

Leaving a field untouched is sometimes the best available action. A blank suggestion says, “The evidence does not justify an automatic choice.” It keeps the remaining decision visible instead of burying an incorrect value in a completed-looking form.

The difficult demo includes ambiguous labels and fields with little useful metadata. Expected abstentions are labelled in the fixture data and treated as correct outcomes in evaluation. Sensitive fields have a separate excluded category and cannot be overridden through the normal review controls.

This separation matters for measurement. A matcher that guesses at every eligible field may have high coverage and poor precision. One that never proposes anything can avoid incorrect proposals while providing little help. Reporting both coverage and precision, along with abstentions and high-confidence errors, makes that tradeoff visible.

## Selection should reflect uncertainty

FormPilot selects strong matches automatically only when the field is empty, the profile has a value and a select has a compatible option. A needs-review proposal is never automatically selected. Changing a mapping clears its selection so the user must confirm the new choice.

Existing values have another protection: allow replacement, then select the field. That makes an overwrite explicit. It also reduces the chance that reviewing a suggestion accidentally erases work the user already did.

The review is not the end of validation. At fill time, the controller checks that each live element still has the same semantics, options and value as it did at scan time. A country dropdown can change the rest of an address form. A fresh scan is a clearer response than continuing with stale assumptions.

## Publish the mistakes, too

The [measured benchmark](/benchmarks/) keeps incorrect outcomes visible. In the initial evaluation, a conflicting autocomplete signal produced an incorrect proposal that was marked for review. The warning matters to the workflow, but the proposal still counts as an error in precision.

That is the engineering stance behind a review-before-fill browser extension: make useful suggestions, explain their basis, and leave uncertain decisions where the user can see them. Try the [difficult demo](/forms/difficult/) to see abstention, existing-value protection and exclusions in context.
