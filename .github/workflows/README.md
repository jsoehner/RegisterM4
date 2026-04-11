# CI/CD Workflows for RegisterM4

This directory contains the GitHub Actions automation for validation, packaging, and container image workflows.

## Overview

The workflow set is designed to support three common delivery tracks:

1. Code quality and safety checks for pull requests and main branch updates.
2. Build artifact packaging for manual retrieval and downstream deployment.
3. Container image build and publish flow for API and web services.

## Workflow Catalog

### 1) Build and Test

- File: `build-and-test.yml`
- Purpose: Validate the monorepo with type checks, full builds, and API tests.
- Triggers:
  - Push to `main` with path filtering.
  - Pull requests with path filtering.
- Path filters include:
  - `apps/**`
  - `packages/**`
  - `scripts/**`
  - `package.json`
  - `package-lock.json`
  - `tsconfig.base.json`
  - `.github/workflows/**`

#### Job behavior

- Installs dependencies with `npm ci`.
- Runs workspace type checks.
- Runs workspace builds.
- Executes API tests (`@sra/api`).

### 2) Package Artifacts

- File: `package-artifacts.yml`
- Purpose: Produce distributable tarballs for each workspace package.
- Trigger:
  - Manual run via `workflow_dispatch`.
- Packaging style:
  - Matrix job with one archive per package.
  - Separate artifacts are uploaded per package for easier consumption.

#### Matrix targets

- `api`: `apps/api` -> `api-dist.tar.gz`
- `worker`: `apps/worker` -> `worker-dist.tar.gz`
- `shared`: `packages/shared` -> `shared-dist.tar.gz`
- `web`: `apps/web` -> `web-build.tar.gz`

#### Included files

- API/Worker/Shared: `dist`, `package.json`
- Web: `.next`, `package.json`, `next.config.js`

### 3) Package Release

- File: `package-release.yml`
- Purpose: Build release archives and attach them to GitHub Releases.
- Trigger:
  - Git tags matching `v*`.
- Permissions:
  - `contents: write` for release publishing.
- Action used:
  - `softprops/action-gh-release@v2`

#### Release assets

- `out/api-dist.tar.gz`
- `out/worker-dist.tar.gz`
- `out/shared-dist.tar.gz`
- `out/web-build.tar.gz`

### 4) Docker Images

- File: `docker-images.yml`
- Purpose: Build Docker images for API and web, and optionally publish to GHCR.
- Triggers:
  - Push to `main` and `v*` tags with path filtering.
  - Pull requests with path filtering.
  - Manual run (`workflow_dispatch`) with `push_images` boolean input.

#### Matrix targets

- API image:
  - Context: `apps/api`
  - Dockerfile: `apps/api/Dockerfile`
- Web image:
  - Context: `apps/web`
  - Dockerfile: `apps/web/Dockerfile`

#### Publish rules

- Pull requests: build only (no push).
- `v*` tags: build and push to GHCR.
- Manual dispatch: push only if `push_images=true`.
- Missing Dockerfiles are handled gracefully with a skip message.

## Image Naming Convention

Images are published to GHCR using lowercase repository names:

- `ghcr.io/<owner>/registerm4-api`
- `ghcr.io/<owner>/registerm4-web`

The workflow normalizes owner/repository casing to avoid GHCR naming failures.

## Required Repository Settings

### Actions permissions

Ensure GitHub Actions can write packages for container publishing:

- Repository Settings -> Actions -> General -> Workflow permissions
- Recommended: `Read and write permissions`

### Default token

The Docker workflow uses `${{ secrets.GITHUB_TOKEN }}` for GHCR pushes.
No custom PAT is required unless your organization policy restricts package writes.

## Operational Runbook

### Running Build and Test

- Automatic via pull requests and pushes to main for matching paths.

### Running Artifact Packaging

1. Open GitHub -> Actions -> Package Artifacts.
2. Click "Run workflow".
3. Download artifacts from the run summary.

### Running Release Packaging

1. Create and push a tag like `v0.1.1`.
2. Wait for `Package Release` to complete.
3. Confirm release assets attached under the tag release.

### Running Docker Builds

1. Manual build without push:
   - Run `Docker Images` with default input.
2. Manual build with push:
   - Run `Docker Images` with `push_images=true`.
3. Tag-based push:
   - Push a tag like `v0.1.1`.

## Troubleshooting

### Workflow not triggered

- Confirm changed files match path filters.
- Confirm branch/tag matches workflow trigger conditions.

### Artifact archive step fails

- Confirm workspace build produced expected outputs (`dist` or `.next`).
- Confirm package paths have not changed from the matrix configuration.

### Docker step skipped

- Check for missing Dockerfile at expected matrix path.
- Add Dockerfiles:
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`

### GHCR push denied

- Verify workflow permission allows package write.
- Verify organization policies allow package publishing from Actions.

## Maintenance Guidance

When adding new packages/services:

1. Add path filters where needed.
2. Extend `package-artifacts.yml` matrix with package archive settings.
3. Extend `docker-images.yml` matrix if service has a Dockerfile.
4. Keep this README updated with new runbooks and expected outputs.

## Security Notes

- Workflows use pinning by major action versions; update regularly.
- Avoid injecting plaintext secrets into build logs.
- For production release hardening, consider:
  - Artifact checksums and signed provenance.
  - Environment protection rules for release/tag workflows.
  - Dependency and image vulnerability scanning jobs.
