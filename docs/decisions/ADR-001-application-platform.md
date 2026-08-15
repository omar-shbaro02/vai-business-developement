# ADR-001 — Application platform and repository

**Status:** APPROVED  
**Date:** 2026-08-15

Use a Git monorepo with pnpm workspaces and strict TypeScript. Maintain separate Next.js web and Fastify API applications, shared domain/contracts packages, and a worker runtime. Generate OpenAPI from runtime-validated schemas. Package deployable processes as OCI containers.

This keeps business rules outside the UI, permits independent API testing, and provides one language across contracts and applications. Framework and runtime versions will be pinned and recorded when implementation begins.
