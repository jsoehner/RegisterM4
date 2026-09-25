# ADR 0002: Consolidate Security Governance, Pin Action SHAs, and Harden Crypto and Containers

* **Status:** Accepted
* **Deciders:** RegisterM4 Architecture & Security Engineering
* **Date:** 2026-09-25

---

## 1. Context & Problem Statement

A security and SAST audit identified multiple supply-chain, cryptography, and container security concerns across `RegisterM4`:
1. **Redundant & Conflicting Security Workflows**: An unhardened `.github/workflows/security-testing.yml` from a previous template install conflicted with unified security governance policies.
2. **Mutable GitHub Actions Tags**: Multiple CI/CD workflows (`build-and-test.yml`, `dockerhub-publish.yml`, `docker-images.yml`, `package-artifacts.yml`, `package-release.yml`) referenced mutable action tags (`@v4`, `@v3`, `@v5`, `@v6`, `@v2`), exposing pipelines to tag hijacking and supply chain threats.
3. **CWE-78 Shell Script Injection**: `.github/workflows/package-artifacts.yml` interpolated matrix parameters directly into inline `run:` bash steps.
4. **CWE-327 / CWE-347 Missing Authentication Tag Length**: `apps/api/src/security.ts` initialized `crypto.createDecipheriv("aes-256-gcm", key, iv)` without explicit authentication tag length verification (`{ authTagLength: 16 }`).
5. **Container Root Execution**: `apps/api/Dockerfile` and `apps/web/Dockerfile` ran processes under the default `root` user (`missing-user` finding).
6. **Dependabot Cooldown Missing**: `.github/dependabot.yml` lacked cooldown periods for package updates.

---

## 2. Decision Drivers

1. **Supply Chain Immutability**: All third-party GitHub Actions must reference immutable 40-character commit SHAs.
2. **Cryptographic Integrity**: Enforce explicit 16-byte authentication tag lengths in AES-GCM decryption routines to prevent truncated tag forgery attacks.
3. **Defensive Containerization**: Enforce least-privilege process execution by using standard non-root `node` users in Docker images.
4. **Single Authoritative Governance Pipeline**: Centralize security scanning and automated gatekeeping under `security-governance.yml`.
5. **Zero Semgrep Findings**: Achieve clean SAST execution across all repository targets.

---

## 3. Decision Outcome

Chosen Strategy: **Deploy unified `security-governance.yml` with `adr_security_gatekeeper.py`, remove legacy `security-testing.yml`, pin all workflow action tags to commit SHAs, isolate matrix inputs in runner environment variables, add explicit `authTagLength: 16` to AES-256-GCM deciphering, add `USER node` to Dockerfiles, and configure Dependabot cooldown.**

### Key Architectural Actions

1. **Security Workflow Consolidation**:
   - Removed `.github/workflows/security-testing.yml`.
   - Added `.github/workflows/security-governance.yml` incorporating Gitleaks secret detection, Semgrep SAST, Trivy CVE scanning, and Python ADR gatekeeping.
   - Deployed `scripts/adr_security_gatekeeper.py` to audit pull request diffs.
2. **Action SHA Pinning**:
   - Pinned `actions/checkout` to `11d5960a326750d5838078e36cf38b85af677262` (`v4.2.2`).
   - Pinned `actions/setup-node` to `49933ea5288caeca8642d1e84afbd3f7d6820020` (`v4.4.0`).
   - Pinned `actions/upload-artifact` to `ea165f8d65b6e75b540449e92b4886f43607fa02` (`v4.6.2`).
   - Pinned `docker/setup-buildx-action` to `8d2750c68a42422c14e847fe6c8ac0403b4cbd6f` (`v3`).
   - Pinned `docker/login-action` to `dbcb813823bdd20940b903addbd779551569679f` (`v4.6.0`).
   - Pinned `docker/metadata-action` to `c299e40c65443455700f0fdfc63efafe5b349051` (`v5`).
   - Pinned `docker/build-push-action` to `10e90e3645eae34f1e60eeb005ba3a3d33f178e8` (`v6`).
   - Pinned `softprops/action-gh-release` to `3bb12739c298aeb8a4eeaf626c5b8d85266b0e65` (`v2.2.1`).
3. **Remediate Script Injection**:
   - Refactored `package-artifacts.yml` archive step to pass `ARCHIVE_NAME`, `WORKING_DIR`, and `INPUT_FILES` through step `env:`.
4. **Cryptographic Hardening**:
   - Added `{ authTagLength: 16 }` to `crypto.createDecipheriv("aes-256-gcm", key, iv, ...)` in `apps/api/src/security.ts`.
5. **Container Least Privilege**:
   - Configured `USER node` in `apps/api/Dockerfile` and `apps/web/Dockerfile`.
6. **Dependabot Configuration**:
   - Added `cooldown: default-days: 7` in `.github/dependabot.yml`.

---

## 4. Consequences & Trade-Offs

### Positive Consequences
* Eliminated 24 Semgrep blocking findings down to 0 findings.
* Robust protection against tag spoofing, command injection, and truncated tag forgery.
* Clean separation of concerns with unified security governance.

---

## 5. Validation

- [x] Semgrep scan completed with 0 findings across all 47 repository files.
- [x] Automated ADR Gatekeeper script verified against staged changes.
- [x] All workflows verified syntactically valid YAML.
