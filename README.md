# Vshape

A personal training PWA built around one goal: a V-shaped physique (wider shoulders/lats, developed upper chest, strong arms and legs, lower waist over time). Local-first — all data lives in IndexedDB on your device, nothing is sent to a server.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On an iPhone, open the same URL in Safari (once deployed to a real HTTPS URL — see below) and use Share → Add to Home Screen to install it as an app.

## Deploy (so it's installable on your phone)

PWA install and offline caching require HTTPS, so this needs to be deployed somewhere rather than just run on localhost:

```bash
npm i -g vercel   # once
vercel            # follow the prompts, links this folder to a Vercel project
vercel --prod     # deploy to your production URL
```

No environment variables or database to configure — it's a static/client app.

## What's here

- The weekly program, exercise library, and equipment defaults are seeded on first run (`src/lib/db/seed/`) and are all editable in-app (Plan tab, Settings tab).
- The progression engine (`src/lib/engine/progression.ts`) is what decides next session's suggested weight/reps — see `CLAUDE.md` for the architecture notes.
- Export a full backup any time from Settings → Backup & Export (JSON for restore, CSV for a spreadsheet view of your set history).

## Phase 2 (not built yet)

Apple Health can't be read from a browser. Steps and body weight are manual entry for now; a small native iOS companion reading HealthKit and writing into the same data layer is the intended next step, without needing to rebuild this app.
