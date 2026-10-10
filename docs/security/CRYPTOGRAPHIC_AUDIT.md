## 🛡️ Cryptographic Bill of Materials (CBOM) & PQC Migration Assessment

**Format**: CycloneDX (v1.6) | **First-Party Code Crypto Assets**: 2 | **Total Tracked Crypto Assets**: 2

### 📊 Post-Quantum Migration Scorecard

| Metric | Count | Migration Status |
|---|---|---|
| **Post-Quantum Ready (PQC)** | **0** | 🟢 Quantum-Resistant (NIST FIPS 203/204/205) |
| **Quantum-Vulnerable (Backlog)** | **0** | 🔴 At Risk of 'Harvest Now, Decrypt Later' |
| **Classical Symmetric / Hashing** | **2** | 🟡 Classical Security (Requires AES-256 / SHA-256+) |
| **Asymmetric PQC Migration Progress** | **N/A (0 detected)** | (No asymmetric primitives detected in current scope) |

### 🎯 Cryptographic Supply Chain Coverage & Confidence

| Evaluation Layer | Coverage / Status | Audit Confidence Assessment |
|---|---|---|
| **First-Party Code (`src/`)** | **100% Audited** (0 Custom Primitives) | 🟢 **HIGH** (Direct AST & SAST verified clean) |
| **Third-Party Supply Chain** | **0.0%** (0 of 158 dependencies cataloged) | 🔴 LOW (Known profiles assimilated) |
| **Overall Audit Confidence Score** | **0.6%** | **🔴 LOW** (158 unassimilated supply chain dependencies) |

### ✅ Post-Quantum Cryptography Migrated Assets

> ⚠️ **No Post-Quantum Ready assets detected.** Immediate migration planning recommended for asymmetric key exchanges and digital signatures.

### ⚠️ Quantum-Vulnerable Assets & Remediation Plan

> ℹ️ **No quantum-vulnerable asymmetric assets found.** No asymmetric cryptographic primitives were detected in current scope.

### 🔒 Classical Symmetric & Digest Assets

| Component Name | Primitive | Key Length | Quantum Resistance Assessment | Provenance / Location(s) |
|---|---|---|---|---|
| `SHA-256` | hash | 256 | Quantum-Resistant (Grover's proof) | First-Party Code (SAST/AST)<br>`apps/api/src/security.ts:5`<br>`apps/api/src/security.ts:10`<br>`apps/api/src/security.ts:19` |
| `AES-256-GCM` | block-cipher | 256 | Quantum-Resistant (Grover's proof) | First-Party Code (SAST/AST)<br>`apps/api/src/security.ts:26`<br>`apps/api/src/security.ts:44` |

### ⚠️ Unassimilated Third-Party Binaries & Cryptographic Blind Spots

> ℹ️ *The following third-party dependencies do not have verified upstream CBOM attestations in the catalog. They lower the audit confidence score until explicit CBOMs or attestations are published.* 

| Dependency Name | Version | Package URL (purl) | Status |
|---|---|---|---|
| `@emnapi/runtime` | 1.11.3 | `pkg:npm/%40emnapi/runtime@1.11.3` | 🟡 Unassimilated (No upstream CBOM) |
| `@fastify/ajv-compiler` | 4.0.6 | `pkg:npm/%40fastify/ajv-compiler@4.0.6` | 🟡 Unassimilated (No upstream CBOM) |
| `@fastify/cors` | 10.1.0 | `pkg:npm/%40fastify/cors@10.1.0` | 🟡 Unassimilated (No upstream CBOM) |
| `@fastify/error` | 4.2.0 | `pkg:npm/%40fastify/error@4.2.0` | 🟡 Unassimilated (No upstream CBOM) |
| `@fastify/fast-json-stringify-compiler` | 5.1.0 | `pkg:npm/%40fastify/fast-json-stringify-compiler@5.1.0` | 🟡 Unassimilated (No upstream CBOM) |
| `@fastify/forwarded` | 3.0.2 | `pkg:npm/%40fastify/forwarded@3.0.2` | 🟡 Unassimilated (No upstream CBOM) |
| `@fastify/merge-json-schemas` | 0.2.1 | `pkg:npm/%40fastify/merge-json-schemas@0.2.1` | 🟡 Unassimilated (No upstream CBOM) |
| `@fastify/proxy-addr` | 5.1.1 | `pkg:npm/%40fastify/proxy-addr@5.1.1` | 🟡 Unassimilated (No upstream CBOM) |
| `@img/colour` | 1.1.0 | `pkg:npm/%40img/colour@1.1.0` | 🟡 Unassimilated (No upstream CBOM) |
| `@img/sharp-darwin-arm64` | 0.35.5 | `pkg:npm/%40img/sharp-darwin-arm64@0.35.5` | 🟡 Unassimilated (No upstream CBOM) |
| `@img/sharp-darwin-x64` | 0.35.5 | `pkg:npm/%40img/sharp-darwin-x64@0.35.5` | 🟡 Unassimilated (No upstream CBOM) |
| `@img/sharp-freebsd-wasm32` | 0.35.5 | `pkg:npm/%40img/sharp-freebsd-wasm32@0.35.5` | 🟡 Unassimilated (No upstream CBOM) |
| `@img/sharp-libvips-darwin-arm64` | 1.3.4 | `pkg:npm/%40img/sharp-libvips-darwin-arm64@1.3.4` | 🟡 Unassimilated (No upstream CBOM) |
| `@img/sharp-libvips-darwin-x64` | 1.3.4 | `pkg:npm/%40img/sharp-libvips-darwin-x64@1.3.4` | 🟡 Unassimilated (No upstream CBOM) |
| `@img/sharp-libvips-linux-arm` | 1.3.4 | `pkg:npm/%40img/sharp-libvips-linux-arm@1.3.4` | 🟡 Unassimilated (No upstream CBOM) |
| *... and 143 more unassimilated dependencies* | | | |
