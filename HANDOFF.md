# Continuation context

## Product direction

The product is an autonomous life concierge, not a marketplace. The main interaction is profile setup followed by one instruction to take care of the user's week. The main screen presents an organized week and personal pass cards. Research and source details belong behind those cards or in activity, rather than dominating the experience.

Keep food and subscription offers in scope alongside events and fitness. A headline discount does not establish a free checkout total. Preserve source URLs, prices, conditions, and renewal information. Profile fields are editable; never hardcode a user's identity into source.

## Main code paths

- `src/Concierge.jsx`: application shell, profile setup, provider handoff, live desktop, activity, and account connections.
- `server/concierge.js`: application state, live discovery orchestration, booking queue, provider execution, and API routes.
- `server/bookings.js`: booking records, permitted state transitions, and calendar serialization.
- `server/agent37.js`: Agent37 control/runtime clients and exact model selection.
- `server/insforge.js`: official SDK access to the durable application document.
- `infra/agent37-desktop/`: desktop container and entrypoint.
- `infra/insforge-schema.sql`: required database table.

The application polls `/api/concierge`. Booking jobs retain the source offer and a profile snapshot. Removal updates the stored job, and workers check the current state before progressing. Restoring a removed job queues it for the next planning pass. Source URLs prevent repeated research from creating duplicate jobs.

## Operational facts

Live Agent37 research and visible-browser access have been exercised. Source-backed events and fitness offers were returned by the pinned GPT-6.1 Sol model and stored in local InsForge. Internal booking states must not be used as proof of provider-issued admission or account activation. End-to-end provider checkout acceptance remains separate work.

Known provider handoffs encountered during development: existing-account login at ClassPass, missing phone details at fitness and meal providers, additional profile fields on event registration forms, and a meal-provider page error. Do not overwrite those outcomes with a generic success state.

Calendar export creates tentative personal events and does not imply Google Calendar OAuth is connected. OAuth endpoints exist for Gmail and Google Calendar; an authenticated user must finish the connection. Payment details belong on the merchant's own page inside the persistent browser, not in app storage.

## Local state and release

This repository intentionally contains no API keys, private profile data, Agent37 instance identity, browser receipts, or local InsForge credentials. A fresh checkout needs the setup in README.md. Existing configured workspaces should preserve `.env.local`, `.insforge/`, and `data/`.

Use `npm test` and `npm run build`, then verify the actual local UI. A build does not establish that a provider accepted a registration. Preserve the exact model requirement: `openai/gpt-6.1-sol`.

## Benefit context

Discovery results carry `benefitSummary`, `benefits` (icon, label, source evidence), and `benefitCaveat`. `src/BenefitContext.jsx` renders concise summaries and icons on event rows, pass cards, and offers under review. Eligibility, renewal, and other caveats appear only in detail views. Keep card text minimal; do not add explanatory or cautionary paragraphs back to the main interface. Preserve source-backed inclusions: free entry does not imply free food. `server/benefits.js` validates supported icon names and field lengths. To enrich older records with reviewed context, stop the local app and run `node scripts/enrich-offers.mjs path/to/reviewed-benefits.json`; it backs up the document before updating both research results and booking snapshots.

## Profile ownership

`src/ProfilePage.jsx` is the single profile editor. `server/profile.js` validates interests, preferred times, distance, and existing signup fields and serializes the app-owned `PROFILE.md`. `syncProfileMemory` writes the profile to Agent37, preserves existing `NOTES.md`, and checks exact Markdown readback before recording success. Saving is disabled while a mission or another sync is running. Discovery and provider runs read both files. The notebook viewer reads files from the VM; do not substitute generated local text for that readback. The app has one user-facing flow and no mode switch.

## Other agents

`server/bot-api.js` mounts the bearer-authenticated `/api/v1` router before the local UI origin guard. All operations delegate to `conciergeApi` in `server/concierge.js`; do not create a separate planning engine. `server/api-access.js` stores the dedicated API key in ignored owner-only runtime storage. `src/BotAccess.jsx` provides one-click connection instructions. Preserve idempotency and the single-active-mission guard. Remote cloud bots require an HTTPS gateway restricted to `/api/v1`; none is provisioned by this repository.

Partial profile updates must pass through `mergeProfilePatch`: only explicitly supplied fields may change. Do not spread parsed partial-schema defaults over existing profiles.

## Calendar view

`src/CalendarPage.jsx` shows ready, dated booking records in a Pacific-time week view. `src/calendar-links.js` creates Google event-template links; the user saves those in Google. Unknown end times use a clearly described, editable one-hour planning block. This is not automatic Google synchronization. Existing account connection controls initiate Google OAuth. Do not present a local plan or an opened event form as a saved Google event.
