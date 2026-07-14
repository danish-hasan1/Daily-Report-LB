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

1. Push this repo to GitHub and import it into Vercel.
2. Add a Postgres database (Vercel Postgres / Neon integration, or any Postgres you control) and set these environment variables in Vercel:
   - `DATABASE_URL`
   - `APP_PASSWORD` — the password you'll use to sign in
   - `SESSION_SECRET` — any long random string
3. Set the Vercel **Build Command** to `npm run vercel-build` (this generates the Prisma client, applies migrations, then builds — so the database schema is always in sync with what you deploy).
4. Deploy. Visit the site and sign in with `APP_PASSWORD`.

## Day-to-day usage

1. **Recruiters / Vendors / Roles** — add these once, keep them updated as your roster/vendor list/open roles change.
2. **Daily Entry** — during the evening standup, pick the date (defaults to today), and for each recruiter add a row per submission or interview: role, and whether it's internal or from a vendor (pick the vendor). The panel on the right shows a running summary per recruiter as you go.
3. **Reports** — filter by date range, see stats by recruiter, by vendor, by role, and download a formatted Excel workbook to share with management.
