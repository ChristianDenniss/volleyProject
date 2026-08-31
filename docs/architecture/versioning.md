---
title: Versioning
type: architecture
status: current
area: [ci-cd, docs]
created: 2026-08-31
verified: 2026-08-31
summary: Semantic-release from Conventional Commits on main — types, merge strategy, and what the Release workflow publishes.
related:
  - CONTRIBUTING.md
---

# Versioning

Volleyball 4.2 versions itself **automatically**. You never edit a version
number by hand — the version is derived from commit messages every time code
lands on `main`.

> **TL;DR** — Write your commits as `feat: <what changed>` or `fix: <what changed>`,
> merge into `main`, and a new version is tagged and released for you.

---

## 1. Semantic Versioning

Every release is a three-part version `MAJOR.MINOR.PATCH`:

| Part | Example | Bumped when | Meaning |
|---|---|---|---|
| **MAJOR** | `2`.0.0 | A commit signals a breaking change (`feat!`, `BREAKING CHANGE:`) | Incompatible change |
| **MINOR** | 1.`3`.0 | A `feat:` commit lands | New backwards-compatible feature |
| **PATCH** | 1.2.`1` | A `fix:` / `perf:` / `revert:` commit lands | Backwards-compatible fix |

**We start at `1.0.0`.** The repo has no version tags yet, so the first run of
the release workflow against `main` publishes `v1.0.0` regardless of what the
commits since the beginning of history say. Every release after that is computed
from the commits since the previous tag.

---

## 2. Conventional Commits — the convention that drives it

The version bump is decided by reading commit messages, following
[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>
```

### Types and their effect

| Type | Version effect | Use for |
|---|---|---|
| `feat` | **minor** bump | A new feature |
| `fix` | **patch** bump | A bug fix |
| `perf` | **patch** bump | A performance improvement |
| `revert` | **patch** bump | Reverting a previous change |
| `chore` | none | Tooling, deps, housekeeping |
| `docs` | none | Documentation only |
| `build` / `ci` | none | Build tooling and workflows |
| `refactor` / `style` / `test` | none | Internal changes with no user impact |

A release containing only no-bump types produces **no release at all**. That is
expected, not a failure.

### Breaking changes → MAJOR

A MAJOR bump is **never automatic**. It happens only when a commit explicitly
signals a breaking change, in one of two equivalent ways:

**A bang after the type:**

```
feat!: replace the session cookie with a bearer token
```

**Or a `BREAKING CHANGE:` footer in the body:**

```
feat: replace the session cookie with a bearer token

BREAKING CHANGE: existing sessions are invalidated; users must sign in again.
```

Either form forces a MAJOR bump regardless of the type.

### Which commit message actually gets read

semantic-release analyses **every commit reachable since the last tag**. What
that means in practice depends on how a PR is merged:

| Merge strategy | What the automation reads |
|---|---|
| **Merge commit** (what this repo has used so far) | Every individual commit in the branch |
| **Squash and merge** | Only the squash commit title, which GitHub defaults to the PR title |
| **Rebase and merge** | Every individual commit in the branch |

So: if you merge, name your **commits** properly. If you squash, name your
**PR** properly. Either way, at least one commit reaching `main` needs a
`feat:` or `fix:` prefix for a release to happen.

> **Note on existing history:** most commits before this document was written do
> not follow the convention (`Add public and admin UI for the team application
> portal`, `Polish team registration UI…`). That is fine — they all predate the
> first tag, so they cannot affect any version calculation. The convention
> applies from here forward.

---

## 3. What the automation does

On every push to `main` (and to maintenance branches like `1.2.x`),
**`.github/workflows/release.yml`** runs:

1. **Verify** — calls `ci.yml` as a reusable workflow, so both apps build and
   the backend tests run. A release is never cut from a broken tree. This is the
   same job that gates PRs, not a second copy of it.
2. **Tag & Release** — runs [`semantic-release`](https://semantic-release.gitbook.io/),
   which:
   - analyses the commits since the last tag,
   - computes the next version,
   - creates the git tag `vX.Y.Z`,
   - cuts a **GitHub Release** with generated notes,
   - attaches **`CHANGELOG.md`** to that release as an asset.

Configuration lives in **`.releaserc.json`**. The release tooling is installed
ephemerally in CI at pinned versions — it is deliberately **not** in either
app's `package-lock.json`, so its transitive dependencies never enter the
apps' audit surface.

`CHANGELOG.md` is generated as a release asset and is **not** committed back to
the branch, so the release job never needs write access to protected branches.
The GitHub Releases page is the changelog of record.

No release happens from feature branches or pull requests.

### Where to see the version

| Location | What you get |
|---|---|
| **[Releases](https://github.com/ChristianDenniss/volleyProject/releases)** | Each `vX.Y.Z` with its notes and the Changelog asset |
| **Tags** (`git tag -l 'v*'`) | Every published version |
| **Actions → Release** | Verify + tag/release job logs |

Until the first release lands, `git tag -l 'v*'` is empty and Releases shows
"No releases published" — that is expected.

---

## 4. Standard workflow — shipping a change

1. Branch off `main` with a type prefix (same types as the PR title):
   ```bash
   git checkout main && git pull
   git checkout -b feat/131-short-description
   ```
   Hyphens work too: `fix-136-header-alt`.
2. Open a PR whose **title** is a Conventional Commit. That title is squash-merged
   onto `main` and is what semantic-release reads:
   ```
   feat: add a per-season win/loss column to the team page
   ```
   CI job **PR conventions** rejects titles and branches that do not match.
3. Get a code-owner review, merge.
4. The release workflow publishes the next version (a `feat:` produces a
   **minor** bump — e.g. `1.2.0` → `1.3.0`).

---

## 5. Maintenance workflow — patching an older release

Use this when a released version has a critical bug but `main` has moved on to
changes you do not want to ship yet.

Example: production is on **v1.2.0**, `main` is at **v1.5.0**, and you need to
fix a bug without promoting anything after v1.2.0.

1. **Fix it on `main` first** using the standard workflow, so the bug is not
   reintroduced later.
2. Create the maintenance branch from the released tag (once per minor line):
   ```bash
   git checkout -b 1.2.x tags/v1.2.0
   git push origin 1.2.x
   ```
3. Branch off it for the fix, and cherry-pick from `main`:
   ```bash
   git checkout -b fix/1.2.x-the-bug 1.2.x
   git cherry-pick <sha>
   ```
4. Make sure the commit reads `fix: <description>`.
5. Open a PR **targeting `1.2.x`**, get approval, merge.
6. semantic-release publishes **v1.2.1** — a patch on the 1.2 line, with none of
   the changes that landed after v1.2.0.

The `1.2.x` / `1.x` branch patterns are recognised by the `branches` config in
`.releaserc.json` and by `release.yml`'s trigger.

---

## 6. Preview a release locally

To see what version *would* be published from the current branch, without
publishing anything:

```bash
# at the repo root - same pins as release.yml
npm install --no-save --no-package-lock \
  semantic-release@24.2.3 \
  @semantic-release/changelog@6.0.3 \
  @semantic-release/commit-analyzer@13.0.1 \
  @semantic-release/github@11.0.1 \
  @semantic-release/release-notes-generator@14.0.3 \
  conventional-changelog-conventionalcommits@8.0.0
npx semantic-release --dry-run --no-ci
```

It prints the branch, the analysed commits, and the next computed version. On a
feature branch it reports that the branch is not configured for publishing —
that is normal.

---

## 7. Requirements & gotchas

- **No extra secrets.** `release.yml` grants the job `contents: write`,
  `issues: write` and `pull-requests: write`, and uses the built-in
  `GITHUB_TOKEN`.
- **Full history is required.** The release job checks out with
  `fetch-depth: 0` so semantic-release can read every tag. Do not change this.
- **The root `package.json` is an anchor, not an app.** It exists so
  semantic-release has a package to version. Its `version` field is not the
  source of truth — the git tags are — and it is never updated by the pipeline.
  Do not edit it by hand, and do not add dependencies to it; the apps are `BE/`
  and `FE/`.
- **No dependency audit gate (yet).** `ci.yml` builds and tests but does not run
  `npm audit`. Adding one today would fail every release: `FE/` currently
  reports high and critical advisories. Clear those first, then add
  `npm audit --audit-level=high` to `ci.yml` so both the PR gate and the release
  gate pick it up.
