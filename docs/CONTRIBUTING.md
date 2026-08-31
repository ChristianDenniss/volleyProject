---
title: Contributing
type: policy
status: current
area: [docs, ci-cd, frontend, backend]
created: 2026-08-31
verified: 2026-08-31
summary: Mechanics for landing a change - branch and commit naming for semantic-release, the pre-PR checklist, and code review expectations.
related:
  - guides/local-setup.md
  - architecture/versioning.md
---

# Contributing

These notes cover the mechanics of getting a change in. For the "why" behind
versioning, see [`architecture/versioning.md`](./architecture/versioning.md).
Please follow the [Code of Conduct](../CODE_OF_CONDUCT.md).

Pick up a [`good first issue`](https://github.com/ChristianDenniss/volleyProject/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
or [`help wanted`](https://github.com/ChristianDenniss/volleyProject/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
ticket, and comment on it before starting so work is not duplicated.

## Setup

Follow [`guides/local-setup.md`](./guides/local-setup.md) to get the stack
running (Docker Compose, or frontend/backend run separately against Postgres).

## Branching and commits

Branch names and commit messages drive automatic semantic-release versioning -
see [`architecture/versioning.md`](./architecture/versioning.md) for the full
explanation. In short:

- Branch: `feat-<issue>-short-name` (or `fix-<issue>-short-name`), matching the
  GitHub issue, e.g. `feat-131-login-css`.
- Commit / PR title: `<type>: <short description>`, e.g. `feat: add a skip-to-content link`.
- Types: `feat` (minor bump), `fix`/`perf`/`revert` (patch bump),
  `chore`/`docs`/`refactor`/`style`/`test`/`ci`/`build` (no version bump).
- Breaking change: `feat!: ...` or a `BREAKING CHANGE:` footer.
- PRs are squash-merged into `main`; the squash commit message is what
  semantic-release reads, so get that **PR title** right even if intermediate
  commits on the branch are looser. GitHub is set to use the PR title as the
  squash subject.

## Before opening a PR

- `cd BE && npm run build && npm test` and `cd FE && npm run build` — these are
  the CI gate in `.github/workflows/ci.yml`.
- `cd FE && npm run lint` if you touched the frontend (not in CI yet).
- Keep the diff focused on the issue. Do not mix formatting-only edits with
  behavior changes.
- Reference the issue with `Fixes #123` when the PR fully resolves it.
- If you added a TypeORM entity column, add a matching migration under
  `BE/src/migrations/` — schema changes do not ship via `synchronize` in
  production.
- Do not commit `.env`. Copy from `BE/.env.example` and `FE/.env.example`.

### Frontend (Tailwind migration)

`FE/` is mid-migration from page CSS to Tailwind v4 utilities. Do not change
how a screen looks unless the issue says to.

- Inclusive max-width breakpoints use `upto-*` variants (`upto-md` is
  `@media (max-width: 768px)`), not Tailwind's `max-md` (which is `< 768px`).
- Transforms that are animated must use `[transform:…]`, not `translate-*` /
  `scale-*` utilities.
- Leave remnant stylesheets (`Login.css`, `ui.css`, and files with a
  "What is left of …" header) alone unless the issue is about that remnant.
- Tokens live in `FE/src/styles/tokens.css`. Prefer `text-brand-primary` when
  the CSS used `var(--color-brand-primary)`; keep a literal hex if the CSS
  used a literal hex.

### Backend

- Feature code lives under `BE/src/modules/<name>/`.
- Tests are Jest + Supertest next to the module in `__tests__/`.

## Code review

Standard GitHub PR review. Direct pushes to `main` are blocked for everyone
except maintainers — please still use PRs so CI runs.

By contributing, you agree that your work is licensed under the
[ISC License](../LICENSE).
