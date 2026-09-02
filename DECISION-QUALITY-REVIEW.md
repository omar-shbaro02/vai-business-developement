# Decision-Quality Review

**Review date:** 2026-09-02  
**Rule baseline:** `priority/0.1`, `qualification/0.1`, `calibration/0.1`  
**Result:** PASS — no critical decision-quality regression found

## Approved priority regression fixtures

All eight owner-approved fixtures pass:

| Fixture                                          | Expected and observed result          |
| ------------------------------------------------ | ------------------------------------- |
| Attractive Tier 1 but inaccessible               | `P3_MONITOR`                          |
| Smaller Tier 3 with strong immediate opportunity | `P1_PURSUE_NOW`                       |
| P1 with low evidence confidence                  | `P1_PURSUE_NOW` + `LOW` confidence    |
| High confidence but weak opportunity             | `P4_LOW_PRIORITY` + `HIGH` confidence |
| Missing minimum evidence                         | `INSUFFICIENT_EVIDENCE`               |
| Verified disqualifier                            | `DISQUALIFIED`                        |
| Conflicting evidence                             | `P2_DEVELOP`                          |
| Stale evidence                                   | `P3_MONITOR` + `LOW` confidence       |

The engine also reproduces identical output for a cloned input and records `priority/0.1`.

## Leakage review

- Account tier is not part of `PriorityInput`; injecting Tier 1 versus Tier 3 metadata produces the same priority.
- Low confidence does not prevent a qualifying opportunity from receiving P1.
- High confidence does not promote a weak opportunity above P4.
- Confidence calculation accepts evidence coverage, verification, freshness, and source quality only; it has no attractiveness input.
- Priority carries confidence through unchanged and never calculates it from priority.

Result: no account-tier/priority or priority/confidence leakage detected.

## Unknown and missing-evidence review

- Unsupported qualification factors with no evidence resolve to `UNKNOWN`, not a positive dimension.
- Missing material dimensions create explicit missing-evidence records.
- No access evidence yields `UNKNOWN`; contact availability alone yields only `LOW` access.
- No confidence evidence yields `UNKNOWN`; stale evidence lowers evidence confidence.
- Missing minimum priority evidence produces `INSUFFICIENT_EVIDENCE` before ordinary priority rules run.
- Missing outcomes remain `NO_OUTCOME` and are excluded from calibration performance denominators.

Result: unknowns remain explicit and are not converted into favorable assumptions.

## AI boundary review

- With no approved provider, extraction returns `DISABLED` and no signals.
- Provider failure returns a safe empty result and does not block deterministic processing.
- AI claims referencing evidence outside the provided set are rejected.
- Valid inferences retain provider, model, contract version, generation time, validation state, and evidence IDs.
- Recommendation explanations receive fixed priority/action/factors; unsupported factor codes and provider failures fall back to deterministic text.
- AI-created hypotheses remain visibly unverified until human review.
- Recommendations remain `PROPOSED`, require human approval, and never auto-execute.

Result: AI cannot modify priority, invent material evidence, or execute commercial actions.

## Test evidence

Focused suites:

- Priority: 10 tests, including eight approved fixtures — PASS.
- Qualification: 7 tests — PASS.
- Enrichment/AI extraction: 5 tests — PASS.
- Recommendation/explanation: 4 tests — PASS.
- Outcome calibration: 3 tests — PASS.

Full repository verification passes after this review and the explicit disabled-provider regression were added.

## Residual risks

- Pilot data may reveal that approved `priority/0.1` thresholds need recalibration. Any change requires a new immutable rule version and newly approved fixtures.
- Fixture coverage is intentionally bounded and cannot represent every industry or commercial context.
- Production adapters must preserve evidence IDs, timestamps, tenant boundaries, and immutable snapshots used by the reviewed pure engines.
- AI provider approval remains absent; enabling one requires governance review and deployed payload/log tests.

Task 121 may close on the current rule baseline. This review is not authorization to change decision rules or approve the pilot.
