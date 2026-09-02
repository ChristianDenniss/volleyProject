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

## Branching, commits, and PR titles

Releases are cut automatically from [Conventional Commits](https://www.conventionalcommits.org/)
that land on `main`. Because we **squash-merge**, the **PR title** is the
message semantic-release reads — not the commits on the branch. CI rejects a PR
whose title or branch name does not match the types below. Full explanation:
[`architecture/versioning.md`](./architecture/versioning.md).

### Names

| | Pattern | Example |
|---|---|---|
| **Branch** | `<type>/<issue>-short-name` (hyphen after the type is also fine) | `feat/131-login-css`, `fix-136-header-alt` |
| **PR title** | `<type>: <what changed>` | `feat: reconnect the Login.css remnant` |
| **Commits on the branch** | Same form if you can; they are discarded on squash | `fix: give the header logo a descriptive alt` |

```bash
git checkout main && git pull
git checkout -b feat/131-login-css
```

PR title (this is the one that must be right):

```
feat: reconnect the Login.css remnant
```

A scope is optional: `fix(api): …`, `docs(fe): …`.

### Types

| Type | Version | Use for |
|---|---|---|
| `feat` | **minor** | A new user-facing capability |
| `fix` | **patch** | A bug fix |
| `perf` | **patch** | A performance improvement |
| `revert` | **patch** | Reverting a previous change |
| `chore` | none | Tooling, deps, housekeeping |
| `docs` | none | Documentation only |
| `style` | none | Formatting, no behavior change |
| `refactor` | none | Internal restructure, no behavior change |
| `test` | none | Tests only |
| `ci` / `build` | none | Workflows, build tooling |

Breaking change (forces a **major** bump): `feat!: …` or a `BREAKING CHANGE:`
footer in the squash message.

A PR that is only `chore` / `docs` / `refactor` / `test` / `ci` / `build` /
`style` does **not** cut a release. That is expected.

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
- Helpers that are not a service, controller, entity, or schema live in
  `BE/src/modules/<name>/utils/`.
- Tests are Jest + Supertest next to the module in `__tests__/`.

## Code review

Standard GitHub PR review. A PR cannot merge into `main` until:

- CI is green (**Backend build**, **Frontend build**, and **PR conventions**)
- It has an approving review from a code owner (`CODEOWNERS` is
  `@ChristianDenniss` or `@Stenimated`)

Direct pushes to `main` are blocked for everyone except maintainers. Maintainers
should still open PRs so CI and review run; GitHub will not let you approve
your own PR, so use the admin bypass only when you are merging your own work.

By contributing, you agree that your work is licensed under the
[ISC License](../LICENSE).
