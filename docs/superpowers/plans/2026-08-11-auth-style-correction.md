# Authentication and Source-Style Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the GitHub source presentation, make all interface copy English-only, and verify the permanent `admin` account through Supabase Auth.

**Architecture:** Keep Supabase authentication as a wrapper around the existing React application, but derive every auth control from the source application's existing visual classes. Put English copy in a small typed module so it can be tested without a DOM environment. Keep authorization in RLS and owner claims; never bundle or commit the owner password.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Supabase Auth/Postgres, Cloudflare Pages.

## Global Constraints

- Do not change the GitHub source application's colors, spacing, typography, dictionary controls, or list layout.
- Every user-facing string must be English; no Han characters may remain in `frontend/src`.
- The public owner username is exactly `admin`.
- The owner password exists only in Supabase Auth and must never enter Git, frontend source, build variables, or logs.
- Anonymous users may modify only their own temporary learning state.
- Only `app_metadata.role = owner` grants shared dictionary management permissions.

---

### Task 1: Lock English authentication copy with tests

**Files:**
- Create: `frontend/src/auth/authCopy.ts`
- Create: `frontend/src/auth/authCopy.test.ts`

**Interfaces:**
- Produces: `AUTH_COPY`, a readonly object consumed by `AuthGate.tsx` and `App.tsx`.

- [ ] **Step 1: Write the failing copy test**

```ts
import { describe, expect, it } from 'vitest';
import { AUTH_COPY } from './authCopy';

describe('authentication copy', () => {
  it('contains English-only user-facing text', () => {
    const copy = Object.values(AUTH_COPY).join(' ');
    expect(copy).not.toMatch(/[\u3400-\u9fff]/u);
    expect(AUTH_COPY.guestAction).toBe('Continue as guest');
    expect(AUTH_COPY.signOut).toBe('Sign out');
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails because `authCopy.ts` does not exist**

Run: `npm run test:run -- src/auth/authCopy.test.ts`

- [ ] **Step 3: Add the minimal typed copy module**

```ts
export const AUTH_COPY = {
  intro: 'Sign in to your permanent wordbook, or start a temporary guest session.',
  username: 'Username',
  password: 'Password',
  signIn: 'Sign in',
  guestAction: 'Continue as guest',
  guestNote: 'Guest progress belongs only to this temporary session.',
  invalidCredentials: 'The username or password is incorrect.',
  guestError: 'Guest access is temporarily unavailable. Please try again.',
  configurationError: 'The dictionary service is not configured.',
  loading: 'Loading…',
  signOut: 'Sign out',
} as const;
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm run test:run -- src/auth/authCopy.test.ts`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/auth/authCopy.ts frontend/src/auth/authCopy.test.ts
git commit -m "test: require English authentication copy"
```

### Task 2: Restore source styling and English-only authentication

**Files:**
- Modify: `frontend/src/auth/AuthGate.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/TopTabs.tsx`
- Test: `frontend/src/auth/authCopy.test.ts`

**Interfaces:**
- Consumes: `AUTH_COPY` and `useAuth()`.
- Produces: an English signed-out panel and a source-styled `Sign out` control.

- [ ] **Step 1: Replace inline auth strings with `AUTH_COPY`**

Import `AUTH_COPY` and replace every inline loading, field, action, note, configuration, and error string with the corresponding property.

- [ ] **Step 2: Match existing source classes**

Use the modal and control vocabulary already present in `AddWordModal.tsx`: `bg-[#EAE3D2]`, `bg-[#F2EDE0]`, `border-[#D4CBB8]`, `text-[#2C2A26]`, `text-[#8C2F2A]`, `word-title`, `rounded-2xl`, and the existing button classes. Do not add a new palette, font, navigation region, illustration, or card hierarchy.

- [ ] **Step 3: Move sign-out into the existing TopTabs action group**

Add `onSignOut: () => void` and render `Sign out` with the same neutral button class used by `Import`. Remove the custom header row and restore the original heading markup exactly:

```tsx
<h1 className="word-title text-2xl font-bold text-[#2C2A26]">English Dictionary</h1>
```

- [ ] **Step 4: Scan for prohibited Chinese text**

Run: `rg -n "[\p{Han}]" frontend/src`
Expected: no matches.

- [ ] **Step 5: Run tests and lint**

Run: `npm run test:run && npm run lint`
Expected: all tests pass and lint reports zero errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/auth frontend/src/App.tsx frontend/src/components/TopTabs.tsx
git commit -m "fix: restore source styling and English auth"
```

### Task 3: Correct and verify the permanent owner credential

**Files:**
- No repository files contain the password.

**Interfaces:**
- Consumes: existing owner user and `app_metadata.role = owner`.
- Produces: a verified Supabase password sign-in for public username `admin`.

- [ ] **Step 1: Verify the target user**

Query only non-secret properties: confirmed email, non-empty password hash, and owner app-metadata claim. Do not retrieve or print the password hash.

- [ ] **Step 2: Reset through the supported Supabase Auth administrator workflow**

Open the owner user in Supabase Authentication and set the user-provided password. Do not use SQL against `auth.users`, a public RPC, a service-role key in browser code, or a committed script. The final sensitive confirmation remains a user-authorized dashboard action if the platform requires it.

- [ ] **Step 3: Perform a real password sign-in**

On the Cloudflare deployment, sign in with username `admin` and the user-provided password. Confirm the session JWT contains `app_metadata.role = owner` and that Add Word, Import, and Delete controls are present.

- [ ] **Step 4: Sign out and verify guest isolation**

Start a guest session, toggle one word, confirm the count changes, revert it, and sign out. Confirm no Add Word, Import, or Delete control is exposed.

### Task 4: Build, deploy, and verify production

**Files:**
- Modify only if verification finds a deployment-specific defect.

**Interfaces:**
- Consumes: green source tree and existing Cloudflare/Supabase configuration.
- Produces: verified production deployment at `https://dictionary-8zh.pages.dev`.

- [ ] **Step 1: Run the complete frontend gate**

Run: `npm run build && npm run lint`
Expected: Vitest passes, TypeScript passes, Vite produces `dist`, and ESLint has zero errors.

- [ ] **Step 2: Confirm database state and advisors**

Verify 96 shared entries, 96 structured definition arrays, the owner claim, no performance advisor findings, and only intentional anonymous-auth security warnings.

- [ ] **Step 3: Push the feature branch and main**

```bash
git push origin codex/cloudflare-supabase-split
git push origin HEAD:main
```

- [ ] **Step 4: Wait for the Cloudflare asset hash to change**

Poll the production HTML until its `/assets/index-*.js` reference differs from the previous deployment.

- [ ] **Step 5: Run production browser verification**

Confirm English-only auth, source-style layout, owner login, owner controls, guest login, guest restrictions, 96-word loading, and reversible per-user state mutation.
