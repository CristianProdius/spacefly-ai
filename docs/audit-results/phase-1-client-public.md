# Phase 1 Client Public Experience Audit Results

## Checks Run
- `pnpm install --frozen-lockfile --offline`: pass after the first `pnpm --filter client check-types` could not start because `tsc` was missing in this worktree. Install completed in 13s with the known Prisma postinstall warning about no default schema path.
- `pnpm --filter client check-types`: pass. `tsc --noEmit` completed with exit code 0 after fixes.
- `pnpm --filter client build`: pass. `next build` completed with exit code 0. Warnings remain for multiple lockfiles, module type of `apps/client/eslint.config.js`, unused variables, hook dependency warnings, `no-explicit-any`, `ProfileButton` using `<img>`, and a few existing lint warnings.
- `pnpm --filter client dev`: failed on port 3002. First sandboxed run failed with `listen EPERM 0.0.0.0:3002`; approved rerun then failed with `EADDRINUSE :::3002`.
- `pnpm --filter client exec next dev --turbopack --port 3012`: pass. Dev server started at `http://localhost:3012`.
- `curl -sS -I http://localhost:3012/`: pass. Returned `200 OK` and middleware rewrite to `/ro`.
- `curl -sS -I http://localhost:3012/spaces`: pass. Returned `200 OK` and middleware rewrite to `/ro/spaces`.
- `curl -sS -I 'http://localhost:3012/login?redirect=/spaces/123'`: pass. Returned `200 OK` and middleware rewrite to `/ro/login?redirect=%2Fspaces%2F123`.
- `curl -sS http://localhost:3012/spaces`: pass as a degraded runtime smoke check. With product service unavailable, `/spaces` renders the localized empty state; before the config fix it logged `Failed to parse URL from undefined/spaces...`, after the fix it logs a normal `fetch failed`.

## Fixes Applied
- `apps/client/src/lib/config.ts`: added a shared `PRODUCT_SERVICE_URL` fallback matching the existing taxonomy fallback.
- `apps/client/src/lib/taxonomy.server.ts`: reused the shared product service URL.
- `apps/client/src/components/SpaceList.tsx`: fixed public listing fetches so missing `NEXT_PUBLIC_PRODUCT_SERVICE_URL` no longer generates `undefined/spaces`.
- `apps/client/src/components/SpaceListBrowse.tsx`: fixed load-more and map fetch URLs to use the shared product service URL.
- `apps/client/src/components/FeaturedSpaceCard.tsx`: fixed featured space fetch URL fallback.
- `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`: fixed space detail fetch URL fallback.
- `apps/client/src/app/[locale]/(main)/spaces/[id]/ReviewSection.tsx`: fixed review fetch URL fallback.
- `apps/client/src/app/[locale]/(auth)/login/page.tsx`: preserved a safe local `redirect` query parameter after successful login so booking entry can return users to the requested space/checkout flow.
- `apps/client/src/app/[locale]/(auth)/register/page.tsx`: preserved a safe local `redirect` query parameter after successful registration.
- `apps/client/src/stores/authStore.ts`: changed session-expiry redirect from `/${locale}/login?...` to `/login?...`, matching the app's `localePrefix: "never"` routing.

## Findings
- `P2` Browse API failures are shown as an empty result set
  - Area: Public browse and landing space lists.
  - Evidence: `SpaceList.fetchSpaces` catches failed product-service requests and returns `{ spaces: [], pagination: ... }`. Runtime smoke at `http://localhost:3012/spaces` with product service unavailable rendered "Nu s-au gasit spatii..." while the server logged `Error fetching spaces: TypeError: fetch failed`.
  - Reproduction: Stop or omit product service, start client on port 3012, then request `/spaces`. The customer sees a no-results state rather than an error/retry state.
  - Recommendation: Return an explicit error flag from server fetches and render a localized "could not load spaces" state with retry guidance, while keeping true empty search results distinct.

- `P2` Space detail API failures are treated as not-found listings
  - Area: Public space detail page.
  - Evidence: `getSpace` returns `null` for both non-OK responses and fetch exceptions, then `SpaceDetailPage` calls `notFound()`. This makes product-service downtime indistinguishable from a real missing listing.
  - Reproduction: Stop or omit product service, then request `/spaces/<id>`.
  - Recommendation: Split 404/not-found from transient fetch failures and render a localized detail-load error state for service failures.

- `P3` Toggle controls expose state visually but not semantically
  - Area: Browse list/map toggle and booking hourly/daily toggle.
  - Evidence: The controls are plain buttons with active styling, but no `aria-pressed` or equivalent state announcement.
  - Reproduction: Inspect `SpaceListBrowse` list/map buttons or `BookingForm` hourly/daily buttons with a screen reader.
  - Recommendation: Add `aria-pressed` to toggle buttons and keep visible styling unchanged.

- `P3` Build/dev reproducibility is noisy because Next detects multiple lockfiles
  - Area: Client build and dev startup.
  - Evidence: `next build` and `next dev` warned that Next selected `/Users/cristian/Development/spacefly-ai/pnpm-lock.yaml` and also found `.worktrees/phase-1-client-public/pnpm-lock.yaml`.
  - Reproduction: Run `pnpm --filter client build` or `pnpm --filter client dev` inside this worktree.
  - Recommendation: Normalize worktree lockfile expectations or configure Next output tracing root to avoid misleading lockfile selection warnings during parallel audits.

## Follow-Up Recommendations
- Add explicit API failure states for public browse and space detail before production launch.
- Add focused accessibility improvements for toggle state announcements and icon-only controls where labels are missing.
- Add a small integration/smoke test for unauthenticated booking start: click/request booking, redirect to login, authenticate, and return to the intended path.
- Clean up existing client lint warnings in a separate lint-hardening branch.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `apps/client/package.json`
- `apps/client/src/app/[locale]/layout.tsx`
- `apps/client/src/app/[locale]/(main)/layout.tsx`
- `apps/client/src/app/[locale]/(main)/page.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/page.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/[id]/ReviewSection.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/[id]/LocationMapLoader.tsx`
- `apps/client/src/app/[locale]/(auth)/layout.tsx`
- `apps/client/src/app/[locale]/(auth)/login/page.tsx`
- `apps/client/src/app/[locale]/(auth)/register/page.tsx`
- `apps/client/src/components/AuthProvider.tsx`
- `apps/client/src/components/DatePicker.tsx`
- `apps/client/src/components/FeaturedSpaceCard.tsx`
- `apps/client/src/components/Footer.tsx`
- `apps/client/src/components/HeroSearch.tsx`
- `apps/client/src/components/ImageGallery.tsx`
- `apps/client/src/components/LanguageSwitcher.tsx`
- `apps/client/src/components/ProfileButton.tsx`
- `apps/client/src/components/SpaceCard.tsx`
- `apps/client/src/components/SpaceCategories.tsx`
- `apps/client/src/components/SpaceFilter.tsx`
- `apps/client/src/components/SpaceList.tsx`
- `apps/client/src/components/SpaceListBrowse.tsx`
- `apps/client/src/components/SpaceMap.tsx`
- `apps/client/src/components/YouTubeEmbed.tsx`
- `apps/client/src/components/hero/HeroMapFade.tsx`
- `apps/client/src/components/landing/FAQ.tsx`
- `apps/client/src/components/landing/HostCTA.tsx`
- `apps/client/src/components/landing/HowItWorks.tsx`
- `apps/client/src/components/navbar/MobileMenu.tsx`
- `apps/client/src/components/navbar/NavbarV4.tsx`
- `apps/client/src/lib/apiClient.ts`
- `apps/client/src/lib/auth.ts`
- `apps/client/src/lib/currency.ts`
- `apps/client/src/lib/taxonomy.server.ts`
- `apps/client/src/lib/taxonomy.ts`
- `apps/client/src/lib/utils.ts`
- `apps/client/src/i18n/navigation.ts`
- `apps/client/src/i18n/request.ts`
- `apps/client/src/i18n/routing.ts`
- `apps/client/src/middleware.ts`
- `apps/client/messages/en.json`
- `apps/client/messages/ro.json`
- `apps/client/messages/ru.json`
