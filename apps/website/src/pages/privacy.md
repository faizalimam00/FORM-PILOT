---
layout: ../layouts/Document.astro
title: Your details stay with you
description: What FormPilot stores, what a scan reads, and what changes when you fill a website’s form.
---

FormPilot stores your reusable profile on your device and matches fields locally. This policy explains what it reads, what it stores and what happens when you fill a form.

## What is stored

Saved profiles, the active profile ID and opt-in remembered mappings use the browser’s extension-local storage. They are not sent to a sync service. Remembered mappings store the exact origin, field/form metadata and a profile property key. They do not store a duplicate of the profile value. Metadata can itself reveal which kind of form you used, so delete mappings you no longer need.

FormPilot does not encrypt ordinary browser storage. It is not a defense against someone who can access your operating-system account, browser profile, extension debugging tools or a compromised device.

## What a scan reads

After you click Fill form or Review fields & corrections, the extension reads field labels, accessibility metadata, IDs, names, placeholders, autocomplete tokens, section headings and native dropdown options in the top-level document. For eligible controls, it also checks whether a field contains a value. It does not read the values of excluded controls. The isolated content script temporarily retains eligible original values to protect them and support undo; those originals are not sent to the toolbar popup.

The complete profile stays in the trusted extension context. The content script receives only selected fill values and target tokens. No profile matching data is sent to a server. Scans are bounded to 500 controls and expire after 15 minutes. A completed fill discards scan value snapshots and retains only the values needed to undo its changes; another fill requires a rescan. Undo values expire after five minutes, a new scan or fill, closing the toolbar popup, or leaving the document. Expiry is enforced in memory; browser scheduling can delay timer execution in suspended tabs.

## What happens when you fill

Fill form scans and fills empty, high-confidence matches in one action. For a scan without filling, use Review fields & corrections. Uncertain matches and existing values require explicit selection in that review view.

A website can read values entered into its form, including values filled by FormPilot, before you submit. Website scripts may transmit them immediately. Only fill details into sites you trust. FormPilot itself does not submit forms, navigate forward, or make external AI calls.

Passwords, payment fields, government ID prompts, authentication codes and other suspected sensitive controls are excluded conservatively. Detection is heuristic and cannot identify every possible sensitive label. Do not put secrets into custom fields or select personal details for a field whose purpose you do not understand.

## Network activity and analytics

The extension contains no analytics, remote executable code or runtime network client for matching. No personal data is logged. Browser platform updates and a website’s own scripts are outside FormPilot’s control. The local demo and playground have no external submission endpoint and use a fictional sample profile. Please use fictional details in demonstrations.

The FormPilot website includes no tracking scripts or third-party fonts. A web host may process request information such as IP addresses and timestamps when serving pages; that processing is separate from extension profile storage. The extension does not upload your profile to the website.

## Export, import and deletion

Exports are readable JSON files containing all saved profiles and the active selection. They are not encrypted. Store and share them carefully. Import is validated and previewed before you explicitly merge or replace profiles.

Delete individual profiles, remembered mappings or all FormPilot data in settings. Deleting local data does not remove exported files, values already filled into a website, copies you shared, or device backups. Removing the extension normally removes its browser-local data.

## Questions and security reports

The creator is [Faizal Imam (@faizalimam00)](https://github.com/faizalimam00). Follow the repository’s [security reporting policy](https://github.com/faizalimam00/FORM-PILOT/blob/main/SECURITY.md) to arrange a private channel. Request a private reporting channel before sharing security-sensitive details. Do not put personal profiles, exports, tokens or exploit details into public issues. See [limitations](/limitations/) and [the architecture documentation](/docs/) for the technical boundaries.
