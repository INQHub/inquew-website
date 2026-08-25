# Inquew — setup

Next.js (App Router) implementation of the Inquew consulting-deliverables site, built from the Claude Design handoff in `project/`. Real database, real Stripe payments, real video transcription, an admin panel, and engagement/KPI tracking are all wired up — see the env vars below for what's live out of the box vs. what needs your own API keys.

## Stack

- **Next.js 16** + TypeScript + Tailwind CSS
- **Postgres** via **Prisma** (built against Supabase Postgres; any Postgres works)
- **Supabase Storage** for intake videos and delivered files
- **Auth.js (NextAuth v5)** with a Credentials provider (email + password) — no third-party auth vendor
- **Stripe** (Payment Element) for checkout
- **OpenAI Whisper** for video transcription, **Claude (Anthropic API)** for drafting the three problem statements

## 1. Install

```bash
npm install
```

`postinstall` runs `prisma generate` automatically.

## 2. Environment variables

Copy `.env.example` to `.env` and fill in what you have. The app is designed to **run and build with all of these unset** — features that need a specific vendor (transcription, statement drafting, Stripe, file storage) fail gracefully with a clear "not configured" message instead of crashing, so you can demo the rest of the site before wiring everything up.

| Variable | Required for | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Everything (the app has no in-memory fallback) | Supabase → **Connect** button → **Direct Connection** tab → **Transaction pooler** (IPv4-friendly, no add-on needed — plain Direct connection is IPv6-only) → URI. Append `?pgbouncer=true`. |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Login/sessions | `NEXTAUTH_SECRET`: `openssl rand -base64 32` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Video/file storage (intake recordings, delivered files) | Supabase → Project Settings → **API Keys** (not the General settings page). Use the **Secret** key (`sb_secret_...`) — it's server-only, never expose it with a `NEXT_PUBLIC_` prefix. The **Publishable** key (`sb_publishable_...`) goes in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; unused by the app today but harmless to set. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout | Stripe Dashboard → Developers → API keys / Webhooks. Point the webhook at `/api/stripe/webhook`, subscribed to `payment_intent.succeeded` and `payment_intent.payment_failed`. |
| `OPENAI_API_KEY` | Video → transcript | platform.openai.com |
| `ANTHROPIC_API_KEY` | Transcript → 3 problem statements + recommended deliverables | console.anthropic.com. Without this, a lower-quality deterministic fallback runs instead so the intake flow still completes. |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `CLIENT_SEED_PASSWORD` | `npm run db:seed` only | Whatever you want the first admin/demo login to be |

### Supabase storage buckets

Create two **private** buckets before file uploads will work: `intake-videos` and `deliverable-files` (names come from `lib/supabase.ts` → `BUCKETS`). The app only ever accesses them through short-lived signed URLs generated server-side with the service role key — nothing is public.

## 3. Database

```bash
npm run db:migrate:deploy   # applies the committed prisma/migrations as-is (use this against Supabase)
npm run db:seed             # 21 deliverables, a demo admin + 2 clients, sample orders, a sample intake, synthetic engagement events
```

`db:migrate` (`prisma migrate dev`) is for iterating on the schema locally — it creates a shadow database, which doesn't work through a pgbouncer transaction-pooled connection. Use `db:migrate:deploy` (`prisma migrate deploy`, no shadow DB) against Supabase; `db:push` also works against a pooled connection if you want a quick throwaway sync without migration history.

Seeded logins (passwords from `.env`, defaults in `.env.example` — change before anything public):
- Admin: `ADMIN_SEED_EMAIL` → `/admin`
- Client: `jane@okaforfab.com` → `/dashboard`

## 4. Run

```bash
npm run dev      # http://localhost:3000
npm run build && npm run start   # production build
```

## 5. Admin panel (`/admin`, requires an ADMIN-role account)

- **Deliverables** — typed edit form per item, plus a raw-JSON editor toggle for direct field edits; new-item form for adding to the catalog.
- **Orders** — change status/progress, adjust edit credits used per line, upload finished files (goes to Supabase Storage, appears immediately in the client's Downloads tab). Each order line also has a **sign-off**: the admin who worked the deliverable clicks "Sign off as {First L.}" (e.g. "Kenny I.") to attribute it to themselves, timestamped; undoable. As more staff accounts are added, this becomes the record of who did what.
- **Intakes** — read transcripts, regenerate AI problem statements, attach a video manually (for clients who used the no-AI "manual path" and had a phone/video call instead).
- **Users** — change role (client/admin) or deactivate an account. Shows each user's last login time (recorded automatically on every sign-in), useful once there's more than one staff account.
- **Engagement** — funnel view over 7/30/90 days, CSV/JSON export of raw events, and CSV/JSON import of externally-generated test results for comparison.
- **Messages** — inbox for `/contact` form submissions, with an unhandled/handled/all filter and a per-message mark-handled toggle.
- **Account** — change your own password. Do this immediately if you're still on a seeded default.

`npm run test:engagement -- --days=14 --volume=1` generates additional synthetic engagement events (marked `synthetic: true`) for load-testing that funnel view without touching real traffic data.

## 6. What's a deliberate departure from the Claude Design mockup

1. **Checkout payment fields** are Stripe's Payment Element, not the mockup's raw card-number/expiry/CVC text inputs — collecting raw card data yourself is a PCI violation, full stop.
2. **Deliverable detail** is a real route (`/deliverables/[slug]`) that also opens as a modal-over-grid when navigated to from within the app (Next.js intercepting routes) — same look as the mockup, but linkable/shareable.
3. **Video recording** uses real `getUserMedia` + `MediaRecorder` (with a permission-denied fallback to file upload) instead of the mockup's simulated countdown box.
4. Product images are still the mockup's striped placeholder + keyword label — no real photography exists yet. Set `imageUrl` on a `Deliverable` (admin → raw JSON editor) once you have real assets; the placeholder component isn't wired to read it yet, so that's a small follow-up when photography is ready.
5. Outbound email (order confirmations, delivery notices) is stubbed to a console log in `lib/email.ts` — no provider was chosen. Swap the body of `sendEmail()` for Resend/Postmark/SES; every call site already goes through that one function.
6. The footer/dashboard sidebar wordmark is still text ("INQUEW"), not a logo image — no reversed/white logo file was provided. Drop one into `public/assets/` and swap it into `SiteFooter`/`DashboardSidebar`/`AdminSidebar` when you have it.
