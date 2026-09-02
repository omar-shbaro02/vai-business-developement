# Governed Source Register

**Policy version:** governance/0.1  
**Reviewed:** 2026-09-02

| Source mode           | State    | Owner                       | Approval basis                     | Required control                                                                                 | Retention/deletion                                       |
| --------------------- | -------- | --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Manual research/entry | ENABLED  | VAI commercial owner        | Approved `DATA-GOVERNANCE.md` v0.2 | User attests permitted business purpose; provenance and actor recorded                           | Apply class-specific review; contact review at 12 months |
| CSV import            | ENABLED  | VAI commercial owner        | DEC-032                            | Importer attestation, streaming validation, row errors, provenance                               | Raw upload review/deletion after 30-day error window     |
| External connector    | DISABLED | Unassigned pending approval | DEC-004 and TASK 032               | Terms/licensing, allowed fields, credential scope, refresh limit, and deletion approval required | Must be approved before activation                       |
| AI provider           | DISABLED | Unassigned pending approval | `DATA-GOVERNANCE.md` v0.2          | DPA, retention, region, training-use, payload-minimization approval required                     | Provider-specific approval required                      |

No external connector or AI provider is enabled. This register does not convert TASK 032 into an approval.
