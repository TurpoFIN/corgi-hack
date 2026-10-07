# Free SF Agent API

Use the same concierge from Instinct, Muse, Grok, or any agent with HTTP tools. In **Your profile → Bring your own bot**, click **Copy agent setup** and paste it into your bot. The app creates the key automatically and includes it with the connection instructions; no signup or OAuth step is required. Import `/api/v1/openapi.json` into clients that support OpenAPI.

## Connect

Base URL for an agent on the same computer: `http://localhost:5173/api/v1`.

A cloud bot cannot reach your computer's localhost. Give it an HTTPS gateway URL that forwards `/api/v1` to this server. Expose only that path, not the private local UI or other `/api` endpoints. This repository does not publish a gateway automatically. The API accepts external gateway hostnames; every data/action request requires the bearer key. The OpenAPI specification is public and contains no user data.

Keep the key in your bot's secret storage. It grants access to this user's profile, notebook, plans, and mission controls. The app stores it privately under ignored `data/` with owner-only file permissions. It is separate from the Agent37 provider key.

```sh
export FREE_SF_BASE=http://localhost:5173/api/v1
# Set FREE_SF_API_KEY from the app; do not commit it.
curl "$FREE_SF_BASE/profile" -H "Authorization: Bearer $FREE_SF_API_KEY"
curl "$FREE_SF_BASE/plans" -H "Authorization: Bearer $FREE_SF_API_KEY"
```

## Start and follow work

```sh
curl "$FREE_SF_BASE/missions" \
  -H "Authorization: Bearer $FREE_SF_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: friday-plan-001" \
  -d '{"instruction":"Find free fitness and something social this weekend near home."}'
```

Returns HTTP 202 with `id`, `status`, and a `Location` header. Poll `GET /missions/{id}` every 2–5 seconds. States are `running`, `booking`, `completed`, `paused`, `interrupted`, or `failed`. Inspect `error` on failure. Read `GET /plans` for the persistent results; the app updates from these same records.

Reuse the same idempotency key when retrying the same instruction. Reusing it with a different instruction returns 409. Starting another mission while one is active also returns 409. The latest 30 missions/idempotency records are retained.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/status` | Current mission, model, profile readiness |
| GET | `/profile` | User's saved settings |
| PATCH | `/profile` | Update selected settings and sync the VM notebook |
| POST | `/missions` | Start asynchronous work |
| GET | `/missions/{id}` | Status, activity, researched offers |
| POST | `/missions/{id}/cancel` | Request a stop |
| GET | `/plans` | Plans, benefits, source offers, and job history |
| POST | `/plans/{id}/remove` | Remove a personal plan |
| POST | `/plans/{id}/restore` | Queue a removed plan for the next planning pass |
| GET | `/memory` | Read `PROFILE.md` and `NOTES.md` from Agent37 |
| GET | `/calendar.ics` | Export ready event plans as tentative calendar entries |

Internal job readiness and provider confirmation are separate. Check `provider_confirmation` before claiming a provider has issued a reservation. Changing name, email, or home address resets the current personal plans. Preference-only updates preserve them. Profile updates are rejected while Scout is working or syncing.

No endpoint exposes a shell, accepts payment-card details, or returns the Agent37 provider credential.
