---
layout: ../../layouts/Document.astro
title: How to reuse your details across repetitive web forms
description: A practical approach to reusable profiles, choosing the right information and reviewing what a form actually asks for.
article: true
---

A job application, a workshop registration and a new workspace can all ask for the same familiar details. Retyping them is tedious. Copying a whole personal-information document into every website is a different problem: the form may need only a small part of it, or may be asking about someone else.

A reusable profile helps when it makes selection easier. It should also make the destination clear. The useful unit is not “fill everything.” It is “put this value into this understood field.”

## Start with the details you actually repeat

Create a small profile first: name components, email and phone. Add address details or professional links when you need them. In FormPilot, a full name is derived from first, middle and last name, with an optional override for the form you prefer to use.

There is no reason to include passwords, payment details, government IDs or authentication tokens. FormPilot has no dedicated storage for them and rejects obvious sensitive custom-field labels. That is a guardrail, not a guarantee that free text can never contain a secret. Keep custom fields limited to ordinary information you are comfortable reviewing and sharing.

The phone field is used as entered. Country calling code is separate metadata for forms that ask for it separately. If you normally provide an international phone number, store that complete number in Phone. Postal codes remain flexible text because countries do not share a single format.

## Separate personal and work contexts

A work email can be appropriate on a professional application and inappropriate on a personal registration. Two named profiles make that decision explicit. FormPilot lets you choose an active profile and change the selection in its toolbar popup.

Do not rely on the profile name alone. Look at the values in the suggestions, especially when switching between contexts. Profile edits must be saved before they are used. Changing a saved profile invalidates the current review so the next scan uses current details.

## Inspect the form before filling it

A visible label is useful evidence, but it is not always enough. “Company email” asks for an email address, not a company name. “Name” could refer to a workspace, cardholder or emergency contact. Autocomplete metadata can make a field clearer, although that metadata can also be wrong.

FormPilot’s scan combines these signals and shows an explanation. Strong matches can be selected automatically when the field is empty. Weaker or conflicting matches require your selection. Ambiguous fields may have no reliable match at all.

Use that pause. Read the field on the page, look at the proposed value, then select it if the mapping makes sense. If the form asks about a recipient or emergency contact, your own name might be the wrong information even when the property type is correct.

## Keep existing work intact

You may have already completed some fields manually. FormPilot preserves nonempty values by default. Replacing one requires you to allow replacement and select the field. This makes a reviewed fill useful partway through a form, not just at the beginning.

A dynamic form introduces another wrinkle. Choosing a country can replace the state dropdown and its choices. The safe workflow is to fill country, rescan, then review the new region field. FormPilot does not continue blindly through controls that changed since the scan.

## Make recovery part of the workflow

Review the form after filling. If something is wrong, undo the most recent fill while the review session is still open. FormPilot restores only its changes and skips fields you edited afterward. Undo expires after five minutes or a new scan, so it is a short recovery tool rather than permanent history.

Corrections can be remembered for the exact website, form and field when you opt in. That is useful for a recurring unusual label. It is not permission to apply the same correction to every website with a matching field ID.

Try this sequence with fictional data in the [interactive playground](/demo/), then use the [installation guide](/install/) to test the extension. The practical benefit is fewer repeated keystrokes, with a review step that remains easy to understand.
