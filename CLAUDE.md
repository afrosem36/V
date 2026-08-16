@AGENTS.md

# Vshape — personal V-shape physique training PWA

Local-first Next.js (App Router) PWA. No backend, no server DB — IndexedDB (via Dexie) is the source of truth, so the app works fully offline by design. Deployed to Vercel purely as a static/app host; user data never leaves the device except via manual JSON/CSV export.

## Architecture
- `src/types/domain.ts` — all domain types (Exercise, WorkoutSession, ExerciseSet, etc.)
- `src/lib/db/db.ts` — Dexie schema. Bump `.version(n)` for any index/shape change; `.where("field")` requires that exact field to be indexed or Dexie throws at runtime (silently breaks whatever `useLiveQuery` call hits it — check this first if a page gets stuck on "Loading…").
- `src/lib/db/seed/` — exercise library, equipment list, default weekly program. Seeded once on first run (`ensureSeeded`).
- `src/lib/db/repo/` — all reads/writes go through here, never touch `db` directly from components.
- `src/lib/engine/` — pure functions, no I/O: progression algorithm (`progression.ts`), weight/plate math, PR detection, time-budget trimming, calibration/return-after-break logic. Unit-testable in isolation.
- `src/lib/hooks/useActiveWorkoutSession.ts` — the core reactive query joining program + equipment substitution + last performance + prescription for the active workout screen.
- `src/store/active-workout-store.ts` — zustand, ephemeral only (rest timer, current exercise index within a page load). Actual workout data always lives in Dexie so a refresh mid-workout is recoverable — the active-workout page recomputes resume position from logged sets, not from this store.
- No auth. Single user, single device (Phase 1).

## Known constraints / decisions
- Exercise weight is always logged in kg (Indian gym plates are kg-labeled); the kg/lb unit setting only affects body-weight display.
- `NumberStepper`'s optional `suffix` needs real horizontal room — avoid it in 3-column (or narrower) grids; several settings fields were broken this way until fixed (see git history / past bugs).
- Apple HealthKit cannot be read from a browser. Steps/weight are manual-entry in Phase 1; a native Swift companion is the planned Phase 2 bridge, writing into the same repo-layer tables.
- Turbopack is Next 16's default bundler for both dev and build — `@serwist/next`'s webpack-based service worker plugin doesn't support it, so the PWA service worker (`public/sw.js`) is hand-written instead (network-first for navigations, cache-first for `/_next/static` and `/icons`).

## Testing
No automated test suite yet. Verify UI changes with the `agent-browser` skill against `npm run dev`, emulating an iPhone viewport (`set device "iPhone 14"`) — several real bugs (stuck "Log Set" button from a missing React `key`, a missing Dexie index silently breaking History/Summary PR queries, layout overlap in dense NumberStepper grids) were only caught this way, not by `npm run build` or TypeScript.

