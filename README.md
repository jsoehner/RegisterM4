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
