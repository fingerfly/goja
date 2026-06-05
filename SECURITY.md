# Security Policy

## Supported Versions

Security updates are provided for the latest major version.

## What Ships to Users

Goja on GitHub Pages is a **static PWA** (HTML, CSS, JavaScript, assets). Node.js,
Playwright, Vitest, and other npm dev tools run only on developer machines and in
CI — they are **not** served to end users.

Runtime dependencies copied into the app bundle include vendored libraries such as
`js/vendor/exifr.mjs` (built from the pinned `exifr` devDependency during install
or CI deploy).

## Dependency Maintenance

- **Direct devDependencies** are declared in `package.json` and bumped deliberately.
- **Transitive fixes** use npm `overrides` when a parent package has not yet
  released a patched version.
- **Dependabot** (`.github/dependabot.yml`) opens weekly grouped npm update PRs
  on the standalone repository.
- **Security sweep** (`.github/workflows/security-sweep.yml`) runs weekly audit
  and full tests on `main`.
- **CI audit gate**: the Test workflow runs `npm audit --audit-level=moderate`
  and fails on moderate or higher severity findings.
- **Local pre-release check**: `npm run audit:check` or `npm run security:verify`
  (audit + unit + E2E).

## CI and Deploy Gates

On push or pull request to `main`:

1. **Test** workflow — `audit`, `unit`, and `e2e` jobs (all must pass).
2. **Deploy** workflow — runs only after a successful Test on `main`; checks out
   the tested commit, runs `npm run copy:vendor`, then publishes to GitHub Pages.
   Manual `workflow_dispatch` deploy is also available.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately:

1. **Do not** open a public issue.
2. Email the maintainer or use GitHub's [Private vulnerability reporting](https://github.com/fingerfly/goja/security/advisories/new) if available.
3. Include a description of the vulnerability and steps to reproduce.

We will respond within a reasonable timeframe and will credit you in the advisory
if the report is valid and not already known.
