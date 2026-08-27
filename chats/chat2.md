# Build-out, deployment, and admin expansion

_Continues from chat1.md (the original design prototype). This session took the `.dc.html` design and turned it into the real, deployed, production Next.js app at **inquew.com**. Written as a handoff for whichever Claude session picks this up next._

---

## What exists today

**A live, production site**, deployed on Vercel from `github.com/INQHub/inquew-website` (branch `main`), reachable at `inquew.com` (and `inquew-website.vercel.app`). Stripe is in **live mode** — this is a real business accepting real payments, not a demo.

**Stack**: Next.js 16 (App Router, TypeScript), Prisma + Supabase Postgres, Supabase Storage (private buckets, signed URLs only), NextAuth v5 (Credentials provider), Stripe Payment Element, OpenAI Whisper (transcription), Anthropic Claude (AI problem-statement drafting). All real vendor accounts are connected and funded — nothing is running on the "not configured" fallback paths anymore.

**Read `SETUP.md` first** — it's kept current and documents every env var, every admin panel section, and the deliberate departures from the original mockup. Don't duplicate that content here; this file is about *what happened* and *what to watch for*, not a reference doc.

## What this session built, in order

1. **The full production app from scratch** — every route, the Prisma schema, the 21-item catalog seeded verbatim from the `.dc.html`, the video-intake pipeline, Stripe checkout, the client dashboard, and the full admin panel (deliverables, orders, intakes, users, engagement/KPIs).
2. **Wired in real credentials** for Supabase, Stripe, OpenAI, and Anthropic (previously all scaffolded but unconfigured).
3. **Deployed it**: pushed to GitHub (required linking the user's GitHub account + installing the Claude GitHub App at the `INQHub` org level — plain PAT pushes don't satisfy this session's git proxy), imported into Vercel, attached the `inquew.com` domain, configured the Stripe live webhook, created the two Supabase Storage buckets (`intake-videos`, `deliverable-files`).
4. **Loaded production data**: hand-generated SQL (schema DDL + seed INSERTs) since this sandbox cannot reach Supabase's Postgres port directly — the user ran it themselves via the Supabase SQL Editor.
5. **Post-launch admin expansion** (this is the bulk of the session, all shipped and live):
   - **Admin → Messages**: inbox for `/contact` form submissions, unhandled/handled/all filter.
   - **Consultant sign-off**: each order line can be signed off by the admin who did the work — "Sign off as Kenny I." (first name + last initial), timestamped, undoable. Foundation for attributing work once there's more than one consultant.
   - **Login tracking**: `User.lastLoginAt`, shown in Admin → Users.
   - **Self-service password change**: `/admin/account` and `/dashboard/account`, both wired through one shared `ChangePasswordForm` component and one `/api/account/change-password` route.
   - **Direct admin/team account creation**: Admin → Users → "+ New admin". No public admin signup exists by design — an existing admin creates the account, a one-time temp password is shown once on screen, and the new account is **locked to the account page** (enforced in `proxy.ts` via a `mustChangePassword` flag) until they set their own password. Session refresh on password change uses NextAuth's `jwt` callback `trigger === "update"` path, not a re-login.
   - **Deleted all demo/seed data from production** (the two demo client accounts, their 5 sample orders, sample intake session, and every `synthetic: true` engagement event) so KPI numbers and the user list now reflect only real activity. The 21-item catalog and the real admin account were left untouched.
6. **A training manual**: `Inquew-Training-Manual.docx`, delivered directly to the user (not committed to the repo — it's a deliverable, not source). Covers the customer-facing flow end to end and every admin-panel workflow, including an order-status glossary and a task quick-reference table.

## Known gaps / open threads — check these before assuming they're done

- **No order notification exists.** `lib/email.ts` is still a stub that only `console.log`s — nothing pages the admin when an order comes in. The user explicitly deferred building this ("I'll keep it as is for now and check the system manually") but it's the single most likely next ask. If asked, the earlier offer was: real email via a provider like Resend, or a Slack incoming webhook.
- **A duplicate Vercel project** (`inquew-website-uerj`) was created during the initial import fumbling and was never cleaned up. Harmless but untidy — worth deleting next time you're in the Vercel dashboard with the user.
- **No white/reversed logo file has ever successfully landed as an actual file**, despite the user attaching it twice. The footer and dashboard/admin sidebars still use the text "INQUEW" wordmark. The user has twice said this is fine to skip — don't chase it again unprompted.
- **`_prisma_migrations` bookkeeping**: the production schema was built via hand-run SQL (not `prisma migrate deploy`) for the very first migration, then via hand-run `ALTER TABLE` SQL for every migration added this session (this sandbox cannot reach Supabase Postgres directly — no way to run Prisma CLI against it). The local `prisma/migrations/` folder is the source of truth for what SQL *should* exist in production; it should match, but the migrations table itself was never reconciled. Non-blocking, but if `prisma migrate deploy` is ever run against production directly, check this first.
- **Real test purchase**: the user was advised to do one small real end-to-end purchase to confirm payment → Stripe webhook → order-flips-to-Paid works in production. Last known status: deferred ("I will test the payments later").

## Working in this sandbox — hard-won lessons, don't relearn these

- **This sandbox cannot reach Supabase Postgres, Stripe, OpenAI, or Vercel APIs directly.** Confirmed repeatedly via `/dev/tcp` tests and `$HTTPS_PROXY/__agentproxy/status`. Any task requiring those needs either (a) the user driving their own browser with your instructions, or (b) hand-written SQL/config handed to the user to run themselves. Don't waste time re-discovering this.
- **Local testing uses a local Postgres 16 cluster** (`pg_ctlcluster 16 main start`, then `sudo -u postgres psql`), *not* production. A local dev database (`inquew_dev`) already exists with leftover test data from earlier sessions — expect to see users/orders you don't recognize; that's fine, it's not production.
- **`prisma migrate dev` cannot run against the production `DATABASE_URL`** — it's a pgbouncer transaction-pooled connection (`?pgbouncer=true`), which doesn't support the shadow-database step. Generate migrations locally against `inquew_dev`, then hand-translate the generated `migration.sql` into a SQL file for the user to run in Supabase's SQL Editor. `npm run db:migrate:deploy` (`prisma migrate deploy`) would work against the pooled connection in principle, but this sandbox can't reach it to run that command directly — so it's manual SQL every time until that changes.
- **NextAuth v5 beta needs `trustHost: true`** in `lib/auth.ts` — without it, local testing against any port other than whatever `NEXTAUTH_URL` says throws `UntrustedHost`. Already fixed; don't remove it.
- **A NEXTAUTH_URL/port mismatch corrupts more than login** — it also corrupts `new URL(path, req.url)` redirect construction *inside `proxy.ts` middleware*, silently sending redirects to the wrong port with no server-side error logged. Only surfaces when middleware actually constructs a redirect (e.g., the `mustChangePassword` bounce). If you're testing locally and redirects seem to vanish into `ERR_CONNECTION_REFUSED`, check `.env`'s `NEXTAUTH_URL` matches the port you're actually serving on. Production is unaffected since `NEXTAUTH_URL=https://inquew.com` always matches the real domain.
- **`.env`'s `NEXTAUTH_URL` should be left at `http://localhost:3000`** between sessions (the user's default `npm run dev` port) — if you temporarily change it for testing on another port, change it back before finishing. It's gitignored, so this only matters for the user's own local dev experience, not for git hygiene.
- **LibreOffice (`soffice`) cannot convert *any* file in this sandbox** — confirmed with a plain `.txt` file, not specific to complex documents. If you need to visually verify a generated `.docx`/`.pptx`, fall back to `python-docx`/`python-pptx` dumping text/table content programmatically, and rely on the skill's XSD `validate.py` for structural correctness. Don't burn time debugging the LibreOffice failure itself.
- **Playwright works fine** (`/opt/pw-browsers/chromium`, globally installed `playwright` package — not a project dependency, so run scripts from `/opt/node22/lib/node_modules/` or set `NODE_PATH`). Prefer explicit `waitForTimeout` after a login submit over `waitForFunction(() => fetch(...))` polling loops — the latter produced consistently flaky false negatives this session (real state was fine; the polling fetch just raced awkwardly with cookie propagation).
- **The `docx` npm package is not preinstalled** despite the skill saying it is — `npm install docx` in the scratchpad directory before requiring it.
- **Stale local dev server processes on a given port often survive a `pkill`** — check `fuser <port>/tcp` and `kill -9` the actual PID directly rather than trusting a pattern-matched `pkill` succeeded; a defunct/zombie process can still hold the port.

## Working with this user (Kenny Isibor)

Kenny is non-technical and drives most external-platform steps (Supabase, Stripe, Vercel, GitHub) himself via screenshots, since this sandbox can't reach those APIs directly. He responds well to: being told exactly what button to click and where; SQL handed to him as a ready-to-paste file via `SendUserFile` rather than described in prose; and being asked before scope expands into something requiring a new decision (e.g. the notification-channel question was asked via `AskUserQuestion`, not assumed). He moves fast and expands scope often mid-task — treat a new ask arriving mid-turn as a real instruction to fold in, not something to defer.
