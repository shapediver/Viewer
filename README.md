![logo](https://shapediver.com/imgs/logo-black.png "ShapeDiver")

# Viewer

This repository is the main monorepo for the ShapeDiver Viewer.
The primary published package is `@shapediver/viewer`, with many supporting internal/public packages built and released from the same repository.

If you are consuming the public viewer API, see the hosted docs:
- https://viewer.shapediver.com/v3/latest/api/index.html

---

## Toolchain

This repo is pinned to the following toolchain:

- **Node**: `24.12.0`
- **npm**: `11.6.2`
- **pnpm**: `11.3.0`

Repo helpers:
- `.nvmrc` → `24.12.0`
- `package.json` → `packageManager: pnpm@11.3.0`

### Setup

1. Install Node `24.12.0`
2. Ensure npm is `11.6.2`
3. Ensure pnpm is `11.3.0`
4. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

### Bash shell on Windows

Some package scripts still rely on bash-based helpers.
If you are on Windows, make sure npm uses a bash-compatible shell, for example:

```bash
npm config set script-shell "PATH\\TO\\Git\\bin\\bash.exe"
```

---

## Workspace structure

The repo uses:
- **pnpm workspaces**
- **lerna** (fixed-version mode)

Main workspace groups include:
- `api/*`
- `creation-control-center/*`
- `data-engine/*`
- `features/*`
- `rendering-engine/*`
- `session-engine/*`
- `shared/*`
- `examples/*`
- `tests`

The `utils/*` packages are intentionally outside the main release workflow scope.

---

## Common commands

### Build

```bash
pnpm build
```

Builds the main viewer package and its workspace dependencies.

### Type checks

```bash
pnpm check
pnpm check:scripts
```

- `pnpm check` validates workspace packages
- `pnpm check:scripts` typechecks the workflow/release/deploy helper scripts under `scripts/`

### Build test assets

```bash
pnpm build-tests
```

### Build examples

```bash
pnpm build-examples
```

### Generate docs

```bash
pnpm doc
```

---

## Testing

### Full Playwright run

```bash
pnpm test
```

### Install Playwright browser

```bash
pnpm test-install
```

### Smoke check deployed test-cdn

```bash
pnpm test:smoke-cdn
```

This opens the deployed `test-cdn` page and verifies that `window.SDV.createViewport` is available before the full Playwright suite runs.

### UI mode

```bash
pnpm test-ui
```

### Update snapshots

```bash
pnpm test-update
```

### Smaller regression subset

```bash
pnpm test-samples-only
```

This currently runs:
- animation
- api
- attributes
- camera
- interaction
- parameters

### Environment-aware test target

The Playwright configuration now resolves the target base URL from the workflow or environment:

- `development` → `https://viewer.shapediver.com/v3/development`
- `staging` → `https://viewer.shapediver.com/v3/staging`
- `production` / `latest` → `https://viewer.shapediver.com/v3/latest`

You can also override explicitly:

```bash
VIEWER_TEST_BASE_URL=https://viewer.shapediver.com/v3/staging pnpm test
```

---

## Version / release helper scripts

### Build metadata

```bash
pnpm generate-build-data
```

### Compute next versions

```bash
pnpm version:dev
pnpm version:next
pnpm version:release:patch
pnpm version:release:minor
pnpm version:release:major
```

### Apply a version to all lerna-managed packages

```bash
pnpm version:apply -- --version 3.20.0-dev.1 --channel dev --yes
```

### S3 deployment helpers

```bash
pnpm deploy:s3 -- --channel dev --version 3.20.0-dev.1 --source-dir ./dist --dry-run
pnpm deploy:promote-latest -- --from-version 3.20.0 --dry-run
```

### Publishing helpers

```bash
pnpm publish:github -- --tag dev --dry-run
pnpm publish:npm -- --dry-run
```

### Local release helper

```bash
pnpm publish:viewer
```

This is the local interactive wrapper around the new release scripts.
It is intended for controlled local releases and follows the same high-level sequence as the production workflow:
- compute version
- version packages
- generate build data
- build
- deploy versioned assets
- test
- publish
- promote latest
- commit and tag

The legacy alias `pnpm publish-viewer` still works but delegates to the normalized path.

---

## Script naming conventions

Normalized script names use colon-separated prefixes:
- `publish:*` — publishing scripts
- `deploy:*` — deployment scripts
- `test:*` — test orchestration scripts
- `version:*` — version computation scripts

Legacy hyphenated aliases are preserved for backward compatibility:
- `publish-viewer` → `publish:viewer`
- `deploy-example` → `deploy:example`
- `deploy-tests` → `deploy:tests`
- `deploy-and-test` → `test:deploy-and-test`
- `deploy-and-test-samples-only` → `test:deploy-and-test-samples-only`

---

## GitHub Actions release model

This repository is **push-driven**.
There is no standalone generic CI workflow.
Validation is built into the release/deployment workflows.

### Channels

#### development
- branch: `development`
- package tag: `dev`
- test target: `v3/development`
- publishes to: **GitHub Packages only**

#### staging
- branch: `staging`
- package tag: `next`
- test target: `v3/staging`
- publishes to: **GitHub Packages only**

#### release
- branch: `main`
- package tag: `latest`
- deploy target: `v3/<version>` then `v3/latest`
- publishes to:
  - **GitHub Packages**
  - **npm**
  - **GitHub Releases** (auto-generated notes, with required manual notes prepended)

### Workflows

- `.github/workflows/development.yml`
- `.github/workflows/staging.yml`
- `.github/workflows/full-tests.yml`
- `.github/workflows/release.yml`

Development and staging workflows run a small smoke check against `test-cdn` before starting the sharded `test-samples-only` Playwright subset (`tests/animation`, `tests/api`, `tests/attributes`, `tests/camera`, and `tests/parameters`). This catches broken or stale deployments early and keeps push-driven channel deployments reasonably fast while still exercising core viewer behavior. The drag interaction test is left to the full nightly/release suite instead of the fast development/staging subset.

`full-tests.yml` runs nightly on `main` and can also be triggered manually. It checks the exact commit SHA for a successful `viewer/full-playwright` commit status. If that status already exists, the workflow skips. Otherwise it builds the current commit, deploys the test CDN to `v3/latest/test-cdn`, runs the full sharded Playwright suite against `v3/latest`, and records `viewer/full-playwright` on that exact source commit.

`release.yml` uses the same exact-commit status gate. A production release checks `viewer/full-playwright` on the source commit being released. If full tests already passed for that SHA, the expensive Playwright suite is skipped; if not, the release workflow deploys `v3/latest/test-cdn`, runs the full suite, records the status, and only then continues. Versioned release assets under `v3/<version>` are deployed after the full-test gate passes and before package publishing/promoting `latest`, so a failed full-test run does not leave a partially deployed versioned release. The release commit/tag created by the workflow is intentionally after this gate; the certified commit is the source commit that triggered the release.

---

## Publishing auth

### GitHub Packages
Handled in workflows via GitHub Actions auth and `setup-node` registry configuration.

For CI installs, workspace-managed `@shapediver/viewer*` packages are linked locally by pnpm/lerna, while external `@shapediver/*` packages outside the workspace (for example `utils/*` packages published independently) are installed from npmjs.org. GitHub Packages is used only for publish steps.

### npm
The intended production setup is **npm Trusted Publishing** using:
- workflow file: `release.yml`
- environment: `production`

**Local one-time setup:** Create a local (untracked) `trust.sh` script to configure npm trusted publishers for the release-managed packages. This file is intentionally excluded from version control and should be run once locally after `release.yml` is deployed to GitHub.

See your local `trust.sh` for the package list and publisher configuration. The script requires `npm` CLI `11.5.1+` and Node `22.14.0+`. The `npm trust` subcommand is included in npm 11+.

### AWS / S3
Deployment uses AWS OIDC via the `AWS_ROLE_ARN` secret and GitHub environments.

---

## Notes

- `shared/build-data/src/build_data.ts` is generated at build time and is not committed.
- Example packages are private and are not published by the main workflows.
- The `utils/*` packages are not part of the main lerna release workflow.

---

## FAQ

### Why do tests use deployed URLs instead of localhost?
Because the current Playwright suite is deployment-oriented and validates the built viewer as served from environment-specific URLs.

### Why is `latest` only updated from release?
To avoid non-production branches mutating the stable public channel.

### Why are there separate development / staging / release workflows?
Because each channel has different rules for:
- version naming
- target paths
- publishing destinations
- approval requirements
