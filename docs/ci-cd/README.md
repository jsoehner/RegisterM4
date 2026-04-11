# RegisterM4 CI/CD Guide

This document explains the CI/CD model for RegisterM4, how each workflow is intended to be used, and how to extend it safely.

## Goals

The automation in this repository is designed around these goals:

1. Fast and deterministic validation for pull requests.
2. Repeatable packaging outputs for deployment handoffs.
3. Tag-driven release packaging for traceable deliveries.
4. Container build/publish flow with safe default behavior.
5. Dual-registry image publishing support (GHCR and Docker Hub).

## Workflow Inventory

All workflows are located in `.github/workflows`.

### Build and Test (`build-and-test.yml`)

Use this workflow to verify code health whenever relevant source or build config changes.

Includes:

- workspace type checking
- workspace building
- API tests

Trigger strategy uses path filters to avoid unnecessary runs.

### Package Artifacts (`package-artifacts.yml`)

Use this workflow when you need downloadable build outputs without creating a release.

It is matrix-driven and emits separate archives per target package.

### Package Release (`package-release.yml`)

Use this workflow for versioned, tag-based release archives.

On tags like `v0.2.0`, it packages and uploads artifacts to the corresponding GitHub Release.

### Docker Images (`docker-images.yml`)

Use this workflow to build API and web images and optionally push them to GHCR.

The workflow handles missing Dockerfiles by skipping those matrix entries rather than hard-failing the entire run.

### Publish Docker Images (Docker Hub) (`dockerhub-publish.yml`)

Use this workflow to publish API and web images to Docker Hub.

Behavior:

- matrix build for API and web images
- push on `main`, on `v*` tags, and manual dispatch
- image metadata tags for branch, tag, sha, and latest-on-default-branch
- validates Docker Hub secrets before publish steps

## Typical Delivery Flows

### Pull Request Flow

1. Open/update a PR.
2. Build and Test runs automatically for relevant path changes.
3. Reviewer verifies green checks before merge.

### Manual Build Artifact Flow

1. Trigger `Package Artifacts` manually.
2. Download generated archives for QA or deployment staging.

### Release Flow

1. Push a version tag (`v*`).
2. `Package Release` produces archives and attaches them to a GitHub Release.
3. `Docker Images` builds and pushes container images for matrix targets with Dockerfiles.
4. `Publish Docker Images (Docker Hub)` pushes Docker Hub images for API/web.

## Naming and Output Conventions

### Package archives

- `api-dist.tar.gz`
- `worker-dist.tar.gz`
- `shared-dist.tar.gz`
- `web-build.tar.gz`

### Docker image names

- `ghcr.io/<owner>/registerm4-api`
- `ghcr.io/<owner>/registerm4-web`

Docker Hub:

- `docker.io/<dockerhub-username>/registerm4-api`
- `docker.io/<dockerhub-username>/registerm4-web`

The image workflow lowercases the image repository path before build/push.

## Security and Permission Model

### Current permissions

- Build and package workflows require repository read access.
- Release workflow requires `contents: write`.
- Docker workflow requires `packages: write` for GHCR push.
- Docker Hub workflow uses repository secrets for registry authentication.

### Required repository secrets

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

### Recommended hardening next steps

1. Add environment protection rules for release and image push.
2. Add signed artifact checksums.
3. Add dependency and image vulnerability scanning.
4. Pin actions to SHA digests for strict supply-chain control.

## Extending the Matrix Workflows

### Add a new package artifact target

In `package-artifacts.yml`, add one matrix include entry with:

- `name`
- `archive`
- `working_directory`
- `inputs`

Then validate archive contents by running the workflow manually.

### Add a new Dockerized service

In `docker-images.yml`, add one matrix include entry with:

- `name`
- `context`
- `dockerfile`

Ensure the Dockerfile exists at the given path.

## Troubleshooting Playbook

### Build passes locally but fails in Actions

Check Node version parity (workflow uses Node 22) and dependency lock consistency (`npm ci`).

### Workflow did not run

Check whether changed files matched path filters and whether branch/tag conditions were met.

### Package archive missing files

Ensure the build step generated expected outputs in target directory (`dist` or `.next`).

### Docker workflow skipped target

Expected when Dockerfile path in matrix does not exist.

### GHCR push failure

Validate repository Actions permissions and organization package policies.

### Docker Hub push failure

Check that `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are configured and valid for push operations.

## Quick Reference

- Build and test on code change: `Build and Test`
- Manual package tarballs: `Package Artifacts`
- Release tarballs on tag: `Package Release`
- Container images: `Docker Images`
- Docker Hub images: `Publish Docker Images (Docker Hub)`
