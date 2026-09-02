# Pilot Readiness Review

**Prepared:** 2026-09-02  
**Gate:** TASK 122  
**Status:** AWAITING APPROVAL — NOT READY TO START PILOT

## Executive assessment

The application and decision-quality test suites pass, the approved pilot boundaries and success thresholds are frozen, and residual risks are documented. The pilot cannot start yet because pilot users are not named and deployment-critical controls have not been demonstrated in the pilot environment.

This record does not approve pilot access, enable TASK 032, or authorize an external connector or AI provider.

## Frozen pilot scope

| Dimension           | Approved scope                                                                                  | Basis             |
| ------------------- | ----------------------------------------------------------------------------------------------- | ----------------- |
| Geography           | Northern Virginia: Arlington, Alexandria, Fairfax County, Loudoun County, Prince William County | DEC-001           |
| Industries          | Professional services; B2B technology/services; trade/logistics                                 | DEC-002           |
| Discovery sources   | Manual entry and CSV import only                                                                | DEC-003           |
| External connectors | Disabled/deferred                                                                               | DEC-004, TASK 032 |
| CRM writes          | Excluded                                                                                        | DEC-005           |
| Duration            | Six weeks after readiness approval                                                              | DEC-016           |
| Priority rules      | `priority/0.1`                                                                                  | DEC-011A          |

## Frozen success criteria

DEC-017 is the binding pilot success definition:

1. At least 90% of priority decisions are traceable to evidence.
2. Median discovery-to-qualified-decision time improves by at least 25% from a measured pre-pilot baseline.
3. Zero unapproved automated commercial actions occur.
4. Critical-user decision-usefulness rating is at least 4/5.

Required measurement setup before day one:

- capture the baseline period and median discovery-to-decision time;
- define the traceability denominator and exclusion rules;
- identify critical workflows/users included in the usefulness survey;
- record automated-action incidents with a zero-tolerance threshold;
- freeze metric version, cohort dates, and report owner.

## Pilot users

DEC-015 requires four named users:

| Role             | Required count | Name         | Identity/role verification |
| ---------------- | -------------: | ------------ | -------------------------- |
| Commercial owner |              1 | **TBD**      | Pending                    |
| BD operator      |              2 | **TBD, TBD** | Pending                    |
| Reviewer         |              1 | **TBD**      | Pending                    |

Names must be provided by Omar/VAI. Individual OIDC identities, tenant assignment, least-privilege roles, and offboarding ownership must be verified before access.

## Gate evidence

| Requirement                   | Result                                            | Evidence                                                                                                                    |
| ----------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Critical repository tests     | PASS                                              | Full formatting, lint, strict typecheck, unit/contract/integration suites, migrations, recovery, and production builds pass |
| Approved priority regressions | PASS                                              | `DECISION-QUALITY-REVIEW.md`; eight fixtures under `priority/0.1`                                                           |
| Security review               | REVIEW COMPLETE / DEPLOYMENT BLOCKED              | `SECURITY-REVIEW.md`                                                                                                        |
| Data-governance review        | REVIEW COMPLETE / ADAPTERS BLOCKED                | `DATA-GOVERNANCE-REVIEW.md`, `SOURCE-REGISTER.md`                                                                           |
| Backup/recovery               | LOCAL EXERCISE PASS / PILOT EXERCISE BLOCKED      | `BACKUP-RECOVERY-EXERCISE.md`                                                                                               |
| Accessibility                 | PRESENTATION REVIEW PASS / DEPLOYED CHECK PENDING | `ACCESSIBILITY-REVIEW.md`                                                                                                   |
| Residual risks                | DOCUMENTED                                        | This record and the four review records above                                                                               |
| Pilot users named             | BLOCKED                                           | Names not supplied                                                                                                          |
| Success criteria frozen       | PASS                                              | DEC-017; measurement baseline still required                                                                                |

## Blocking actions

The following must close before human pilot approval:

1. Supply the four pilot-user names and verify individual identities/roles.
2. Wire and negatively test the OIDC adapter: signature, issuer, audience, expiry, tenant, and role mapping.
3. Provision and review least-privilege runtime/migration credentials with encrypted database transport.
4. Configure distributed/gateway rate limiting and trusted-proxy handling for the pilot topology.
5. Implement and integration-test tenant-scoped export, deletion/tombstone, and retention execution adapters.
6. Run deployed logging/trace fixtures to prove sensitive values are absent.
7. Perform an encrypted logical `pg_dump`/`pg_restore` exercise in the pilot PostgreSQL environment with representative data.
8. Name incident-response, access-review/offboarding, backup, and metric owners.
9. Capture and freeze the discovery-to-decision baseline and metric/cohort definition.
10. Run browser/screen-reader checks after authenticated adapters and client-side validation are connected.

## Human approval record

```text
Pilot users:
  Commercial owner:
  BD operator 1:
  BD operator 2:
  Reviewer:
Pilot environment:
Baseline period and median:
Metric/report owner:
Incident-response owner:
Access/offboarding owner:
Backup/recovery owner:
Blocking actions verified by:
Pilot approved by:
Approval date:
Pilot start date:
```

Until every blocking action is evidenced and the approval record is signed, TASK 122 remains `AWAITING_APPROVAL` and TASK 123 cannot begin.
