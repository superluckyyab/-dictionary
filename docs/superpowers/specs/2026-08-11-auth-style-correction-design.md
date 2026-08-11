# Authentication and Source-Style Correction Design

## Goal

Correct the production authentication and presentation without redesigning the dictionary. The authenticated application must retain the visual structure, colors, spacing, typography, controls, and list presentation from the GitHub React source. Every user-facing string must be English.

## Confirmed requirements

- The permanent account is presented as username `admin`.
- The owner password is configured only in Supabase Auth and is never committed, bundled, logged, or displayed.
- A real password sign-in must be verified before completion.
- Anonymous sign-in remains available for temporary evaluation.
- The entire interface, including authentication, status, error, and sign-out text, is English-only.
- The post-login dictionary view retains the GitHub source style. Authentication must not introduce a new application layout or visual system.
- Owners retain shared dictionary management permissions. Guests can read the shared dictionary and modify only their own temporary learning state.

## Interface design

The dictionary application after sign-in remains structurally identical to the original React source. Existing components keep their classes and styling. Permission checks affect availability but do not restyle the application.

The signed-out state uses a compact panel derived from the same parchment, burgundy, border, serif-heading, and control styles already present in the source. It contains:

- `English Dictionary`
- a short English account explanation
- username input defaulted to `admin`
- password input
- `Sign in` button
- `Continue as guest` button
- English-only configuration and authentication errors

The signed-in header adds only a small English `Sign out` text action. No Chinese copy is permitted anywhere in `frontend/src`.

## Authentication and authorization

The browser maps the public username `admin` to the private owner email internally and signs in through `signInWithPassword`. Authorization trusts only the server-issued `app_metadata.role = owner` claim. Anonymous users sign in with Supabase anonymous auth.

The owner password is reset through a supported Supabase administrative path. Direct edits to `auth.users`, public password RPCs, hard-coded credentials, and frontend password comparisons are prohibited.

RLS remains the enforcement boundary:

- authenticated users may read shared dictionary entries;
- only the owner claim may create, update, import, or delete shared entries;
- each authenticated identity may access only its own learning state.

## Error handling

Authentication failures use one generic English message and do not reveal whether the username or password was wrong. Missing deployment configuration uses an English service-configuration message. Guest sign-in failure uses an English retry message.

## Verification

- A static scan finds no Han characters in user-facing frontend source.
- A regression test covers the required English auth copy and absence of Chinese text.
- Unit tests cover username mapping and owner-claim validation.
- The production build and lint complete without errors.
- Production browser checks confirm the source-style dictionary layout, 96 shared words, anonymous sign-in and state isolation.
- A real owner sign-in confirms the configured password and owner-only Add, Import, and Delete controls.
