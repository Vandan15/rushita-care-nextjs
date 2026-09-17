# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

> The workspace root (`~/Desktop/Work/projects/CLAUDE.md`) routes between ~17 unrelated repos.
> This file is the authority for `rushita-care-nextjs`. Run every command from this directory.

## What this is

**RushitaCare** — a patient-management app for a single physiotherapist. Four features:
patients (CRUD + photo), attendance (present/absent per session, incl. back-dating),
invoices (date-range → session count × rate → Firestore record → downloadable PDF), and
payments (manually recorded amount + date per patient, deliberately independent of invoices —
the admin often takes money without ever generating one).
Next 14 App Router + TypeScript + Tailwind v3 + shadcn/ui + Firebase, originally v0-generated
(`package.json` still says `"name": "my-v0-project"`).

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # next lint
npx tsc --noEmit # the REAL check — see below. Currently clean; keep it that way.
node scripts/create-admin-user.js   # seeds the Firebase Auth user (needs .env admin creds)
```

There is no test suite and no CI. "Verified" means `npm run build` passes **and**
`npx tsc --noEmit` is clean. Don't invent a test command.

### `npm run build` passing does not mean the code compiles

`next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`.
A build will happily succeed with type errors in it. **Always run `npx tsc --noEmit` separately**
after touching TypeScript.

### node_modules is hand-assembled — do not casually reinstall

`node_modules` was built by **pnpm** (`.pnpm/`, `.modules.yaml`) and then *patched by hand*: the
three tracked `install-*-deps.sh` scripts `curl` tarballs straight from the npm registry and
untar them into `node_modules/@react-pdf/*` and friends, because `@react-pdf/renderer`'s tree
would not resolve. Only `pnpm-lock.yaml` is committed; there is no `package-lock.json`, and
**pnpm is not installed on this machine** (the workspace standard is npm, Node 24).

Consequences: the current tree builds, but a bare `npm install` is likely to produce a tree that
doesn't. Don't run install/upgrade commands to "fix" something unless the user asks; if a
`@react-pdf` module goes missing, re-run `./install-react-pdf-deps.sh`, `./install-all-deps.sh`,
`./install-final-deps.sh` (in that order) rather than reinstalling everything.

## Architecture

### One route, hand-rolled navigation

The entire app is `app/page.tsx` — a `"use client"` component. There is exactly one page route,
plus two API routes (`app/api/parse-patient-voice/route.ts`, `app/api/version/route.ts`). Nothing
is server-rendered beyond the shell; there is no `next/navigation`, no nested routes, no URL
state.

```
app/page.tsx      splash → (auth check) → <LoginForm /> | <Dashboard />
components/dashboard.tsx
                  useState<PageType> + a switch = the router
                  <Header /> (title from PageType)   <MobileNavigation /> (sm:hidden)
```

**To add a "page": edit `PageType` in `components/dashboard.tsx`, add a `case` to
`renderCurrentPage()`, add a title case to `components/header.tsx`, and (if it should be reachable
on mobile) add a `navItems` entry in `components/mobile-navigation.tsx`.** Skipping the header or
nav step is how `"invoices"` ended up unreachable — that `PageType` exists in all three switches
but nothing ever sets it; `AllInvoicesPage` is actually rendered inline at the bottom of
`attendance-analytics.tsx`.

### Data layer — components never touch Firestore

All reads/writes live in `lib/`, and components import functions from there:

| File | Owns |
| --- | --- |
| `lib/firebase.ts` | client init + the `isDemoMode` flag; exports `app/auth/db/storage` as **possibly `null`** |
| `lib/auth-service.ts` | `authService` singleton (sign in/out, `onAuthStateChanged`) + `updateUserProfile` (displayName/photo, Storage upload) |
| `lib/firebase-operations.ts` | patients + attendance; patient image upload/delete |
| `lib/invoice-operations.ts` | invoice CRUD + `generateInvoiceNumber()` |
| `lib/payment-operations.ts` | manual payment records (independent of invoices) |
| `lib/user-profile-service.ts` | therapist registration number + address |
| `lib/pdf-generator.tsx` | `generateInvoicePDF` / `previewInvoicePDF` |

Keep it that way — a Firestore import inside `components/` is a bug.

### Every lib function has two branches, and both must work

`isDemoMode` is true when `NEXT_PUBLIC_FIREBASE_API_KEY` is unset (or the project id is
`demo-project`). In that mode the app runs entirely off module-level arrays
(`demoPatients`, `demoAttendance`, `demoInvoices`, `demoUserProfile`) with a hand-written
listener list standing in for `onSnapshot`. Demo login is `doctor@demo.com` / `password123`.

**When you add or change a data function, implement the demo branch too**, in the same shape as
its neighbours: `if (isDemoMode) { …in-memory…; return }`, then `if (!db) throw new Error(…)`,
then the real Firestore call. The `!db` guard is required — `db` is typed `Firestore | null`.

### Firestore shape

| Collection | Doc |
| --- | --- |
| `patients` | `types/patient.ts` → `Patient`; `patientId` is the human id `PT-<ts>-<rand>` |
| `attendance` | `AttendanceRecord` — `{ patientId, status, timestamp }`, one doc per marking |
| `invoices` | `types/invoice.ts` → `Invoice`, with patient + therapist fields **denormalized** for the PDF |
| `invoiceCounters/{year}` | `{ count }`, bumped inside `runTransaction` to mint `INV-YYYY-NNN` |
| `payments` | `types/payment.ts` → `Payment` — a manually recorded payment: `amount`, admin-picked `paidOn`, optional `note` |
| `userProfiles/{uid}` | `types/user-profile.ts` — registration number + address, merged via `setDoc` |

Storage paths: `patient-images/{patientId}-{ts}`, `profile-pictures/{uid}.{ext}`.

Two deliberate choices, don't "optimize" them away:

- **Invoice and payment queries filter only, then sort client-side** (`getPatientInvoices`,
  `getAllInvoices`, `getPatientPayments`, `getAllPayments`).
  This avoids requiring a composite Firestore index; adding `orderBy` to those queries breaks
  them in production until an index is created by hand.
- **Invoice numbers come from a transaction.** Never generate one locally.

### Stale-bundle detection ("New updates available")

`components/update-notifier.tsx` is mounted globally in `app/layout.tsx`. It polls
`/api/version` (every 2 min, plus on `visibilitychange`/`focus`/`online`) and shows a blocking
modal when the id it gets back differs from the one compiled into its own bundle.

**The build id in `next.config.mjs` must be derived from repo state, never from `Date.now()`.**
Next.js evaluates `next.config.mjs` once per compiler pass — client and server are separate
processes — so a timestamp yields a *different* id in each bundle and every user sees the update
modal the instant they load the app. `resolveBuildId()` uses `VERCEL_GIT_COMMIT_SHA`, falls back
to `git rev-parse HEAD`, and finally to the constant `"dev"` (which disables detection rather
than producing false positives). After touching it, verify both halves agree:

```bash
npm run build
SHA=$(git rev-parse HEAD | cut -c1-12)
grep -rl "$SHA" .next/static .next/server/app/api/version   # must list BOTH
```

Because deploys are per-commit, two deploys of the same commit produce the same id and correctly
show no prompt. There is no service worker in this app; the modal's "Refresh Now" clears
`caches` and unregisters any service worker defensively before `location.reload()`.

### Invoices and PDFs

`components/invoice-generation-dialog.tsx` is a 4-step wizard (date range → name/rate → review →
done) that reads attendance via `getPatientAttendance`, filters to the range with `date-fns`, and
bills only `status === "present"` sessions. `components/invoice-pdf-template.tsx` is a
`@react-pdf/renderer` document — **`@react-pdf` must never be imported at module scope.** Both
functions in `lib/pdf-generator.tsx` `await import()` the renderer and the template lazily; that
dynamic import is what keeps it out of SSR. Preserve that pattern.

## Styling

- Tailwind **v3** with a real `tailwind.config.ts`; tokens/CSS live in `app/globals.css`.
- **The shadcn semantic tokens are broken here and the app does not use them.** `globals.css`
  defines `--background: #ffffff` (hex) while `tailwind.config.ts` wraps every token in
  `hsl(var(--…))`, so `bg-background` / `text-foreground` / `border-border` compile to invalid
  CSS. Application code uses raw palette classes instead — `bg-white`, `text-slate-600`,
  `bg-gradient-to-r from-blue-500 to-cyan-500`. **Match the surrounding code: use raw Tailwind
  palette classes.** (Only `components/ui/` primitives reference the tokens, harmlessly.) If you
  ever need the tokens to work, the fix is converting the vars to HSL triplets — a deliberate,
  whole-app change, not a drive-by.
- The house look: white/glass cards on a `slate-50 → blue-50 → cyan-50` gradient, blue→cyan
  gradients for accents, `rounded-xl`, Poppins via `--font-poppins`. Helpers `.medical-gradient`,
  `.card-hover`, `.glass-effect` are in `app/globals.css`.
- **Never let a form control render below 16px on mobile.** iOS Safari auto-zooms the viewport
  when a focused input is smaller than that, and it ignores `user-scalable=no` for this. The
  bottom of `app/globals.css` forces `font-size: 16px !important` on `input/select/textarea/
  .native-date-input` under `@media (pointer: coarse), (max-width: 1024px)` — the `!important` is
  load-bearing, because Tailwind's `text-sm` sits in a later cascade layer than `base`. The
  `viewport` export in `app/layout.tsx` pins `maximumScale: 1` as a second line of defence.
- **Mobile-first and mobile-real** — this is used on a phone. Bottom nav is fixed and `sm:hidden`;
  main content carries `pb-20 sm:pb-6` to clear it. Keep new sections working at 390px.
- Icons: **lucide-react**. Animations: **framer-motion** (page transitions live in `dashboard.tsx`).
- Dark mode is `darkMode: ["class"]` and `.dark` vars exist, but nothing toggles it and
  `next-themes` is unwired. Treat the app as light-only.

## Files that are dead — don't edit or imitate them

Leftovers from the v0 scaffold, imported by nothing:

- `components/add-patient-dialog.tsx`, `components/edit-patient-dialog.tsx`,
  `components/patient-details-dialog.tsx` — superseded by the `*-page.tsx` equivalents.
  Editing the dialog when the user means the page is the easiest mistake to make here.
- `components/theme-provider.tsx`
- `styles/globals.css` — a stale 90-line copy; the live one is `app/globals.css`.
- `hooks/use-toast.ts` and `hooks/use-mobile.tsx` are byte-identical duplicates of the
  `components/ui/` versions. Check which one an edited file imports.
- `scripts/setup-demo-data.sql` is a comment-only doc of the Firestore shape, not runnable SQL.
- Most of `components/ui/` is unused shadcn boilerplate; `components/ui/chart.tsx` +
  `recharts` back `attendance-analytics.tsx`.

## Secrets

`.env` sits in this directory and holds **real Firebase web config plus a service-account private
key**. It is correctly gitignored (`.env*`) and untracked — keep it that way. Don't print, copy,
or echo its contents. `scripts/create-admin-user.js` has a hardcoded default admin email/password
at the top; treat those as live credentials.

## Other notes

- `app/api/parse-patient-voice/route.ts` posts to OpenAI `gpt-4o` via the Vercel AI SDK to extract
  patient fields from dictated text. It needs `OPENAI_API_KEY`, which is **not** in `.env`, so the
  route 500s today.
- `metadataBase` is unset in `app/layout.tsx`, so you'll see one build warning about resolving
  OG image URLs. Known, harmless.
- Branching: work happens on `dev`, PRs go to `main`.
