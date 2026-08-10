# Dictionary Supabase Data Layer Design

## Goal

Move the dictionary's persistent data from browser `localStorage` to the existing Supabase project `-dictionary`, while keeping Vercel as the frontend host. One permanent owner account controls the shared dictionary. Anonymous accounts can temporarily experience the application without changing the owner's shared dictionary data.

## Current State

- The production Vercel project is `dictionary` (`prj_kpFJ7fHD6oVXsYCOxC2RoPTuWvqD`).
- The deployed source is `superluckyyab/-dictionary`, branch `main`.
- The application is a static React 18 page compiled in the browser with Babel.
- All entries, collection counts, and generated explanations are stored in `localStorage` under `lexicon.words.v1`.
- The existing Supabase project `-dictionary` (`wsnszuhxcxhvzjwrozia`) is healthy and has no public tables or migrations.

## Chosen Architecture

Use a shared catalog plus per-user state:

1. `dictionary_entries` stores the canonical shared dictionary.
2. `user_word_state` stores collection counts and generated explanations for one authenticated user and one dictionary entry.
3. The permanent owner account may create, update, and delete shared entries and may manage its own state.
4. Anonymous Supabase Auth users may read shared entries and manage only their own state.
5. Anonymous users may not modify shared entries. Their accounts are intentionally temporary and are not offered an upgrade flow.

The browser uses the Supabase JavaScript client with the project's URL and publishable key. No service-role or secret key is sent to the browser.

## Data Model

### `public.dictionary_entries`

- `id uuid primary key default gen_random_uuid()`
- `word text not null`
- `part_of_speech text not null`
- `cefr_level text not null`, constrained to `A1`, `A2`, `B1`, `B2`, `C1`, `C2`, or `UNKNOWN`
- `definition text not null default ''`
- `definition_url text not null default ''`
- `audio_url text not null default ''`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

A unique expression index on `lower(word), lower(part_of_speech)` preserves the current deduplication rule. An update trigger maintains `updated_at`.

### `public.user_word_state`

- `user_id uuid not null references auth.users(id) on delete cascade`
- `entry_id uuid not null references public.dictionary_entries(id) on delete cascade`
- `collect_count integer not null default 0`, constrained to zero or greater
- `ai_explanation jsonb`
- `updated_at timestamptz not null default now()`
- Primary key: `(user_id, entry_id)`

An update trigger maintains `updated_at`.

## Authentication and Owner Bootstrap

- The app first attempts to restore an existing Supabase session.
- If no session exists, the visitor can either sign into the permanent account by email or start an anonymous session.
- Email sign-in is for the permanent owner account. Anonymous sign-in is for temporary visitors.
- After the owner completes the first permanent sign-in, deployment setup explicitly assigns `app_metadata.role = 'owner'` to that authenticated user. The owner refreshes the session before privileged actions are enabled.
- Authorization uses `app_metadata`, never user-editable `user_metadata`.
- The UI does not expose anonymous-account upgrade, linking, or recovery flows.

## Row-Level Security and Grants

RLS is enabled on both public tables.

`dictionary_entries` policies:

- `SELECT`: allowed to `authenticated`, including anonymous Supabase users.
- `INSERT`, `UPDATE`, `DELETE`: allowed only when `auth.jwt()->'app_metadata'->>'role' = 'owner'`.
- `UPDATE` includes both `USING` and `WITH CHECK` owner predicates.

`user_word_state` policies:

- `SELECT`, `INSERT`, `UPDATE`, `DELETE`: allowed only when `(select auth.uid()) = user_id`.
- `UPDATE` includes both `USING` and `WITH CHECK` ownership predicates.

Because new Supabase projects no longer automatically expose new tables through the Data API, the migration explicitly grants only the required table privileges to `authenticated`. The `anon` Postgres role receives no table privileges; visitors must establish an anonymous Auth session first.

## Seed and Existing Browser Data

- The entries currently defined in `seed.jsx` are inserted into `dictionary_entries` by an idempotent seed migration.
- The current preset collection counts are not global catalog data. They become owner state only after the owner account is established.
- On the owner's first successful authenticated load, the app offers a one-time import of `lexicon.words.v1` into Supabase. Entries are upserted by normalized word and part of speech, and owner state is upserted by user and entry.
- The browser data is not deleted automatically. It remains a recovery copy until the owner explicitly confirms that migration succeeded.
- Anonymous visitors do not import pre-existing browser data into the shared catalog.

## Frontend Data Flow

1. Initialize the Supabase client from `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` values exposed through a small generated runtime configuration file.
2. Restore or create an authenticated session.
3. Fetch shared entries and the current user's state in parallel.
4. Merge the two result sets into the existing view model so the present UI needs minimal structural change.
5. Owner catalog mutations write to `dictionary_entries` and update local React state only after Supabase succeeds.
6. Collection and AI-explanation mutations upsert `user_word_state` for the active user.
7. Realtime subscriptions are not added; this application does not need multi-client live synchronization.

## Frontend Structure

- `supabase-client.js`: initializes and exports the browser client.
- `data-service.js`: contains authentication, catalog queries, state queries, and mutations.
- `migration-service.js`: performs the one-time owner browser-data import.
- `app.jsx`: retains presentation and view-state behavior, delegating persistence to the services.
- `seed.jsx`: remains the source for deterministic database seeding but is no longer the runtime persistence fallback after Supabase initializes successfully.

The existing static structure is retained. A full framework migration is outside this scope.

## Failure Handling

- Initial connection failure shows a visible retry state and does not overwrite local browser data.
- Mutation failure leaves the previous UI state intact and displays an actionable error message.
- Authentication expiry triggers one session refresh; if refresh fails, the app returns to the sign-in choice.
- Duplicate-entry conflicts resolve by fetching the existing normalized entry rather than creating another row.
- Owner-only controls remain hidden and database policies remain authoritative even if the UI is manipulated.

## Vercel Configuration

- Link the source checkout to Vercel team `team_PWLcdBawoPqJzN7WJxVr6oiM` and project `dictionary`.
- Configure the Supabase project URL and publishable key for development, preview, and production.
- Never configure a service-role or secret key as a public frontend variable.
- Deploy from the repository after database migration and local verification succeed.

## Verification

Database verification:

- Confirm tables, constraints, indexes, triggers, explicit grants, and RLS policies.
- Verify an authenticated anonymous user can select catalog rows.
- Verify an anonymous user cannot insert, update, or delete catalog rows.
- Verify users cannot read or modify another user's state.
- Verify the owner can perform every catalog mutation.
- Run Supabase security and performance advisors and resolve relevant findings.

Application verification:

- Owner sign-in restores permanent entries, collections, and AI explanations across sessions.
- Anonymous sign-in can browse, collect, and generate isolated temporary state.
- Owner and anonymous changes remain isolated as designed.
- Add, CSV import, search, filtering, collect, uncollect, clear collected, and explanation persistence continue to work.
- The production Vercel deployment loads without console, authentication, or database errors.

## Out of Scope

- Anonymous-account upgrade or linking.
- Multiple permanent administrators.
- Social login providers.
- Realtime synchronization.
- Automated cleanup of anonymous Auth users.
- Migrating the static React application to Next.js or another framework.
