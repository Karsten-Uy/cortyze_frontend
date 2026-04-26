# cortyze_frontend

Sample Next.js 16 frontend for [BrainScore](../cortyze_product/IMPLEMENTATION_PLAN.md). One page with a goal selector + URL input that hits the backend's `/analyze` endpoint and renders the `BrainReport` (overall score + 8 region bars).

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- Turbopack (default dev server)

## Local dev

**1. Make sure the backend is running** (in another terminal):

```bash
cd ../cortyze_product
./scripts/dev_minio.sh start          # if not already up
uv run uvicorn api.main:app --reload  # backend on :8000
```

**2. Install + start the frontend:**

```bash
npm install      # only first time
npm run dev      # Next.js on :3000
```

Open <http://localhost:3000>, fill in a video URL, click **Run BrainScore**. The mock backend returns deterministic synthetic scores; rank order across goals is meaningful (Conversion vs Brand Recall change the overall score noticeably).

## Layout

```
cortyze_frontend/
├── app/
│   ├── layout.tsx        # default Next.js layout (Geist fonts)
│   ├── globals.css       # Tailwind v4 import
│   └── page.tsx          # BrainScore demo (single page)
├── lib/
│   └── api.ts            # typed fetch wrapper for the backend
├── public/               # static assets
├── .env.local            # NEXT_PUBLIC_API_URL (gitignored)
└── package.json
```

## Deploying to Vercel

### One-time setup

1. **Push this repo to GitHub.** This directory already has `.git` initialized:
   ```bash
   git add . && git commit -m "init: BrainScore demo frontend"
   gh repo create cortyze_frontend --private --source . --push
   ```
2. **Sign up at <https://vercel.com>** and connect GitHub.
3. **New Project → Import Git Repository** → pick `cortyze_frontend`.
4. Vercel auto-detects Next.js — accept all defaults.
5. **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = your deployed backend URL (e.g. `https://cortyze-api.fly.dev`)
6. Click **Deploy**. ~60 seconds later you're at `https://cortyze-frontend.vercel.app` (or your custom domain).

### Per-PR previews (free)

Every push to a non-main branch triggers a unique preview URL. Open a PR → Vercel comments the preview link → click → see your changes live before merging.

### Production deploys

Push to `main` → Vercel auto-deploys. No CI to configure.

### Custom domain

Vercel dashboard → Project → Settings → Domains → add `cortyze.com` (or whatever). Vercel handles SSL automatically.

## Cost

- **Free tier (Hobby)** is technically personal-use-only. Fine for demos and the Stage 3 waitlist.
- **Pro tier** ($20/mo per member) is required once Cortyze monetizes — it lifts traffic + bandwidth caps and removes the personal-use restriction.

If you'd rather have $0 commercial-use, see Cloudflare Pages discussion in [IMPLEMENTATION_PLAN.md §11.1](../cortyze_product/IMPLEMENTATION_PLAN.md). Trade-off there is occasional Next.js feature lag.

## Going beyond the demo

The current `app/page.tsx` is intentionally one file (~150 LOC) to keep the integration surface obvious. As Stage 3 / 4 features land:

- **Upload UI** (Stage 3) — replace the URL input with a file picker that POSTs to `/upload-url`, then PUTs the file to the returned R2 presigned URL, then sends `content_url` to `/analyze`. See [IMPLEMENTATION_PLAN.md §5.1](../cortyze_product/IMPLEMENTATION_PLAN.md).
- **Saved report links** (Stage 4) — `app/report/[id]/page.tsx` calls `GET /report/{id}` so users can share scan results.
- **Brain visualization** (Stage 3+) — backend returns a base64 PNG via `tribev2.plotting.PlotBrain`; render with `<img src={`data:image/png;base64,${png}`} />`. Upgrade to a 2D SVG heatmap (~3 days) when ready.
- **Suggestions section** (Stage 2) — `BrainReport` will gain a `suggestions: Suggestion[]` field once Claude integration lands.
- **Auto-generated API types** — instead of hand-rolling types in `lib/api.ts`, run:
  ```bash
  npm install -D openapi-typescript
  npx openapi-typescript http://localhost:8000/openapi.json -o lib/api-types.ts
  ```
  Re-run any time the backend's schemas change. Catches breaking API changes at build time.

## Troubleshooting

- **"Failed to fetch"** in the UI → backend not running. `cd ../cortyze_product && uv run uvicorn api.main:app --reload`
- **CORS errors in browser console** → backend's `FRONTEND_ORIGINS` env var must include `http://localhost:3000` (it does by default).
- **Goal buttons not styled** → Tailwind didn't compile; restart `npm run dev`.

## Note on Next.js 16

This was scaffolded with Next.js 16 (released late 2026). It has breaking changes from Next.js 13/14/15, especially around dynamic route params (now `Promise<...>`). The `app/page.tsx` here is a static page so unaffected, but consult `node_modules/next/dist/docs/01-app/01-getting-started/` before adding dynamic routes or server actions.
