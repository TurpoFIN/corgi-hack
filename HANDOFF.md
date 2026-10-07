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
