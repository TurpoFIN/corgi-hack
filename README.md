# Free SF

Your autonomous San Francisco life assistant. Enter your address and preferences, then let Scout find free events, fitness passes, and everyday offers, organize your week, and keep the details in one place.

Built for the Agent37 hackathon with **Agent37**, **OpenAI GPT-6.1 Sol**, **InsForge**, **Monid**, and **Supabase**.

## Run locally

Requirements: Node.js 22.12+, npm, Docker, an Agent37 API key, and an Agent37 desktop instance.

```sh
npm ci
cp .env.example .env.local
npx @insforge/cli local start --port-app 7130 --port-postgres 55432
npx @insforge/cli db import infra/insforge-schema.sql
npm run dev
```

Set `AGENT37_API_KEY` and `AGENT37_INSTANCE_ID` in `.env.local`. Open **http://localhost:5173** and save your profile. The local InsForge command creates `.insforge/project.json`, which the server uses to connect through the official admin SDK.

The desktop image definition is in `infra/agent37-desktop/`. It extends Agent37 Hermes with visible Chromium, noVNC, and a persistent browser profile. Use an instance built from that image, with HTTP port 6901 exposed through Agent37 signed URLs. The controller API remains on the standard Agent37 instance endpoint.

For the controller's browser capture helper, initialize this environment once inside the Agent37 instance:

```sh
python3 -m venv /home/node/free-sf/capture-venv
/home/node/free-sf/capture-venv/bin/pip install playwright
```

Chromium runs in the desktop image and is accessed over CDP; no additional browser download is needed.

## Application flow

1. Open **Your profile** to save your interests, preferred times and distance, food preferences, contact details, and spending limit.
2. Select **Take care of my week**. Scout searches the live web through Agent37 and reads actual source pages.
3. Follow progress in the app or open the live Agent37 computer.
4. Eligible offers enter a persistent booking queue: queued, preparing, booking, ready. Pause and resume without losing the queue.
5. Open event and pass cards for concrete benefit summaries, illustrated inclusions, important conditions, source links, and job history. Remove a plan or restore it later.
6. Open **Calendar** to view ready events by week. **Add to Google Calendar** opens a prefilled event for the user to save; **Export plans** downloads the calendar file. Entries are personal plans with tentative status. A Google Calendar connection requires the account owner’s authorization; a shared viewing link alone does not grant write access.

Offer prices and eligibility come from the source. Paid or unverified offers remain under review. Internal workflow completion and provider-issued confirmations are separate records. The provider workflow supports secure handoff for login, verification, payment details, and consent.

## Profile and notebook

The profile is stored in InsForge. Each save syncs `PROFILE.md` and `profile.json` to `/home/node/free-sf/` on the Agent37 computer and verifies the Markdown by reading it back. The app owns these settings. `NOTES.md` is created once and preserved for the agent’s dated observations. **Open notebook** reads the actual VM files.

Discovery and provider workflows sync and read the notebook before starting. A failed sync remains visible with a retry action; it is never presented as successful. Changes to interests and preferences preserve existing plans.

## Connect another agent

Open **Your profile → Connect your agent → Copy agent setup**. One click creates the local API key and copies the base URL, authentication, and usage instructions. No signup or OAuth is needed for this API. It serves the same profile, notebook, missions, and plans as the app.

The versioned interface is `/api/v1`; its machine-readable contract is `/api/v1/openapi.json`. See [API documentation](docs/API.md) for endpoints, idempotent requests, and connecting a cloud agent through an HTTPS gateway.

## Infrastructure

- **Agent37:** persistent cloud computer, browser tools, live research, signed desktop access, and optional scheduled provider workflows.
- **OpenAI:** exact `openai/gpt-6.1-sol` model, with no silent fallback.
- **InsForge:** profiles, activity, research, booking jobs, and provider outcomes stored in the `free_sf_documents` table, with RLS enabled.
- **Monid:** Scout discovers and calls paid search and webpage-extraction tools from its Agent37 computer during live research. One connection provides access to multiple tool providers.
- **Supabase:** shared source memory in the private `scout_catalog` schema. Stores the 134-source directory and public offer observations so future missions can reuse research; personal profiles and task history stay in InsForge.
- **React + Vite:** interactive application and live state updates.
- **Express:** server-only credentials, provider calls, queue management, and calendar export.

### Monid and Supabase setup

For Monid, set `MONID_API_KEY` in `.env.local`, or keep the key in `hsec` under `monid` (`MONID_HSEC_NAME` overrides the entry name).

For Supabase, set `SUPABASE_PROJECT_REF` and provide a management access token through `SUPABASE_ACCESS_TOKEN` or the `hsec` entry `supabase-corgi-hack` (`SUPABASE_HSEC_NAME` overrides it). The server provisions and updates the private catalog through the Supabase management API. Credentials stay server-side and out of Git.

## Development

```sh
npm test
npm run build
npm start
```

`npm start` serves the built app. The default listener is `127.0.0.1:5173`. Tests cover scheduling, parsing, provider outcome contracts, booking transitions, cancellation, and calendar serialization.

Secrets, linked InsForge credentials, personal profiles, screenshots, receipts, and runtime state are excluded from Git. See `HANDOFF.md` for continuation context.
