# ADR-003 — Authentication and authorization

**Status:** APPROVED  
**Date:** 2026-08-15

Authenticate through an OIDC-compatible provider. Enforce tenant scope and role/capability policy in the API. A local development identity adapter is allowed only outside pilot and production environments.

UI controls improve usability but never serve as authorization. Material state changes require authenticated actor identity and an audit event.
