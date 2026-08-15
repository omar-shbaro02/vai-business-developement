# PRODUCT-CANON — VAI Business Development Intelligence

**Status:** APPROVED  
**Canon Version:** 0.2

This file freezes product identity and behavioral boundaries. Implementation must not begin until explicitly approved.

## 1. Canonical product statement

VAI Business Development Intelligence is an internal-first commercial decision-intelligence system that helps VAI identify, qualify, compare, prioritize, and explain Commercial Action Opportunities so human business-development teams can allocate effort more intelligently.

## 2. Canonical unit of decision

The canonical unit is:

**Commercial Action Opportunity**

Not:

- raw lead;
- company;
- contact;
- email address;
- scraped record;
- AI-generated score.

## 3. Canonical management decision

> Which commercial opportunity should VAI pursue, develop, monitor, deprioritize, research further, or disqualify?

## 4. Canonical operator decision

> What should I do next on this commercial opportunity, based on the evidence currently available?

## 5. Canonical object structure

Every Commercial Action Opportunity must connect:

- organization;
- business problem/opportunity hypothesis;
- supporting evidence;
- relevant VAI offer/capability;
- buyer/persona;
- access path;
- timing;
- readiness;
- strategic value;
- expected effort;
- risk;
- confidence;
- priority;
- recommended next action.

## 6. Canonical separation rules

The following concepts must remain independent:

- Account Tier != Opportunity Priority
- Opportunity Priority != Evidence Confidence
- Contact Availability != Access Strength
- Strategic Value != Buying Readiness
- Problem Hypothesis != Verified Problem
- AI Inference != Evidence
- Recommendation != Human Decision
- Human Decision != Commercial Outcome

## 7. Canonical evidence rule

All material claims that influence commercial prioritization must be traceable to evidence or explicitly labeled as inference.

Missing data remains missing.

Unverified AI output must never be promoted to fact silently.

## 8. Canonical decision philosophy

The product follows:

**Discover -> Normalize -> Enrich -> Evaluate Evidence -> Identify Opportunity -> Qualify -> Prioritize -> Recommend -> Human Decision -> Record Outcome -> Learn**

## 9. Canonical AI boundary

AI is a bounded reasoning and extraction subsystem.

AI may interpret, classify, summarize, hypothesize, explain, and recommend.

AI must not autonomously:

- modify deterministic priority rules;
- overwrite verified facts;
- create fake evidence;
- contact prospects;
- advance opportunity stages;
- make binding commitments;
- execute commercial actions.

## 10. Canonical human-control boundary

Humans own:

- pursuit approval;
- outreach;
- relationship development;
- pricing;
- proposal approval;
- negotiation;
- contract decisions;
- opportunity closure.

## 11. Canonical output philosophy

Outputs must expose:

- result;
- contributing factors;
- evidence;
- confidence;
- missing evidence;
- recommended next action;
- human-review state.

Opaque single-number lead scoring is prohibited as the sole decision output.

## 12. Canonical account tier rule

Tier describes strategic account context only.

Tier must not automatically promote an opportunity.

## 13. Canonical priority model

Initial approved candidate state model:

- `P1_PURSUE_NOW`
- `P2_DEVELOP`
- `P3_MONITOR`
- `P4_LOW_PRIORITY`
- `INSUFFICIENT_EVIDENCE`
- `DISQUALIFIED`

Final thresholds must be versioned and explicitly approved before production use.

## 14. Canonical confidence model

Confidence represents evidence quality only.

Proposed values:

- `HIGH`
- `MEDIUM`
- `LOW`
- `UNKNOWN`

Confidence must not be calculated from opportunity attractiveness.

## 15. Canonical product boundary

The product is commercial decision intelligence.

It is not a generic CRM, mass-outreach engine, scraper, or autonomous SDR.

## 16. Approval record

**Product Owner:** Omar / VAI  
**Founder / Commercial Approval:** Omar / VAI  
**Architecture Approval:** Omar / VAI  
**Approval Date:** 2026-08-15  
**Approved Decision Register Version:** 0.2
