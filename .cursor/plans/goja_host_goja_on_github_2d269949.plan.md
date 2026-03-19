---
name: Host Goja on GitHub
overview: Create a dedicated public GitHub repository for Goja and deploy it to GitHub Pages, with pre-publication cleanup to ensure the codebase is production-ready.
todos:
  - id: cleanup
    content: Add .gitignore and README.md to the goja project; ensure dev artifacts (playwright-report, test-results) are not committed
    status: completed
  - id: create-repo
    content: Prepare local git repo from goja source; user creates empty repo on github.com manually
    status: completed
  - id: gh-actions
    content: Create .github/workflows/deploy.yml to deploy only app files to GitHub Pages
    status: completed
  - id: push-code
    content: Initialize standalone git repo, copy files, add remote, and push to github.com/fingerfly/goja (user creates empty repo on GitHub first)
    status: completed
  - id: verify
    content: Verify the site loads and works correctly at the GitHub Pages URL
    status: completed
isProject: false
---

# Host Goja on GitHub Pages

## Audit Results

The codebase was inspected for hosting and security risks. Key findings:

- **Paths**: All HTML, CSS, JS, manifest, and service worker references use relative paths (`./`). Subdirectory deployment (e.g. `username.github.io/goja/`) will work out of the box -- this was explicitly fixed in v0.2.0 per the changelog.
- **Security**: No XSS vectors (`innerHTML` only clears content), no `eval()`, no secrets/API keys, no external network requests, no localStorage usage. Clean.
- **Console output**: One `console.warn('Export failed:', err)` in `app.js` (acceptable for production error reporting).
- **License**: Currently `"TBD"` in `package.json`. User will decide later.
- **Missing**: No `README.md` for the public repo. No Open Graph / social meta tags (optional).

## Plan

### 1. Pre-publication cleanup in the goja project

Before pushing to a public repo, address these items in the existing source at [02product/01_coding/project/goja/](02product/01_coding/project/goja/):

- **Add a `.gitignore`** inside the goja project to exclude:
  - `node_modules/`
  - `playwright-report/`
  - `test-results/`
- **Add a `README.md`** with a brief project description, screenshot placeholder, and usage instructions (needed for a public repo landing page).
- **Review tracked files**: `playwright-report/index.html` and `test-results/.last-run.json` are currently tracked -- these should not be committed to the public repo.

### 2. Prepare local git repo and create GitHub repo

Since goja lives inside the `00_Mundo` monorepo, we need a standalone git repo. No `gh` CLI is needed -- we use plain `git` commands and the GitHub web UI:

1. **Initialize a fresh git repo** in a temporary working directory (e.g. `/tmp/goja-publish/`).
2. **Copy all project files** from `02product/01_coding/project/goja/` into it (excluding `node_modules/`, `playwright-report/`, `test-results/`).
3. **User creates an empty repo** on [https://github.com/new](https://github.com/new) named `goja` (public, no README/license/gitignore -- we supply our own).
4. **Add remote and push**: `git remote add origin git@github.com:fingerfly/goja.git && git push -u origin main`.

The repo will contain all project files (app code, tests, scripts, config) -- standard open-source practice.

### 3. Set up GitHub Actions for Pages deployment

Since the repo will contain dev-only files (tests, scripts, playwright config) that shouldn't be served publicly, use a GitHub Actions workflow to deploy **only the app files** to Pages:

- App files to deploy: `index.html`, `sw.js`, `manifest.json`, `css/`, `js/`, `assets/`, `CHANGELOG.md`
- Files excluded from deployment: `tests/`, `scripts/`, `node_modules/`, `package.json`, `playwright.config.js`, `playwright-report/`, `test-results/`

The workflow file will be `.github/workflows/deploy.yml` and will trigger on pushes to `main`.

### 4. Push and enable Pages

- After the initial push, the GitHub Actions workflow will run automatically.
- **User enables Pages** in the repo settings: Settings > Pages > Source: "GitHub Actions".
- The site will be live at `https://fingerfly.github.io/goja/`.

### 5. Enable Pages (manual step)

After the first push, the user needs to enable GitHub Pages in the repo settings:

1. Go to [https://github.com/fingerfly/goja/settings/pages](https://github.com/fingerfly/goja/settings/pages)
2. Under "Build and deployment" > Source, select **GitHub Actions**
3. Save. The workflow will deploy on the next push (or can be re-run manually from the Actions tab).

### 6. Verify deployment

- Confirm the site loads correctly at the GitHub Pages URL.
- Verify service worker registration works.
- Verify PWA manifest and installability.

## Repo structure (after setup)

```
goja/                    (repo root)
  .github/workflows/
    deploy.yml           (GitHub Actions: deploy app to Pages)
  .gitignore
  README.md
  index.html
  sw.js
  manifest.json
  css/
    style.css
    variables.css
  js/
    app.js, layout-engine.js, ... (all JS modules)
  assets/
    logo.svg, logo-192.svg
  CHANGELOG.md
  package.json           (dev tooling -- not deployed to Pages)
  playwright.config.js   (dev tooling -- not deployed to Pages)
  scripts/               (dev tooling -- not deployed to Pages)
  tests/                 (dev tooling -- not deployed to Pages)
```

## Risks and Mitigations

- **License undefined**: The repo will be public but without a declared license, meaning "all rights reserved" by default. This is fine for now; you can add a LICENSE file later.
- **Service worker caching**: The SW cache name (`goja-v1.0.0-1`) is version-pinned. Future deploys will need the cache name bumped (your existing version scripts handle this).
- **No custom domain**: The app will be served from `github.io` subdomain. A custom domain can be added later via GitHub Pages settings.
- **No social preview**: No `og:image` or `twitter:card` meta tags. Links shared on social media won't have a rich preview. Can be added later.

