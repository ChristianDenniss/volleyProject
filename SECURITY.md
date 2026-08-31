# Security Policy

## Supported versions

This project is under active development. Security fixes land on `main` and
ship with the next release. We do not maintain separate patched lines unless a
release has already been tagged and a maintenance branch (`1.2.x`) exists.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private reporting flow:

https://github.com/ChristianDenniss/volleyProject/security/advisories/new

Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept if you have one
- The version / commit you tested against

You should hear back within a few days. Please give us a reasonable window to
fix and release before any public disclosure.

## Scope

In scope: the Express API (`BE/`), the React app (`FE/`), Docker / CI config,
and auth (JWT, CSRF, Roblox OAuth).

Out of scope: third-party services (Challonge, Roblox), dependency CVEs that
are not exploitable in this app, and theoretical issues without a practical
path.
