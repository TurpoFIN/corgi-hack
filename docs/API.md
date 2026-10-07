# Free SF Agent API

Instinct, Muse, Grok, and other HTTP agents can operate the same task queue, profile, notebook, and itinerary as the app. In **Your profile → Connect your agent**, choose **Copy agent setup** once. It creates a bearer key and copies the connection instructions. No separate account is required.

## Connect

Local base URL: `http://localhost:5173/api/v1`. Send `Authorization: Bearer YOUR_KEY` on every data/action request. `/openapi.json` is public and describes the complete interface.

A remote agent needs an HTTPS gateway forwarding `/api/v1` to this server. Localhost is reachable only on this computer. Publish only the agent API path; the owner UI and other `/api` routes stay private. Gateway provisioning is not included.

The key grants access to this user's tasks, profile, notes, and plans. Keep it in the agent's secret storage. It is stored locally in ignored `data/` with owner-only permissions, separately from provider credentials.

## Queue work

```sh
# Set FREE_SF_API_KEY privately from the copied setup.
export FREE_SF_BASE=http://localhost:5173/api/v1
curl "$FREE_SF_BASE/tasks" \
  -H "Authorization: Bearer $FREE_SF_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: tomorrow-workout-001" \
  -d '{"text":"Find a free workout and shower near home tomorrow morning."}'
```

Returns 202 with a task `id`, `Location`, and `Retry-After`. Tasks queue even while Scout is busy. Reuse the same idempotency key for retries of the same text; different text with that key returns 409. Poll `GET /tasks/{id}` every 2–5 seconds.

Task states: `queued`, `running`, `needs_input`, `completed`, `paused`, `failed`, `cancelled`. A task includes `question`, prior `answers`, `result`, `opportunities`, `activity`, and `missionId` when available. Results and source evidence remain on the task even after older mission history is retired.

When `needs_input`, the agent can answer using its own context:

```json
POST /tasks/{id}/answer
{"answer":"Swimming after 5 pm"}
```

`question.choices` contains suggested options; free text is always accepted. Other queued tasks continue while one waits for an answer. A human is not required to submit an answer. An answered task rejoins the queue.

`PATCH /tasks/queue` with `{"paused":true}` pauses scheduling and requests active work to stop. `{"paused":false}` resumes paused tasks and drains the queue. `POST /tasks/{id}/cancel` cancels one task; `POST /tasks/{id}/retry` requeues failed, paused, or cancelled work. A retry respects an explicitly paused queue.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/status` | Agent availability, queue pause state, model, profile readiness |
| GET, POST | `/tasks` | List tasks and queue state; add a to-do |
| GET | `/tasks/{id}` | Task result, clarification, activity and sources |
| POST | `/tasks/{id}/answer` | Supply choice or free-text input |
| POST | `/tasks/{id}/retry` | Requeue stopped or failed work |
| POST | `/tasks/{id}/cancel` | Cancel a task |
| GET, PATCH | `/tasks/queue` | Read or change the queue pause state |
| GET, PATCH | `/profile` | Read or update settings; updates sync the VM notebook |
| GET | `/day-plan` | Scheduled itinerary, sources, alternatives and removed IDs |
| POST | `/day-plan/{id}/remove` | Remove a scheduled visit |
| POST | `/day-plan/{id}/restore` | Restore a removed visit if still eligible |
| GET | `/plans` | Underlying offers, benefits and booking job history |
| POST | `/plans/{id}/remove` | Remove an underlying plan |
| POST | `/plans/{id}/restore` | Requeue an underlying plan |
| POST | `/plans/resume` | Continue arranging the latest search results |
| GET | `/memory` | Read Agent37 `PROFILE.md` and `NOTES.md` |
| PUT | `/memory/notes` | Replace `NOTES.md` with `{"notes":"markdown"}` |
| POST | `/memory/sync` | Retry syncing saved profile to the VM |
| GET, POST | `/connections` | Read provider connections or request an authorization URL |
| GET | `/calendar.ics` | Export the itinerary as calendar entries |
| POST | `/missions` | Start an immediate mission with `{"instruction":"..."}` |
| GET | `/missions/{id}` | Read mission status, activity and researched offers |
| POST | `/missions/{id}/cancel` | Request a mission stop |

URL-encode path IDs. Profile and notebook writes return 409 during active work: pause the queue and wait for `active:false` before updating, then resume. `PROFILE.md` derives from `/profile`; edit it through that endpoint. Notes writes are read back from Agent37 before success is returned. Updating name, email, or address resets personal plans; other preferences preserve them.

Use tasks for normal asynchronous work. Immediate missions return 409 when busy and retain the latest 30 mission/idempotency records. Both use the same Agent37 computer. Reading `/tasks` or `/status` is enough to detect a paused queue without opening the UI.

`POST /connections` accepts `{"toolkit":"googlecalendar"}` or `{"toolkit":"gmail"}` and returns the provider's authorization URL. The provider controls account consent; a URL alone does not establish a connection. Calendar export does not automatically write into Google Calendar.

Internal plan readiness and provider confirmation are separate. Check `provider_confirmation` before claiming a provider issued a reservation. Actual provider authentication, verification, and paid checkout requirements still apply. The API does not expose provider credentials or accept payment-card details.
