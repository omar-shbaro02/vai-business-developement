# ADR-004 — AI adapter and deterministic fallback

**Status:** APPROVED  
**Date:** 2026-08-15

Place all AI calls behind a provider-neutral interface with operation-specific versioned contracts. Validate structured output before persistence, retain evidence lineage and generation metadata, and store output as inference. AI is disabled unless explicitly configured.

Qualification, confidence, priority, authorization, and lifecycle transitions remain deterministic. Every user-facing AI explanation has a deterministic fallback.
