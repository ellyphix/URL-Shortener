# URL Shortener

A small full-stack application that turns a long HTTP(S) URL into a short link. Opening the short link sends visitors to the saved destination. No account is needed.

## Stack and structure

- **Frontend:** React, TypeScript, Vite, responsive CSS in `artifacts/url-shortener/`
- **Backend:** Node.js, Express, TypeScript in `artifacts/api-server/`
- **Database:** PostgreSQL and Prisma; model in `artifacts/api-server/prisma/schema.prisma`
- **Contract:** `lib/api-spec/openapi.yaml` generates the frontend API client and backend validation schemas.

This is a pnpm monorepo with separate frontend and backend applications. The browser sends `POST /api/urls` to the Express service on the same origin. The API writes to PostgreSQL with Prisma, then returns the short link. No database credential is sent to the browser.

## Database

Prisma maps `Url` to the PostgreSQL `urls` table:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | auto-incrementing primary key |
| `short_code` | string | unique, required |
| `original_url` | text | required |
| `created_at` | timestamp | required; defaults to current time |

## API

### `POST /api/urls`

Body: `{"originalUrl":"https://example.com/very/long/url"}`.

On success (`201`), responds with `{"shortUrl":"https://your-domain/abc1234","shortCode":"abc1234","originalUrl":"https://example.com/very/long/url"}`. Empty or invalid URLs return `400`; exceeding ten creation requests per IP in an hour returns `429`. The simple in-memory limit resets one hour after the first request in each window (and also resets when the API server restarts). Each server process has its own counter.

### `GET /:shortCode`

The short URL opens the React route, which looks up the code using `GET /api/urls/:shortCode` and navigates to the saved URL. Serve frontend paths (including `/:shortCode`) as SPA routes and send `/api` to Express. The Express server also implements a direct `GET /:shortCode` handler for standalone backend use. Unknown codes return `404` from the API and show a simple not-found message in the browser.

## Run

Use Node.js 22.9 or later and pnpm. Supply a PostgreSQL `DATABASE_URL` for the backend — either put it in `artifacts/api-server/.env` (git-ignored; loaded by the API server and by Prisma's CLI) or export it in the shell:

1. Install dependencies with `pnpm install`.
2. Apply the schema: `pnpm --filter @workspace/api-server run db:push`.
3. Start the backend: `PORT=8080 pnpm --filter @workspace/api-server run dev`.
4. In another terminal, start the frontend: `pnpm --filter @workspace/url-shortener run dev`. Vite uses port 5173 by default and proxies `/api` to port 8080. Set `API_DEV_URL` if the API uses a different local address.
5. Open `http://localhost:5173`.

To check a production build, run `pnpm run typecheck`, `pnpm run build`, and `pnpm --filter @workspace/api-server run test`. Optionally set `PUBLIC_BASE_URL` to the public origin for stable generated links. Never put a real database connection string in frontend environment variables. Prisma's CLI reads the backend model and `DATABASE_URL`; apply the schema to a production PostgreSQL database as part of deployment.

## Safety

The backend requires explicit HTTP(S), rejects credentials embedded in URLs, limits URL length and creation requests to ten per IP per hour, and stores links through Prisma instead of interpolating SQL. It never fetches the destination URL. Seven-character alphanumeric codes are generated with a cryptographic random number generator, protected by a unique database constraint, and retried on collisions. Cross-origin browser access is not enabled; errors do not return stack traces or database details. Only visual placeholders labeled “Advertisement” are shown; no advertising network is connected.