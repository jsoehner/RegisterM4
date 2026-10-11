# RegisterM4

This repository starts implementation for a service that lets users:

- Add third-party site link + credentials
- Verify login viability
- Schedule registration attempts by weekday/time
- Send email outcome notifications

## Project Layout

- apps/api: Fastify API for users, credentials, schedules, and attempts
- apps/worker: Worker placeholder for browser automation execution
- apps/web: Next.js frontend starter
- packages/shared: Shared TypeScript types

## Quick Start

1. Copy `.env.example` to `.env` in `apps/api`.
2. Install dependencies from repo root:

   ```bash
   npm install
   ```

3. Run API:

   ```bash
   npm run dev:api
   ```

4. Run web:

   ```bash
   npm run dev:web
   ```

## Notes

- Current implementation uses file-backed JSON storage for speed of setup.
- Credential verification and registration execution are scaffolded with adapter-based stubs and are intentionally conservative.
- Do not use this MVP starter in production without replacing storage, secret management, and adapter hardening.

## CI/CD

- Workflow and runbook documentation: `/.github/workflows/README.md`
- Extended CI/CD operations guide: `/docs/ci-cd/README.md`

## 🛡️ Security & Cryptographic Posture

This project tracks Software & Cryptographic Bill of Materials (SBOM & CBOM) and Post-Quantum Cryptography (PQC) readiness. See the latest [Cryptographic Audit & PQC Migration Report](docs/security/CRYPTOGRAPHIC_AUDIT.md).

## Automated SBOM & CBOM Supply Chain Pipeline

RegisterM4 incorporates an automated Software Bill of Materials (SBOM) and Cryptographic Bill of Materials (CBOM) governance pipeline to satisfy software supply chain security standards (Executive Order 14028, NIST SP 800-218 SSDF) and post-quantum readiness.

For architectural decisions and context, see [ADR 0003: Automated SBOM and CBOM Supply Chain Governance](docs/adr/0003-automated-sbom-cbom-supply-chain-governance.md).

### CI/CD Workflow Stages

The GitHub Actions workflow [`.github/workflows/sbom-cbom.yml`](.github/workflows/sbom-cbom.yml) executes on pushes to `main`, tags, and pull requests:

1. **Dual-Format SBOM Generation**: Employs Anchore/Syft to generate standard CycloneDX (`oss/sbom.cyclonedx.json`) and SPDX (`oss/sbom.spdx.json`) dependency manifests.
2. **CBOM Generation**: Uses `cbomkit-action` to discover cryptographic libraries, algorithms, key lengths, and protocols into `oss/cbom.json`.
3. **Semantic AST Crypto Scan & Reconciliation**: Runs `scripts/scan_crypto_ast.py` to identify concrete cryptographic callsites in source code and reconcile missing assets into the CBOM.
4. **Automated Verification Harness**: Executes `scripts/test_boms.sh` to validate schema structure, component counts, and non-empty guarantees.
5. **PQC Readiness Analysis**: Runs `scripts/analyze_cbom.py` to evaluate post-quantum cryptography transition timelines (NIST/CNSA 2.0) and publishes audit summaries to GitHub Step Summaries and `docs/security/CRYPTOGRAPHIC_AUDIT.md`.
6. **Artifact Upload**: Retains all generated BOM assets as workflow artifacts.

### Local Script Usage

Developers can inspect, generate, and verify bills of materials locally:

```bash
# Generate SBOM, CBOM, and run AST crypto reconciliation
bash scripts/generate_boms.sh

# Run AST cryptographic call-site scanner directly
python3 scripts/scan_crypto_ast.py . --cbom oss/cbom.json --output-json oss/crypto-callsites.json

# Analyze CBOM for quantum safety and migration timelines
python3 scripts/analyze_cbom.py oss/cbom.json --sbom oss/sbom.cyclonedx.json --markdown oss/crypto-summary.md

# Run test verification harness
bash scripts/test_boms.sh oss
```
