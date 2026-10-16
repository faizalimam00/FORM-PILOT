# Product contract

FormPilot serves people repeating their own details in registration, application, onboarding and address forms. The value event is a reviewed fill that saves retyping while preserving control. Return is driven by another form, not notifications. No tracking is installed.

Promise: **Your details. Your device. Fill with a click. Stay in control.**

The primary journey is create/select profile → invoke toolbar → Fill form → inspect outcomes or undo; optionally review and correct fields inside the same popup. Options contains profiles, import/export and remembered mappings. Website routes cover the product, controlled playground, five form scenarios, installation, workflow, privacy, docs, benchmark, creator, troubleshooting and three articles.

## Architecture and milestones

1. Shared TypeScript/Zod schema and pure matching engine; explicit abstention and exclusions.
2. DOM adapter with live element identities, semantic fingerprints, snapshot validation and guarded undo.
3. WXT MV3: compact direct-fill popup with optional inline review, options editor, extension-local storage. Only activeTab, scripting and storage permissions. No backend.
4. Astro static site with React demo islands; reusable fixture package. No arbitrary-tab access on website.
5. Unit/integration/browser verification, held-out benchmark, real captures, repository and launch material.

The toolbar popup is the complete filling surface. It creates no new window; its temporary scan/undo state ends when the popup closes. V1 targets desktop Chromium. Browser-specific store review and Firefox support are future work.

## Design

Paper #f6f7f2, ink #172e3b, teal #087f72, pale teal #e5f3ee, muted #586a71, border #dce3dc. Dark mode uses ink surfaces and mint accents. System humanist sans-serif stack avoids font network requests. Left-aligned compact controls; editorial product page with a large actual product capture. Use orderly field rows and meaningful status pills, not decorative dashboards. Radius 10px for controls and 18px for product frames. Motion only on control feedback, respecting reduced motion.

## Acceptance and boundaries

See IMPLEMENTATION_CHECKLIST.md and QA_REPORT.md. Existing values default to preserved; uncertainty is never preselected; no submit/navigation. Profiles remain in trusted extension storage. A site can read filled values. Imports are bounded and validated. Unsupported pages fail clearly. Supported controls and platform limits are documented, not concealed. No universal compatibility or calibrated probability claims.

Dependency policy: Node 22 LTS, npm workspaces, TypeScript 5.9, React 19, WXT 0.21, Astro 7, Tailwind 4, Zod 4, Vitest 5 and Playwright; exact resolution in lockfile. Patched Astro 7 requires Node >=22.22.0; a pinned local Node runtime is included. npm is the package-manager deviation: the environment permits its registry access, while pnpm registry access is unavailable. No account, payments, backend, analytics or AI API.
