# Free SF

Your autonomous San Francisco life assistant. Enter your address and preferences, then let Scout find free events, fitness passes, and everyday offers, organize your week, and keep the details in one place.

Built for the Agent37 hackathon with **Agent37**, **OpenAI GPT-6.1 Sol**, and **InsForge**.

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

1. Save your name, contact details, address, preferences, and spending limit.
2. Select **Take care of my week**. Scout searches the live web through Agent37 and reads actual source pages.
3. Follow progress in the app or open the live Agent37 computer.
4. Eligible offers enter a persistent booking queue: queued, preparing, booking, ready. Pause and resume without losing the queue.
5. Open event and pass cards for concrete benefit summaries, illustrated inclusions, important conditions, source links, and job history. Remove a plan or restore it later.
6. Export ready events to a calendar file. Entries are personal plans with tentative status.

Offer prices and eligibility come from the source. Paid or unverified offers remain under review. Internal workflow completion and provider-issued confirmations are separate records. The provider workflow supports secure handoff for login, verification, payment details, and consent.

## Infrastructure

- **Agent37:** persistent cloud computer, browser tools, live research, signed desktop access, and optional scheduled provider workflows.
- **OpenAI:** exact `openai/gpt-6.1-sol` model, with no silent fallback.
- **InsForge:** profiles, activity, research, booking jobs, and provider outcomes stored in the `free_sf_documents` table, with RLS enabled.
- **React + Vite:** interactive application and live state updates.
- **Express:** server-only credentials, provider calls, queue management, and calendar export.

## Development

```sh
npm test
npm run build
npm start
```

`npm start` serves the built app. The default listener is `127.0.0.1:5173`. Tests cover scheduling, parsing, provider outcome contracts, booking transitions, cancellation, and calendar serialization.

Secrets, linked InsForge credentials, personal profiles, screenshots, receipts, and runtime state are excluded from Git. See `HANDOFF.md` for continuation context.
