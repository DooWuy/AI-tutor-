# S1-US1 — Admin account management contract

## API

All account management endpoints require authenticated `ROLE_ADMIN` at the server. User DTOs never include credentials, password hashes or setup tokens. Student/Teacher requests return 403; unauthenticated/expired access returns 401 through the application security chain.

### Search

`GET /api/v1/users/accounts?role=TEACHER&active=false&search=teacher&page=1&size=20&sort=createdAt&direction=desc`

- Optional role: ADMIN, TEACHER, STUDENT; optional active: true/false.
- Search matches name, email and username, case insensitive. Blank means no search.
- Non-deleted accounts only. Server filters the complete dataset before pagination.
- Page is 1-based, size defaults to 20 and is limited to 1–50.
- Sort allowlist: createdAt, fullName, username, email; direction asc/desc; stable ID tiebreaker.
- Returns `PageResponseDTO<UserResponse>` with content/page/size/totalElements/totalPages.
- Existing `GET /users` is retained for compatibility; the new page uses `/users/accounts` for status filtering and sorting.

### Set state

`PUT /api/v1/users/{userId}/status` (PATCH alias), JSON `{"active":false}`.

`PATCH /api/v1/admin/students/{studentId}/status`, same JSON body.

Both require a non-null boolean. Repeating the same request preserves the intended state. **Breaking contract change:** bodyless PATCH no longer toggles; missing/null/malformed bodies return 400. Frontend student client and Postman requests are updated together. The student path uses studentId; the generic account path uses userId.

Returns `ApiResponse<UserResponse>` or the existing student status DTO. Unknown/deleted ID: 404. Removing the last active Admin: 409. Confirmation remains open and displays the server message on failure.

### Deletion and role changes

Existing DELETE is soft delete and preserves profiles/history. Last active Admin cannot be locked or soft deleted. Administrative mutations lock Admin rows in ID order inside a database transaction, then count remaining active/non-deleted Admins. PostgreSQL concurrent-lock and concurrent-delete tests verify the invariant.

Role changes to a different role currently return 409. Changing a discriminator without migrating Student/Teacher profile, assignments and owned history would corrupt the account model. No role-change/create/delete UI is added in S1-US1; Teacher creation is S1-US2. Same-role requests remain harmless.

## Session policy

After a lock/delete transaction commits, the next authentication checks current account state in the database; cached principals cannot extend access, including across application instances. Requests already authorized before the commit may finish. Unlock permits the account to authenticate again; this is access suspension, not permanent token revocation.

- Login uses active/non-deleted account lookup.
- Refresh checks active/non-deleted state before generating any new token.
- HTTP access tokens load authoritative UserDetails and require an enabled, unlocked account.
- Existing STOMP connections recheck the account on inbound frames. Outbound MESSAGE deliveries resolve the session owner through SimpUserRegistry and check the DB, suppressing messages to locked/deleted accounts. Sockets need not close immediately; their access is denied/suppressed while locked.
- This deliberately trades an extra DB read for immediate account-state enforcement. Monitor query load before reintroducing caching; distributed invalidation would be required to preserve this policy.

## Verification and deployment

Backend: `./gradlew test`. Database tests use a disposable pgvector/PostgreSQL 16 Testcontainers instance, apply V1–V8 on a clean DB, and rerun Flyway to verify no pending changes. No new schema migration is needed for S1-US1.

Frontend: `npm run build`, `npm run lint`, `node --test tests/adminUserApi.test.mjs tests/adminStudentApi.test.mjs tests/adminUsersPage.test.mjs`.

Tests cover HTTP RBAC/validation/conflict, real database filtering and last-Admin races, cached-principal revocation, refresh refusal, inbound/outbound WebSocket suspension, and component states/confirmation with jsdom. Component tests are not a substitute for real browser visual QA.

The deployment workflow already runs Backend tests; it now also runs the Admin frontend tests. Generated Swagger includes the new controller routes and AccountStatusRequest schema. Staging deployment, merged commit/remote CI evidence, browser visual QA and PO sign-off must still be recorded before declaring the story Done under SRS 14.2. No remote deployment is performed by these local tests.

### Local results, 02/11/2026

- Full Backend suite: BUILD SUCCESSFUL. Default environment-gated suites remain gated; they are not counted as executed integration checks.
- After removing legacy Java toggle entry points: targeted Admin/account/student/auth/revocation regression suite BUILD SUCCESSFUL, including real PostgreSQL migration/filter/concurrency tests.
- Frontend API and jsdom component tests: 11 passed; production build passed. Lint completes with warnings, including the new page's network-loading state effect; visual browser QA is pending.
- Explicit real broker run with `WEBSOCKET_INTEGRATION=true` and `WEBSOCKET_DIRECT=true`: BUILD SUCCESSFUL, including suspension of delivery to an existing personal subscription. Direct mode still uses real RabbitMQ and a real WebSocket server, but bypasses nginx.
- Default proxy-mode broker run: failed at HTTP WebSocket upgrade through Docker nginx (timeout/status 0) before authorization. Keep this open for staging; do not present direct-mode success as nginx validation.
- Postman collection JSON parses and `git diff --check` reports no whitespace errors in the changes.

Existing transaction rollback on account creation and role-specific profile updates are reused. Role changes to a different type deliberately fail rather than silently orphaning a Teacher/Student profile. No production users or existing seed accounts were altered during these tests; PostgreSQL fixtures run in disposable containers.
