# LatentBridge Recruitment Tracker

A single-user web app for logging daily recruiter submissions and interviews (internal and vendor-sourced), and pulling management-ready reports and Excel exports.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Prisma 7 + PostgreSQL (via the `pg` driver adapter)
- Password-gated (single shared password, no user accounts) — built for one person entering data during the evening standup
- Excel export via `exceljs`

## Data model

- **Recruiters** — your roster
- **Vendors** — staffing partners who submit candidates
- **Roles** — open positions submissions/interviews are tracked against
- **Activities** — one row per submission or interview: date, recruiter, role, type (Submission/Interview), source (Internal/Vendor + which vendor), optional notes

## Local development

1. Copy `.env.example` to `.env` and fill in a local Postgres `DATABASE_URL`, an `APP_PASSWORD`, and a `SESSION_SECRET`.
2. Install dependencies and apply the schema:
   ```bash
   npm install
   npx prisma migrate dev
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Sign in at `/login` with `APP_PASSWORD`.

## Deploying to Vercel

The build does **not** connect to the database (all data pages render on
demand), so deploys are robust even on serverless. You create the tables once,
directly in your database.

1. Push this repo to GitHub and import it into Vercel.
2. Create a Postgres database (Supabase, Neon, Vercel Postgres, etc.).
3. **Create the tables once**: open your database's SQL editor (in Supabase:
   **SQL Editor → New query**), paste the contents of [`prisma/setup.sql`](prisma/setup.sql),
   and run it. That's the whole schema.
4. In Vercel's **Settings → Environment Variables**, set these for the
   **Production** environment (and Preview if you want preview deploys):
   - `DATABASE_URL` — your database connection string (for Supabase, use the
     **transaction pooler**, port `6543`, which is IPv4 and works from Vercel)
   - `APP_PASSWORD` — the password you'll use to sign in
   - `SESSION_SECRET` — any long random string
   - `DIRECT_URL` *(optional)* — a direct/session-pooler connection string, only
     needed if you later run `npm run db:migrate:deploy` from your own machine
5. Set the Vercel **Build Command** to `npm run vercel-build`.
6. Deploy, then open the site and sign in with `APP_PASSWORD`.

> **Supabase note:** use the **pooler** hostnames (`...pooler.supabase.com`), not
> the direct `db.<ref>.supabase.co` host — the latter is IPv6-only and Vercel
> can't reach it. Make sure the project isn't paused.

### Changing the schema later

Because migrations don't run during the build, if the data model changes you
apply the update once to your database — either by running
`npm run db:migrate:deploy` locally (with `DIRECT_URL` pointing at a direct
connection) or by running the new migration's SQL in your database's SQL editor.

## Day-to-day usage

1. **Recruiters / Vendors / Roles** — add these once, keep them updated as your roster/vendor list/open roles change.
2. **Daily Entry** — during the evening standup, pick the date (defaults to today), and for each recruiter add a row per submission or interview: role, and whether it's internal or from a vendor (pick the vendor). The panel on the right shows a running summary per recruiter as you go.
3. **Reports** — filter by date range, see stats by recruiter, by vendor, by role, and download a formatted Excel workbook to share with management.
