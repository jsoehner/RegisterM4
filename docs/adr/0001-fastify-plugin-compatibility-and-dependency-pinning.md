# ADR 0001: Fastify 4 Ecosystem Plugin Compatibility and Dependency Pinning

* **Status:** Accepted
* **Deciders:** RegisterM4 Core Engineering
* **Date:** 2026-09-19

---

## 1. Context & Problem Statement

In automated dependency updates, `@fastify/cors` was upgraded from major version 9.x to 11.x.
However, the core application framework in `apps/api` is built on Fastify `^4.28.1`.
`@fastify/cors` version 10.x and 11.x target Fastify 5.x+, causing fastify-plugin version mismatch runtime errors:
```
fastify-plugin: @fastify/cors - expected '5.x' fastify version, '4.29.1' is installed
code: 'FST_ERR_PLUGIN_VERSION_MISMATCH'
```
This error caused automated test suite failures in the GitHub Actions `Build and Test` pipeline (`apps/api/test/api.integration.test.ts`).

---

## 2. Decision Drivers

1. **Framework Stability**: Retain tested Fastify 4.x runtime architecture without introducing breaking API changes from Fastify 5.x until a planned major upgrade.
2. **Deterministic CI/CD**: Ensure all integration tests in `Build and Test` execute cleanly on PRs and `main`.
3. **Automated Dependency Guardrails**: Pin plugins to major version streams compatible with the underlying framework version.

---

## 3. Decision Outcome

Chosen Strategy: **Align `@fastify/cors` to `^9.0.1` (the LTS major version compatible with Fastify 4.x) and regenerate `package-lock.json`.**

### Key Architectural Actions

1. **Dependency Alignment**:
   - Specified `@fastify/cors: ^9.0.1` in `apps/api/package.json`.
   - Updated `package-lock.json` lockfile entries to resolve the 9.x stream.
2. **Testing & Validation**:
   - Validated package-lock integrity to ensure clean execution under `npm ci`.

---

## 4. Consequences & Trade-Offs

### Positive Consequences
* Resolved `FST_ERR_PLUGIN_VERSION_MISMATCH` errors across all Fastify route plugins.
* Integration and unit tests pass reliably in the CI pipeline.

### Future Work
* Schedule Fastify 5 upgrade as a coordinated epic across all workspace apps (`@sra/api`, `@sra/worker`, `@sra/web`).
