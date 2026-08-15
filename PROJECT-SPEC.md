# PROJECT-SPEC — VAI Business Development Intelligence

**Status:** APPROVED  
**Version:** 0.2

## 1. Project identity

**Working name:** VAI Business Development Intelligence  
**Initial deployment:** Internal VAI business development use  
**Initial operating region:** Northern Virginia, with architecture designed for geographic expansion  
**Future option:** Productize for external clients after internal validation

## 2. Product ambition

Build a commercial decision-intelligence system that helps VAI determine where limited business-development effort should be spent.

The system must not behave as a generic lead scraper, CRM replacement, or opaque AI scoring engine.

The core product objective is to identify, qualify, compare, prioritize, and explain **Commercial Action Opportunities**.

## 3. Core business problem

Business-development teams can discover large numbers of companies and contacts, but discovery volume does not answer the management decision:

> Which commercial opportunity is worth pursuing now, why, through what entry route, with what VAI offer, and with what level of evidence confidence?

Existing prospecting tools frequently optimize for lead volume, contact availability, or generic fit scores. They do not reliably combine strategic attractiveness, problem evidence, timing, accessibility, buying readiness, implementation plausibility, and effort economics into a governed commercial decision.

## 4. Primary decision class

The system supports:

> Prioritization of Commercial Action Opportunities for human business-development action.

A Commercial Action Opportunity combines:

- target organization;
- candidate business problem or opportunity;
- supporting evidence;
- relevant VAI capability or offer;
- target buyer/persona;
- credible access path;
- commercial timing;
- expected effort;
- expected commercial value;
- risk;
- evidence confidence;
- recommended next action.

## 5. Primary users

### Primary operator

VAI business-development representative.

### Primary decision owner

Founder / commercial leadership.

### Secondary users

- account researcher;
- commercial strategist;
- product lead;
- solution architect;
- management reviewer.

## 6. Economic value hypothesis

The product creates value by improving:

- qualified commercial opportunity value per BD hour;
- research efficiency;
- opportunity prioritization quality;
- consistency of commercial judgment;
- clarity of next actions;
- evidence traceability;
- founder visibility into BD allocation;
- ability to compare opportunities across sectors and territories.

The system should reduce wasted effort on accounts that are attractive in theory but poorly timed, inaccessible, weakly evidenced, or strategically irrelevant.

## 7. Core product principle

The system does **not** rank companies as the final unit of action.

It ranks **Commercial Action Opportunities**.

The same organization may contain multiple different opportunities with different buyers, problems, access routes, readiness levels, evidence quality, and recommended actions.

## 8. Account tiering

Accounts may be segmented for strategic context:

### Tier 1

Large strategic organizations with major upside but typically difficult access.

### Tier 2

Credible medium-to-large organizations with meaningful potential and moderate uncertainty.

### Tier 3

Smaller or more accessible organizations where commercial discussions may be easier or faster.

**Rule:** Account tier must not directly determine pursuit priority.

A Tier 3 opportunity may outrank a Tier 1 opportunity if the commercial conditions are stronger.

## 9. Intelligence dimensions

The system must treat these as distinct dimensions rather than compressing them into one opaque score:

- strategic attractiveness;
- problem evidence;
- buying readiness;
- commercial timing;
- accessibility;
- decision-maker clarity;
- budget plausibility;
- implementation feasibility;
- expected value;
- expected effort;
- competition/risk;
- evidence confidence.

Priority and confidence must remain separate.

## 10. Candidate discovery sources

Potential sources include:

- Google Search;
- Google Maps;
- LinkedIn;
- LinkedIn Sales Navigator;
- Apollo;
- ZoomInfo;
- ImportYeti;
- Panjiva;
- Volza;
- Trade Map;
- Alibaba;
- GCC and regional directories;
- Chambers of Commerce;
- company websites;
- Facebook business pages;
- Instagram business pages;
- local B2B directories;
- manual researcher input;
- CSV imports;
- future CRM integrations.

Source integration is phased and must comply with applicable terms, permissions, privacy requirements, and licensing restrictions.

## 11. Evidence doctrine

Every material fact or signal should retain, where technically possible:

- value;
- source;
- captured timestamp;
- evidence type;
- provenance/reference;
- confidence;
- freshness;
- reviewer notes.

Missing evidence must remain missing.

The system must not convert absence of evidence into positive evidence.

AI-generated hypotheses must never be stored as verified facts without an explicit validation path.

## 12. Commercial access doctrine

A contact is not equivalent to an access path.

Possible access-path evidence may include:

- founder relationship;
- employee relationship;
- referral;
- mutual connection;
- partner introduction;
- existing client introduction;
- industry event;
- chamber or association;
- vendor relationship;
- investor relationship;
- geographic proximity;
- previous communication;
- inbound interest;
- cold outreach route.

Access strength must be based on explicit evidence.

## 13. Runtime capability layers

The intended product contains:

1. Discovery
2. Normalization
3. Evidence / enrichment
4. Qualification
5. Opportunity identification
6. Commercial opportunity prioritization
7. Recommendation
8. Human decision
9. Outcome recording
10. Learning / calibration

## 14. AI use

AI may assist with:

- extracting structured signals from unstructured material;
- summarizing company information;
- classifying evidence;
- identifying candidate business problems;
- generating clearly labeled problem hypotheses;
- mapping possible VAI capabilities to observed needs;
- explaining deterministic scoring outputs;
- proposing research questions;
- suggesting human-reviewable outreach approaches.

AI may not:

- invent evidence;
- silently alter canonical facts;
- change deterministic scoring logic;
- autonomously change opportunity priority;
- autonomously contact prospects;
- progress pipeline stages without human approval;
- make contractual or commercial commitments;
- represent inferred claims as verified facts.

## 15. Human-control boundary

The system may recommend.

Humans decide and execute.

No autonomous commercial execution is part of the approved base scope.

## 16. Non-goals

The initial product is not:

- a full CRM replacement;
- a marketing automation platform;
- an autonomous SDR;
- a bulk email sender;
- a generic web scraper;
- an autonomous negotiation agent;
- a legal or compliance decision system;
- a financial forecasting engine;
- a source of guaranteed buying-intent claims.

## 17. Required product outputs

At minimum, the system must support:

- account evidence profile;
- account tier;
- commercial opportunity objects;
- opportunity priority;
- evidence confidence;
- buying-readiness assessment;
- accessibility assessment;
- commercial timing assessment;
- VAI offer hypothesis;
- target buyer/persona;
- access-path recommendation;
- recommended next action;
- explanation of contributing factors;
- missing-evidence list;
- research recommendation when evidence is insufficient;
- decision history;
- outcome feedback.

## 18. Initial priority states

Proposed states:

- `P1_PURSUE_NOW`
- `P2_DEVELOP`
- `P3_MONITOR`
- `P4_LOW_PRIORITY`
- `INSUFFICIENT_EVIDENCE`
- `DISQUALIFIED`

These states remain subject to Product Canon approval.

## 19. Initial dashboard information architecture

Candidate navigation:

- Executive Overview
- Markets
- Accounts
- Opportunities
- Discovery
- Research
- Decisions
- Activity
- Reporting

The dashboard is not frozen by this specification and must be designed only after the Product Canon and Output Contract are approved.

## 20. Success metrics

Primary candidate metric:

> Qualified commercial opportunity value per BD hour.

Supporting metrics may include:

- time from discovery to qualified decision;
- percentage of opportunities with sufficient evidence;
- research effort per qualified opportunity;
- opportunity-to-meeting conversion;
- meeting-to-proposal conversion;
- proposal-to-win conversion;
- false-positive pursuit rate;
- stale-opportunity rate;
- percentage of priority decisions with traceable evidence;
- human override rate;
- calibration quality between priority and observed commercial outcome.

## 21. Open decisions

Before implementation freeze, the owner should approve:

- exact initial target industries;
- exact initial geography;
- initial permitted data sources;
- whether CRM integration is included in MVP;
- exact account-tier criteria;
- exact scoring dimensions and weights;
- definition of expected commercial value;
- definition of expected BD effort;
- exact opportunity-priority thresholds;
- minimum evidence requirements;
- data-retention policy;
- user roles and permissions;
- pilot success threshold.

Proposed resolutions and explicit deferrals are recorded in `DECISION-REGISTER.md`. Those entries do not become product facts until their approval states and approval record are updated.

## 22. MVP implementation boundary

The proposed MVP supports manual entry and CSV import, governed evidence, organization identity, multiple opportunities per organization, deterministic qualification/priority, human-reviewable recommendations, decisions/overrides, outcomes, audit history, and the core human workspace.

External source connectors, CRM writes, autonomous calibration, multi-tenant commercialization, and autonomous outreach are deferred unless separately approved.

## 23. Contract and lifecycle authority

Runtime shapes are governed by `OUTPUT-CONTRACT.md`. Allowed transitions are governed by `DOMAIN-LIFECYCLES.md`. Collection, retention, access, AI-provider handling, export, and deletion are governed by `DATA-GOVERNANCE.md`.
