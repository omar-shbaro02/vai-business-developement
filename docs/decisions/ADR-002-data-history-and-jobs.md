# ADR-002 — Data, history, and background jobs

**Status:** APPROVED  
**Date:** 2026-08-15

Use PostgreSQL as the source of truth with explicit migrations and a Drizzle-based data-access layer. Store decisions and audit events append-only. Use transactionally created PostgreSQL job/outbox records with idempotency keys and bounded retries for MVP background work.

This avoids an additional queue dependency during the pilot while preserving reliable processing. Re-evaluate a dedicated queue only when measured workload or latency requires it.
