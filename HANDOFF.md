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

`server/bot-api.js` mounts the bearer-authenticated `/api/v1` router before the local UI origin guard. All operations delegate to `conciergeApi` in `server/concierge.js`; do not create a separate planning engine. `server/api-access.js` stores the dedicated API key in ignored owner-only runtime storage. `src/BotAccess.jsx` provides one-click connection instructions. Preserve idempotency and the single-active-mission guard. Remote cloud bots can use `npm run expose:api`, which starts an API-only loopback proxy and Cloudflare HTTPS tunnel. The URL is emitted and briefly cached in ignored public/agent-endpoint.json for the one-paste UI. It changes on restart and requires the computer and app to remain online.

Partial profile updates must pass through `mergeProfilePatch`: only explicitly supplied fields may change. Do not spread parsed partial-schema defaults over existing profiles.

## Calendar view

`src/CalendarPage.jsx` shows the next seven days plus a selected-day itinerary. `server/day-plan.js` combines dated events and researched planned visits. It preserves event conflicts as alternatives, allows travel buffers, and uses a source-verified one-day gym pass only once. Repeated meal-service and library filler has been removed. The consumer-offer policy excludes assistance-service records retained in history. New results can include `plannedVisit` with opening-hours evidence. Google event-template links and ICS export create personal calendar entries; they do not establish provider admission or automatic Google synchronization.


## Task inbox

`server/tasks.js` defines task inputs and inline clarification questions. The same persisted InsForge document holds the queue and answers. `drainTaskQueue` serializes real Agent37 runs; a question pauses only that task, and other queued tasks may continue. Running tasks become paused on restart. `src/TaskList.jsx` stays compact: input, vertically stacked rounded task bubbles (one per row), static outline circles that become filled checkmarks, and right-side status badges only on unfinished tasks. Recently completed bubbles lead with the benefit/result, source venue/time facts and a next-action link; the original request and full research stay under Details. Per-task dismiss and Clear recent persist dismissedAt without changing completed status or the daily count. Undo restores visibility; do not add redundant Done badges. Do not reintroduce a large introduction or guidance paragraphs.

## Monid tools

`server/monid.js` reads `MONID_API_KEY` from the process or `hsec get MONID_API_KEY` before each mission; override the vault name with `MONID_HSEC_NAME`. No restart is needed after adding the vault entry. The private credential and Python client are installed on the Agent37 VM, outside Git and the profile document. The agent discovers and inspects tools before calling them for public search or scraping. `server/monid-vm.py` rejects unknown/variable pricing and reserves the quoted fixed per-call cost before dispatch, with at most five runs, $0.10 per call and $0.25 per mission. It records run IDs and provider status; the app records safe metadata only. Live search calls from the Agent37 VM were verified on October 7: keenable and litescrape returned COMPLETED with provider HTTP 200. Credentials are read from hsec monid or MONID_API_KEY; do not infer successful execution from configuration alone.

## Application layout

`src/workspace.css` provides the app shell with a sticky page header inside the content area containing the brand, page title, horizontal view selector, action buttons and profile. There is no separate full-width top navbar. The overview starts with the compact task inbox and `AgendaOverview` upcoming itinerary, plus agent status and controls. Saved offers are expandable below the agenda. Clicking a scheduled stop opens that stop in Calendar. Keep operational content first; do not bring back the slogan hero, decorative offer cards, or promotional footer.

## Research text and recovery

`benefitCaveat` is detail text, so its complete content is accepted without a card-length limit. Keep type, price and date validation intact. A failed task with retained search evidence can replay its saved response through the current parser on Retry, without another model/search run. Recovery records `recoveredFrom`; the original raw response remains in private runtime storage. Schema failures show a concise task error and save diagnostic issues privately under `data/discovery`.

## Repeat menu and result actions

The task composer's + opens `SchedulePicker`: one time, daily, weekdays, weekly, monthly, with Pacific time and applicable day inputs. `server/recurrence.js` calculates occurrences; the local server's 30-second tick queues independent tasks and coalesces downtime. This requires the local server process; it is not an Agent37 cron. The repeating-task disclosure can pause/resume future runs, including when the latest result is dismissed.

Completed task bubbles lead with a concrete benefit, then compact cost/time/place/benefit chips and a next-action chip/link. Full original prompts and research stay under Details. Keep them stacked vertically, not a two-column grid; no Done badges or task spinners. `completedTaskCard` derives displayed steps from preserved source data and never equates local readiness with provider admission.

## Source intelligence and consumer-perk focus
The product targets hosted food/drinks at Luma and Partiful events, consumer rewards, meal-kit offers, fitness passes and coworking trials. Assistance-service providers were removed from the source map; the calendar no longer fabricates a full week through repeated meal-service or library visits. `consumerOpportunity` excludes retained assistance-service offers from the itinerary and saved-offer view.

`server/source-map.js` contains 134 research routes in 10 categories, independent-provider routing, per-site verification targets and evidence-derived coverage. Each live Agent37 mission receives SOURCE_MAP.json and SEARCH_PLAN.json. A no-match first pass with insufficient provider breadth gets one bounded continuation; raw first-pass evidence is retained. Counts distinguish targeted searches from page requests and do not equate catalog membership with a verified offer. The collapsed source-map panel is searchable by category. Source health can be rechecked with `node scripts/check-sources.mjs`; an HTTP response is not proof of a free offer.

Supabase stores only the source catalog and public offer observations in the private `scout_catalog` schema. The server retrieves prior observations for later searches; InsForge continues to own the personal profile, tasks and plans. Configure SUPABASE_PROJECT_REF or local data/supabase-config.json. The server reads the PAT from hsec `supabase-corgi-hack`. Monid reads hsec `monid` (or MONID_API_KEY); its fixed-call price parser follows the live nested amount.value/currency schema. Neither key goes to the browser or repository.

## Public agent access and interrupted research
`server/api-gateway.js` only forwards `/api/v1/*` and preserves bearer/idempotency headers. Public tests verified guide/schema access, authenticated status/source reads, task creation and cancellation; owner routes and private files return404. The tunnel process is independent of the app. No permanent hosting or migration was performed.

An Agent37 instance-quota error can resume the failed task using its previous session and source trace after allowance is restored. Failure missions remain in history. Three dollars of one-time instance headroom were added after the original allowance was exhausted; no wallet purchase or recurring cap was set.

Completed task-card labels now follow the matching booking job: Registered for ready events, Pass ready for ready trials, and specific approval/waitlist states where indicated. Discovery alone remains Found; queued or removed jobs keep their own status. These UI arrangement states do not populate the separate provider_confirmation API field.

## Deal value
Every new discovery asks GPT-6.1 to assign a positive whole-dollar `valueUsd`. This is distinct from `priceToday` and pricing evidence. The shared `DealValue` component renders a compact gem badge on task outcomes, saved offers, agenda rows and calendar entries/details. Values are persisted with the offer and returned through the existing agent API. Existing records were valued by Agent37 and updated across booking/task/mission copies through the owner-only deal-values endpoint. Preserve one value per offer URL when enriching duplicates.

Recent completions can be collapsed with the section heading; the browser remembers the choice in localStorage without changing task data. The persistent header displays total value of unique ready consumer offers, excluding removed/expired items. `src/deal-value.js` owns the sum, so repeated appearances of a deal in tasks/calendar do not multiply it. The responsive header keeps the existing actions and profile access.
