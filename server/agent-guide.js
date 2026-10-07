// Public operating instructions; never embed user data or credentials here.
export const agentGuide=`# Free SF agent interface

Operate Scout on behalf of the user through HTTP. No browser or human is needed for task management.

## Connect
Use the supplied API base URL (local default http://localhost:5173/api/v1) and Authorization: Bearer YOUR_KEY on every request except /agent.md and /openapi.json. Keep the key in your secret store. A cloud agent needs a reachable HTTPS gateway; localhost refers to the machine running the caller.

1. GET /status, /profile and /tasks for context and outstanding work.
2. GET /sources for the shared source map. Filter with ?category=fitness or ?q=Partiful. These are research routes, not guaranteed available offers.
3. POST /tasks with {"text":"Find a free strength workout near home tomorrow after 5pm"}. Send a unique Idempotency-Key and reuse it for network retries of that exact request.
4. Follow the returned Location; poll GET /tasks/{id} using Retry-After (normally 2 seconds). Read the task status rather than inferring success from HTTP 200.

## Work lifecycle
- queued/running: wait; do not create duplicate tasks.
- needs_input: inspect question.prompt and question.choices. POST /tasks/{id}/answer with {"answer":"..."}. Choices are suggestions; free text is supported. Answer from authorized user context when possible; ask the user only for facts you do not know.
- completed: read result, opportunities and coverage. Completed means the research finished, not that a booking was issued. An empty result is not a city-wide conclusion; coverage lists providers searched/opened and whether the search was limited.
- failed/paused/cancelled: inspect error and existing results. POST /tasks/{id}/retry when appropriate; POST /tasks/{id}/cancel stops unwanted work.

GET /tasks/queue reports global paused state. PATCH /tasks/queue with {"paused":true} stops draining; false resumes it. A retried task still respects the paused queue.

## Recurrence and history
POST /tasks may include "schedule":{"frequency":"weekly","time":"09:00","dayOfWeek":2}. Frequencies: daily, weekdays, weekly, monthly. Weekly uses dayOfWeek 0=Sunday; monthly uses dayOfMonth 1-31. Times are America/Los_Angeles. The first run starts now; future occurrences run while the server is running. Read recurrence.nextRunAt. PATCH /tasks/{id}/schedule with {"enabled":false} pauses future runs; true resumes them. Canceling one occurrence does not stop its repeat schedule.

POST /tasks/dismiss with {"ids":["id"],"dismissed":true} hides completed entries. false restores them. Results remain queryable.

## User context
PATCH /profile updates preferences. Read the Profile schema before writing. Changing name, email or address resets personal plans. During active work profile/notes writes return 409: pause, wait for active:false, update, then resume.
GET /memory reads PROFILE.md and NOTES.md from the persistent Agent37 computer. PUT /memory/notes with {"notes":"markdown"} replaces NOTES.md and verifies the readback. Update PROFILE.md through /profile, not notes. POST /memory/sync retries a profile sync.

## Results and calendar
GET /day-plan provides scheduled items, alternatives, source evidence and removed IDs. POST /day-plan/{id}/remove or /restore changes a visit. GET /plans gives underlying offer/job history; use /plans/{id}/remove or /restore to change a plan. GET /calendar.ics exports calendar entries. Export is not a Google Calendar write. Check provider_confirmation before claiming a reservation. GET /connections lists linked accounts; POST /connections with {"toolkit":"googlecalendar"} or gmail returns the provider authorization URL. The provider controls account consent.

## Errors
400: correct the body using /openapi.json; 401: supply the correct key; 404: refresh the referenced IDs; 409: inspect queue/status or idempotency conflict; 5xx: preserve the original request and idempotency key before retrying. Do not replace missing facts with invented successes.
`;
