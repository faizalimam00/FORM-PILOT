# Unpublished launch drafts

These drafts use the public FormPilot repository and local-demo instructions. There is no hosted demo yet. Do not send or publish these drafts without explicit authorization. Check each destination’s rules and current product verification first.

## GitHub release announcement

FormPilot 0.1 is a local-first Chromium extension for reusing your details across repetitive forms. Save personal/work profiles and click Fill form in the toolbar popup. Empty high-confidence matches fill together; optional corrections and Undo stay in the popup.

It uses deterministic semantic matching—no account, backend or AI API. Native inputs, textareas and selects are supported; frames, shadow-root controls and custom dropdowns are outside this release. It never submits forms.

Start with the local fictional demo and unpacked installation guide: https://github.com/faizalimam00/FORM-PILOT#try-it-locally

The repository includes real extension tests and a reproducible synthetic benchmark with its limitations and errors: https://github.com/faizalimam00/FORM-PILOT

## LinkedIn post

I’ve been building FormPilot, a small browser extension for a familiar task: typing the same details into another form.

The interesting part was keeping the decision visible. FormPilot saves a local profile, explains its field matches and asks you to select uncertain suggestions. Its Fill form button fills empty high-confidence matches and never submits. Optional review handles uncertain mappings; Undo works while the popup stays open.

Version one uses deterministic rules, not an AI service. The repository includes five controlled forms, extension tests and a benchmark that reports abstentions and mistakes alongside correct matches.

Run the fictional-data playground locally without installing the browser extension: https://github.com/faizalimam00/FORM-PILOT#try-it-locally

Code and limitations: https://github.com/faizalimam00/FORM-PILOT

Built by Faizal Imam. I’ll share practical fixes and the engineering decisions as the project develops.

## Developer-community post

Title: Building a local-first form filler with explicit review and guarded undo

I built FormPilot to explore a narrow workflow: reuse a personal profile while keeping every fill reviewable.

The stack is WXT/MV3, TypeScript, React and a browser-independent matcher. It uses activeTab + scripting instead of persistent all-site access. Profiles stay in trusted extension storage; the content script receives only selected fill values.

Two implementation details were particularly useful: binding random field tokens to live elements and semantic snapshots, and tracking post-fill input/change revisions so undo can skip later edits. Country-dependent dropdowns still require a rescan, and the docs say so.

There are five fictional demo forms and separate unit, DOM and packaged-extension Chromium tests. The synthetic benchmark publishes its denominators, abstentions and failures; it is not a universal compatibility claim.

Local demo instructions: https://github.com/faizalimam00/FORM-PILOT#try-it-locally · Source: https://github.com/faizalimam00/FORM-PILOT

If you have a minimal fictional example of a native form control this mishandles, a reproducible issue would be useful. Please do not share real profile exports. Posted only where project sharing and feedback requests are permitted.

## 60-second demonstration script

- **0–8 s:** Show the actual local profile editor with Alex Morgan’s fictional data. “These are the details I keep retyping. FormPilot saves a reusable profile in this browser.”
- **8–16 s:** Open event registration and the toolbar popup. “I choose my profile and click Fill form. No new page opens.”
- **16–27 s:** Show the filled form and popup results. “Confident matches fill together. Existing values and uncertain fields stay untouched.”
- **27–36 s:** Click Undo while the popup remains open. “I can reverse this fill here. Closing the popup clears Undo.”
- **36–45 s:** Choose Review fields & corrections and expand an explanation. “I can inspect suggestions or correct a mapping in this same popup.”
- **45–53 s:** Show difficult demo exclusions and the limitations page. “Native controls are supported. Frames and custom dropdowns aren’t supported in this release.”
- **53–60 s:** Show github.com/faizalimam00/FORM-PILOT. “Run the fictional-data playground locally. The code, tests and measured benchmark are open to inspect.”

Capture each action from the working app. Do not simulate a successful interaction or place real personal details in the recording.

## Five technical content ideas

1. Moving form filling into the toolbar popup: one-click filling, optional review and explicit undo lifetime.
2. The Chrome sender.tab assumption a real extension test caught, and how exact extension-page URL validation fixes it.
3. “Company email” and “account name”: token-aware matching and abstention in a small pure TypeScript engine.
4. Filling React-controlled fields, then detecting a country-dependent control replacement before the next mutation.
5. Undo as a conditional restore: values, semantic fingerprints and edit revisions, with the silent-programmatic-edit limitation.
