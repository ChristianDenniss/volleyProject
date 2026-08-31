# Contributing

Thanks for wanting to help. Volleyball 4.2 is a TypeScript monorepo: Express +
TypeORM in `BE/`, React + Vite + Tailwind v4 in `FE/`. Live site:
[volleyball4-2.com](https://volleyball4-2.com/).

## Find something to work on

- Issues labeled [`good first issue`](https://github.com/ChristianDenniss/volleyProject/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) are sized for a first PR.
- [`help wanted`](https://github.com/ChristianDenniss/volleyProject/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) is fair game for anyone.
- Comment on the issue before starting so we can avoid duplicate work.
- New ideas: open a feature request using the template. Please discuss before
  large refactors.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Local setup

Prerequisites: Node.js 20+, npm, and Docker (or a local PostgreSQL).

```bash
git clone https://github.com/ChristianDenniss/volleyProject.git
cd volley-project

cp BE/.env.example BE/.env
cp FE/.env.example FE/.env

cd BE && npm install && cd ..
cd FE && npm install && cd ..

docker compose up -d db
cd BE && npm run dev          # API on :3000
cd FE && npm run dev          # Vite on :5173
```

Frontend without a backend: `cd FE && npm run dev-mock`.

Full stack via Docker: `docker compose up --build` from the repo root.

## What CI expects

Pull requests against `main` must pass:

| Check | Command |
|---|---|
| Backend build | `cd BE && npm ci && npm run build && npm test` |
| Frontend build | `cd FE && npm ci && npm run build` |

Frontend lint (`cd FE && npm run lint`) is not in CI yet; please still run it
locally if you touch `FE/`.

## Branch, commit, pull request

1. Branch off up-to-date `main`: `feat/short-name`, `fix/short-name`, or `docs/short-name`.
2. Keep the diff focused on the issue. Do not mix formatting-only edits with
   behavior changes.
3. Use [Conventional Commits](https://www.conventionalcommits.org/). Releases
   are cut automatically from messages that land on `main` — see
   [docs/architecture/versioning.md](docs/architecture/versioning.md).

   ```
   feat: add a win/loss column to the team page
   fix: stop the login body styles leaking onto other pages
   docs: explain mock-mode frontend
   ```

   Types: `feat` (minor), `fix` / `perf` / `revert` (patch). `chore`, `docs`,
   `refactor`, `test`, `ci`, and `build` do not bump the version.
4. Open a PR against `main`. Fill in the PR template. Reference the issue with
   `Fixes #123` when it fully resolves it.
5. If you squash-merge, the **PR title** becomes the commit semantic-release
   reads — keep the `type:` prefix there too.

Direct pushes to `main` are blocked for everyone except maintainers. Please
still use PRs so CI runs.

## Frontend style notes

`FE/` is mid-migration from page CSS to Tailwind v4 utilities.

- Do not change how a screen looks unless the issue says to.
- Inclusive max-width breakpoints use `upto-*` variants (`upto-md` is
  `@media (max-width: 768px)`), not Tailwind's `max-md` (which is `< 768px`).
- Transforms that are animated must use `[transform:…]`, not `translate-*` /
  `scale-*` utilities.
- Leave remnant stylesheets (`Login.css`, `ui.css`, and the files with a
  "What is left of …" header) alone unless the issue is about that remnant.
- Tokens live in `FE/src/styles/tokens.css`. Prefer `text-brand-primary` when
  the CSS used `var(--color-brand-primary)`; keep a literal hex if the CSS
  used a literal hex.

## Backend notes

- Feature code lives under `BE/src/modules/<name>/`.
- Tests are Jest + Supertest next to the module in `__tests__/`.
- Do not commit `.env`. Copy from `.env.example`.

## License

By contributing, you agree that your work is licensed under the [ISC License](LICENSE).
