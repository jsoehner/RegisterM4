# ADR 0003: Automated SBOM and CBOM Supply Chain Governance

* **Status:** Accepted
* **Deciders:** RegisterM4 Architecture & Security Engineering
* **Date:** 2026-10-11

---

## 1. Context & Problem Statement

Modern software supply chain attacks target upstream dependencies, container runtimes, and vulnerable cryptographic implementations. While RegisterM4 previously hardened workflow action SHAs, container non-root users, and SAST rules (ADR-0002), the repository lacked comprehensive visibility into:
1. Complete dependency manifests across application tiers and containers in machine-readable formats.
2. Cryptographic algorithm inventories, key lengths, cipher modes, and active call sites.
3. Post-Quantum Cryptography (PQC) readiness and compliance with emerging NIST and CNSA 2.0 migration standards.

To achieve complete supply chain transparency and satisfy regulatory compliance guidelines (e.g., Executive Order 14028, NIST SP 800-218 SSDF), an automated dual-engine Software Bill of Materials (SBOM) and Cryptographic Bill of Materials (CBOM) pipeline was needed.

---

## 2. Decision Drivers

1. **Dual-Format SBOM Standards**: Produce both CycloneDX JSON and SPDX JSON artifacts to interoperate with downstream enterprise security tooling.
2. **Deep Cryptographic Introspection**: Capture cryptographic primitives, ciphers, key sizes, and protocol configurations directly from source and container artifacts.
3. **AST-Based Semantic Discovery**: Augment static dependency scanning with semantic Abstract Syntax Tree (AST) analysis to identify actual cryptographic call sites across TypeScript/JavaScript and Python code.
4. **PQC Readiness Assessment**: Benchmark cryptographic implementations against post-quantum transition roadmaps (e.g., ML-KEM, ML-DSA).
5. **Continuous Verification in CI/CD**: Run automated validation harnesses in CI to enforce schema compliance, non-empty BOM guarantees, and prevent regressions.

---

## 3. Decision Outcome

Chosen Strategy: **Implement an automated dual-engine SBOM and CBOM generation pipeline in GitHub Actions (`.github/workflows/sbom-cbom.yml`), backed by local verification tooling in `scripts/`.**

### Key Architectural Components

1. **SBOM Generation (CycloneDX & SPDX)**:
   - Anchore Syft action generates `oss/sbom.cyclonedx.json` and `oss/sbom.spdx.json`.
   - Captures application packages, dependencies, and execution environments.
2. **CBOM Generation (`cbomkit`)**:
   - `cbomkit-action` inspects cryptographic components, generating `oss/cbom.json`.
3. **Semantic AST Crypto Discovery & Reconciliation**:
   - `scripts/scan_crypto_ast.py` walks the codebase to discover concrete crypto call sites (e.g., Node.js `crypto.createCipheriv`, `crypto.createDecipheriv`, `createHash`), writes `oss/crypto-callsites.json`, and reconciles missing assets into `oss/cbom.json`.
4. **PQC Readiness Analysis**:
   - `scripts/analyze_cbom.py` audits cryptographic assets against PQC migration standards, outputs `oss/crypto-analysis.json`, and writes `oss/crypto-summary.md` for GitHub Step Summaries and repository documentation.
5. **Automated Verification Harness**:
   - `scripts/test_boms.sh` validates artifact existence, JSON schema structure, component counts, and cryptographic properties.
6. **Local Developer Workflow**:
   - Local generator `scripts/generate_boms.sh` enables developers to audit SBOM and CBOM artifacts locally before committing.

---

## 4. Consequences & Trade-Offs

### Positive Consequences
* Comprehensive supply chain visibility covering both software components and cryptographic assets.
* Proactive identification of classical cryptographic algorithms requiring post-quantum transition.
* Zero-friction CI integration with automated artifact verification and summary generation.
* Compliance with standard industry formats (CycloneDX 1.5/1.6, SPDX 2.3).

### Trade-Offs & Mitigations
* Artifact generation adds ~30-45s execution time to CI workflows; mitigated by caching and selective workflow triggers.
* Local generation produces build artifacts in `oss/`; mitigated by adding `oss/` to `.gitignore`.

---

## 5. Alternatives Considered

* **Manifest-Only Scanning (`npm audit` / Dependabot)**: Lacks container runtime package visibility and completely ignores cryptographic asset enumeration.
* **Single SBOM Format (CycloneDX only or SPDX only)**: Rejected because enterprise compliance partners and vulnerability analyzers require both CycloneDX and SPDX.
* **Manual Cryptographic Auditing**: Rejected as static, quickly outdated, and unable to enforce pull request gating.
