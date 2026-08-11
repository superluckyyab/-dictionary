# Cloudflare + Supabase Split Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the repository's current React/Vite dictionary interface while replacing the FastAPI/SQLite runtime with Supabase Auth and Postgres, then deploy the frontend through Cloudflare Pages.

**Architecture:** The browser uses `@supabase/supabase-js` with a publishable key. Shared dictionary rows live in `dictionary_entries`; each authenticated identity has private progress in `user_word_state`. Supabase RLS distinguishes the trusted owner claim from anonymous users, and Cloudflare Pages publishes the `frontend/dist` static build.

**Tech Stack:** React 18, TypeScript 5.6, Vite 5, TanStack Query 5, Supabase JavaScript SDK, Supabase Auth/Postgres/RLS, Vitest, Cloudflare Pages Git deployment.

## Global Constraints

- Preserve the current GitHub frontend's colors, typography, layout, spacing, components, and dictionary interaction style.
- Present the permanent account as username `admin`; map it internally to the existing owner email without displaying that email.
- Never commit, print, or expose the administrator password, service-role key, or third-party AI key.
- Keep shared dictionary content global; keep status, bookmark, and collection count private to each identity.
- Anonymous users may change only their own temporary progress and may not mutate shared entries.
- Only `app_metadata.role = 'owner'` may add, edit, delete, or import shared entries.
- Keep the existing Vercel redirect URL while making the Cloudflare URL the primary Supabase site URL.

---

### Task 1: Add Supabase schema migration and seed source

**Files:**
- Create: `supabase/migrations/202608110001_expand_dictionary_for_react_frontend.sql`
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: `dictionary_entries.phonetic text`, `dictionary_entries.definitions jsonb`, a unique `(word, part_of_speech)` constraint, and the existing RLS owner/own-state contract.
- Consumes: Existing `dictionary_entries` and `user_word_state` tables in project `wsnszuhxcxhvzjwrozia`.

- [ ] **Step 1: Write schema assertions before migration**

Run a read-only SQL query that expects `phonetic`, `definitions`, the unique constraint, and all eight RLS policies. Record that the new columns/constraint are absent before migration.

- [ ] **Step 2: Write the idempotent migration**

Use `alter table ... add column if not exists`, backfill `definitions` from the existing `definition` text, add JSON/check constraints, normalize existing word/POS values, add the unique constraint, retain RLS, and explicitly grant required table privileges to `authenticated` only.

- [ ] **Step 3: Generate seed SQL from `backend/app/seed.py`**

Insert all repository seed words with `on conflict (word, part_of_speech) do update`, preserving existing user progress and enriching shared phonetic, definition, audio, URL, and level data.

- [ ] **Step 4: Apply and verify Supabase changes**

Apply DDL through the Supabase migration tool, apply seed DML through SQL execution, then query column definitions, constraints, RLS policies, grants, and row counts. Run Supabase security and performance advisors.

- [ ] **Step 5: Commit schema artifacts**

```bash
git add supabase/migrations/202608110001_expand_dictionary_for_react_frontend.sql supabase/seed.sql
git commit -m "feat: expand Supabase dictionary schema"
```

### Task 2: Add frontend Supabase foundation and authentication

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/lib/supabase.ts`
- Create: `frontend/src/auth/AuthGate.tsx`
- Create: `frontend/src/auth/AuthGate.test.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `supabase` client, authenticated `User`, `isOwner(user)` helper, admin password login, anonymous login, and sign-out.
- Consumes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, fixed internal owner email mapping, and Supabase Auth.

- [ ] **Step 1: Add pinned Supabase and test dependencies**

Install `@supabase/supabase-js` and add Vitest plus Testing Library dev dependencies using npm so the lockfile records exact resolved versions. Add `test` and `test:run` scripts.

- [ ] **Step 2: Write failing auth tests**

Test that the form displays username and password rather than an email field, rejects any username other than `admin`, calls password auth with the internal owner email, exposes an anonymous-login button, and identifies owner only from `app_metadata.role`.

- [ ] **Step 3: Implement the Supabase client and auth gate**

Validate public environment variables at startup, call `signInWithPassword` for `admin`, call `signInAnonymously` for guests, subscribe to auth changes, and render a loading/error/login state using the existing beige/red/green visual language without altering the dictionary screen.

- [ ] **Step 4: Run focused tests**

```bash
cd frontend
npm run test:run -- src/auth/AuthGate.test.tsx
```

- [ ] **Step 5: Commit authentication**

```bash
git add frontend
git commit -m "feat: add Supabase admin and guest authentication"
```

### Task 3: Replace FastAPI word reads with Supabase queries

**Files:**
- Modify: `frontend/src/types.ts`
- Replace: `frontend/src/api/client.ts`
- Replace: `frontend/src/api/words.ts`
- Create: `frontend/src/api/words.test.ts`
- Modify: `frontend/src/hooks/useWords.ts`

**Interfaces:**
- Produces: `fetchWords`, `fetchWord`, `fetchStats`, and merged `Word` objects with shared entry fields plus current-user state.
- Consumes: `dictionary_entries`, `user_word_state`, the authenticated user ID, and the current `WordsParams` contract.

- [ ] **Step 1: Write failing mapping and filtering tests**

Cover UUID IDs, definition JSON mapping, missing-state defaults, status/bookmark filters, CEFR and letter filtering, search over word/POS/definition, pagination, alpha/recent/level sorts, and statistics.

- [ ] **Step 2: Implement database row mapping**

Load shared entries and the current user's states, merge by `entry_id`, default missing state to unknown/unbookmarked/zero, apply deterministic filters/sorts, and paginate using the existing response shape.

- [ ] **Step 3: Preserve TanStack Query behavior**

Update cache keys to include the user ID, keep infinite pagination and optimistic updates, and invalidate statistics after mutations.

- [ ] **Step 4: Run focused tests**

```bash
cd frontend
npm run test:run -- src/api/words.test.ts
```

- [ ] **Step 5: Commit read path**

```bash
git add frontend/src/types.ts frontend/src/api frontend/src/hooks/useWords.ts
git commit -m "feat: read dictionary data from Supabase"
```

### Task 4: Implement progress mutations and owner-only dictionary actions

**Files:**
- Modify: `frontend/src/api/words.ts`
- Modify: `frontend/src/hooks/useWords.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/TopTabs.tsx`
- Modify: `frontend/src/components/WordRow.tsx`
- Modify: `frontend/src/components/AddWordModal.tsx`
- Modify: `frontend/src/components/ImportModal.tsx`
- Create: `frontend/src/lib/importWords.ts`
- Create: `frontend/src/lib/importWords.test.ts`

**Interfaces:**
- Produces: private progress upserts for all users; owner-only shared create/delete/import; browser JSON/CSV parsing and bounded batch import.
- Consumes: authenticated user, owner claim, existing component callbacks, and Supabase RLS.

- [ ] **Step 1: Write failing mutation and import tests**

Test progress upsert payloads, owner gating, duplicate collection behavior, JSON arrays, UTF-8 CSV rows, grouped definitions, invalid files, and batch failure reporting.

- [ ] **Step 2: Implement current-user progress mutations**

Upsert `user_word_state` with `(user_id, entry_id)`, preserving unspecified fields. Treat bookmark toggles and known/unknown changes as private state only.

- [ ] **Step 3: Implement owner create and delete**

Create shared entries only for owner sessions and rely on RLS as the server-side authorization boundary. A newly inserted word starts with no state row and therefore displays as unknown, unbookmarked, and zero collections; a duplicate import upserts the owner's state to bookmarked and increments its collection count. Hide add/import/delete controls for guests without changing their surrounding layout.

- [ ] **Step 4: Implement browser import**

Parse JSON/CSV locally, normalize word/POS/level/definitions, reject malformed rows before writes, upsert shared entries in bounded batches, and increment/bookmark owner state for duplicates.

- [ ] **Step 5: Run focused tests**

```bash
cd frontend
npm run test:run -- src/api/words.test.ts src/lib/importWords.test.ts
```

- [ ] **Step 6: Commit mutations and owner controls**

```bash
git add frontend/src
git commit -m "feat: add Supabase progress and owner actions"
```

### Task 5: Remove tracked AI credential and update deployment documentation

**Files:**
- Modify: `backend/app/routers/ai.py`
- Modify: `README.md`
- Create: `frontend/.env.example`

**Interfaces:**
- Produces: no tracked third-party credential; documented Cloudflare/Supabase runtime and local configuration.
- Consumes: optional server-side `ZAI_API_KEY` if the legacy FastAPI service is run locally.

- [ ] **Step 1: Add a secret scan assertion**

Search tracked source for the known credential pattern and confirm the current backend file fails the assertion.

- [ ] **Step 2: Read AI configuration from the environment**

Replace the hard-coded value with `os.environ.get('ZAI_API_KEY')` and return a configuration error when absent. Do not add the credential to any example file.

- [ ] **Step 3: Document split deployment**

Update the README with Cloudflare build root/command/output, Supabase variable names, admin/guest behavior, and a warning that secrets must stay server-side.

- [ ] **Step 4: Verify the credential is absent from the working tree**

Run a tracked-source search that must return no matches.

- [ ] **Step 5: Commit security and docs**

```bash
git add backend/app/routers/ai.py README.md frontend/.env.example
git commit -m "security: remove tracked AI credential"
```

### Task 6: Set the permanent administrator password safely

**Files:**
- No source files.

**Interfaces:**
- Produces: password authentication for the existing owner account without exposing the password.
- Consumes: existing confirmed owner account and Supabase Auth's supported user update flow.

- [ ] **Step 1: Confirm owner identity and metadata**

Query the existing non-anonymous auth user and verify `app_metadata.role = 'owner'`.

- [ ] **Step 2: Set the password through Supabase Auth administration**

Use the dashboard's supported user administration flow or an authenticated `updateUser` session. Do not place the password in shell arguments, SQL text, logs, source, or browser snapshots.

- [ ] **Step 3: Verify password sign-in**

Use the production login form with username `admin` and confirm the resulting JWT/user metadata contains the owner role. Sign out after verification.

### Task 7: Run full local verification and publish GitHub changes

**Files:**
- All modified files above.

**Interfaces:**
- Produces: a tested Git commit on GitHub `main` that Cloudflare can build.
- Consumes: completed Tasks 1-6.

- [ ] **Step 1: Run the full frontend test suite**

```bash
cd frontend
npm run test:run
```

- [ ] **Step 2: Run lint and production build**

```bash
cd frontend
npm run lint
npm run build
```

- [ ] **Step 3: Review repository state and commit history**

Run `git status --short`, `git diff --check`, inspect every commit, and confirm no secrets or unrelated files are included.

- [ ] **Step 4: Push the confirmed main branch**

```bash
git push origin main
```

- [ ] **Step 5: Confirm GitHub source commit**

Use the GitHub connector to confirm the remote `main` SHA and changed-file set.

### Task 8: Reconfigure Cloudflare Pages and verify production

**Files:**
- No source files unless Cloudflare requires a repository configuration file discovered during deployment.

**Interfaces:**
- Produces: production at `https://dictionary-8zh.pages.dev` built from `frontend` and backed by Supabase.
- Consumes: GitHub `main`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.

- [ ] **Step 1: Update Cloudflare build settings**

Set root directory `frontend`, command `npm run build`, output directory `dist`, and the two public Supabase build variables. Do not add private keys.

- [ ] **Step 2: Trigger and monitor production deployment**

Confirm the deployment uses the expected Git SHA and reaches a successful status.

- [ ] **Step 3: Test anonymous behavior**

Sign in anonymously, confirm seeded entries and filters/statistics load, change status/bookmark, and verify add/import/delete controls are unavailable. Directly attempt a shared-entry mutation and confirm RLS rejects it.

- [ ] **Step 4: Test administrator behavior**

Sign in as `admin`, confirm owner controls appear, add a disposable entry, update progress, import a small valid sample, verify persistence after sign-out/sign-in, then remove only the disposable verification data.

- [ ] **Step 5: Run final database and browser checks**

Query final row counts and owner role, run Supabase advisors, inspect browser console/network errors, and verify the Cloudflare production URL returns the expected interface.
