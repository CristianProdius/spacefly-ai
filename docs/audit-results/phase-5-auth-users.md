# Phase 5 Auth, Users, and Security Boundaries Audit Results

## Checks Run
- `pnpm --filter auth-service check-types`: fail before install; `tsc: command not found` and `node_modules missing` in this worktree.
- `pnpm --filter @repo/auth-middleware typecheck`: fail before install; `tsc: command not found` and `node_modules missing` in this worktree.
- `pnpm install --frozen-lockfile --offline`: pass; reused offline store, installed 858 packages. Prisma postinstall warned that no default schema was found, which is expected for this workspace layout.
- `pnpm --filter auth-service check-types`: pass; `tsc --noEmit` completed with exit code 0.
- `pnpm --filter @repo/auth-middleware typecheck`: pass; `tsc --noEmit` completed with exit code 0.

## Fixes Applied
- `apps/auth-service/src/routes/auth.route.ts`: constrained logout session deletion to `{ token: refreshToken, userId: req.userId }` so an authenticated user can only revoke their own submitted refresh-token session.

## Findings
- `P1` Self-service host promotion bypasses the host verification boundary
  - Area: `apps/auth-service/src/routes/auth.route.ts`, `packages/auth-middleware/src/express.ts`, product-service host routes.
  - Evidence: `/auth/become-host` sets `role: "HOST"` and `hostVerified: false`, then returns a fresh token pair signed with the new `HOST` role. The shared `shouldBeHost` and `shouldBeHostOrAdmin` middleware only checks the JWT `role` claim and never checks `hostVerified`. Product-service host-only routes such as `POST /spaces`, `POST /venues`, and `POST /uploads/images` use those role-only guards.
  - Reproduction: Register/login as a normal user. Call `POST /auth/become-host` with that user's access token. Use the returned access token against `POST /venues`, `POST /spaces`, or `POST /uploads/images`. The route middleware will accept the token because the role is `HOST`, even though the user record still has `hostVerified: false`.
  - Recommendation: Decide the intended product boundary first. If admin verification is required before host capabilities, keep pending hosts out of the `HOST` role or add a server-side verified-host authorization check that reads trusted user state before allowing host management actions.

- `P2` Login and registration lack brute-force/rate-limit and password policy controls
  - Area: `apps/auth-service/src/routes/auth.route.ts`, `packages/auth-middleware/src/password.ts`.
  - Evidence: `/auth/login` accepts unlimited password attempts for an email and `/auth/register` only checks presence of email, username, and password. Password hashing uses bcrypt, but there is no minimum length/complexity check, no account throttling, no IP/user rate limiting, and no normalization of email/username before uniqueness checks.
  - Reproduction: Repeatedly call `POST /auth/login` for the same email with different passwords; the route performs a password comparison and returns `401` each time without backoff or lockout. Call `POST /auth/register` with any non-empty password string and it proceeds to hashing/user creation if unique.
  - Recommendation: Add centralized rate limiting for auth endpoints, minimal password length policy, email normalization, and abuse logging. Do this as a deliberate auth hardening change with tests.

- `P2` Admin app route middleware is a no-op and trusts client-side auth state for page gating
  - Area: `apps/admin/src/middleware.ts`, `apps/admin/src/stores/authStore.ts`.
  - Evidence: admin middleware always returns `NextResponse.next()`. The admin store initializes `isAdmin`/`isHost` from localStorage user JSON and token presence without checking token expiry or fetching `/auth/me`. Backend APIs still enforce JWT role checks, so this is not the primary data boundary, but page gating can be spoofed or stale.
  - Reproduction: Put a fake `admin_user` with role `ADMIN` and any `admin_accessToken` into localStorage, then load an admin route. The page-level client checks treat the browser as authenticated/admin until an API call fails.
  - Recommendation: Add server/edge route gating where feasible, and make admin initialization validate token expiry and/or load current user state from the auth service before setting role flags.

- `P2` Refresh-token lifetime defaults are inconsistent between JWTs and session records
  - Area: `packages/auth-middleware/src/jwt.ts`, `apps/auth-service/src/routes/auth.route.ts`.
  - Evidence: refresh JWTs default to `7d`, but login/register session rows default to `30d` when `JWT_REFRESH_EXPIRES_IN` is unset. The shorter JWT expiry wins in practice, leaving session rows valid longer than the token can be verified.
  - Reproduction: Run auth-service without `JWT_REFRESH_EXPIRES_IN`. Register or login. The refresh token is signed with the package default of seven days, while the stored `Session.expiresAt` is calculated with a thirty-day default.
  - Recommendation: Use one shared refresh-expiry default/source for both token signing and session persistence, and add a focused regression test.

- `P3` Admin user-management role inputs are inconsistently validated
  - Area: `apps/auth-service/src/routes/user.route.ts`.
  - Evidence: `PUT /users/:id/role` validates role against `USER`, `HOST`, and `ADMIN`, but `POST /users`, `PUT /users/:id`, and `GET /users?role=` pass role values directly to Prisma or cast them with `as any`. Invalid values can produce 500s instead of 400s.
  - Reproduction: As an admin, call `POST /users` or `PUT /users/:id` with `role: "OWNER"`, or `GET /users?role=OWNER`. The route does not reject the value before Prisma handles it.
  - Recommendation: Reuse one role parser/validator across all user-management endpoints.

## Follow-Up Recommendations
- First fix the host verification boundary, because it decides whether `HOST` means approved host or pending applicant.
- Add auth-service route tests before deeper auth changes; this package currently has type checks but no local test runner/tests.
- Add login/register abuse controls and input normalization.
- Make admin/client auth initialization resilient to expired, stale, or malformed localStorage data.
- Align refresh-token JWT and session expiry defaults.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `apps/auth-service/package.json`
- `apps/auth-service/src/index.ts`
- `apps/auth-service/src/routes/auth.route.ts`
- `apps/auth-service/src/routes/user.route.ts`
- `apps/auth-service/src/middleware/authMiddleware.ts`
- `apps/auth-service/src/utils/kafka.ts`
- `packages/auth-middleware/src/express.ts`
- `packages/auth-middleware/src/fastify.ts`
- `packages/auth-middleware/src/hono.ts`
- `packages/auth-middleware/src/index.ts`
- `packages/auth-middleware/src/jwt.ts`
- `packages/auth-middleware/src/password.ts`
- `packages/auth-middleware/src/types.ts`
- `apps/client/src/stores/authStore.ts`
- `apps/client/src/lib/auth.ts`
- `apps/client/src/lib/apiClient.ts`
- `apps/client/src/middleware.ts`
- `apps/client/src/app/[locale]/(main)/become-host/page.tsx`
- `apps/admin/src/stores/authStore.ts`
- `apps/admin/src/lib/auth.ts`
- `apps/admin/src/middleware.ts`
- `apps/admin/src/app/(dashboard)/admin/users/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/users/data-table.tsx`
- `apps/admin/src/components/AddUser.tsx`
- `apps/product-service/src/routes/space.route.ts`
- `apps/product-service/src/routes/venue.route.ts`
- `apps/product-service/src/routes/upload.route.ts`
- `packages/db/prisma/schema.prisma`
