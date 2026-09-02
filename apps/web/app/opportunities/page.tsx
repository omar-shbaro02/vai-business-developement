const opportunities = [
  {
    id: "opp-101",
    account: "Northstar Foods",
    title: "Planning diagnostic",
    priority: "P1 · Pursue now",
    confidence: "High",
    evidence: [
      "Verified planning mandate",
      "Reviewed regional growth signal",
      "Known sponsor relationship",
    ],
    gaps: ["Confirm procurement path"],
    access: "Existing relationship · High",
    persona: "COO / Planning Director",
    offer: "Integrated planning diagnostic",
    offerState: "Reviewed",
    action: "Review offer with opportunity owner",
  },
  {
    id: "opp-102",
    account: "Northstar Foods",
    title: "S&OP capability review",
    priority: "P3 · Monitor",
    confidence: "Medium",
    evidence: ["Current S&OP process documented", "Expansion plan reviewed"],
    gaps: ["Validate executive urgency", "Confirm budget window"],
    access: "Same account sponsor · Medium",
    persona: "Supply Chain Director",
    offer: "S&OP maturity assessment",
    offerState: "Hypothesis",
    action: "Monitor timing evidence",
  },
  {
    id: "opp-205",
    account: "Atlas Distribution",
    title: "Operating model",
    priority: "P1 · Pursue now",
    confidence: "Medium",
    evidence: ["Verified multi-market complexity", "Operating pain reviewed"],
    gaps: ["Identify economic buyer"],
    access: "Partner introduction · Medium",
    persona: "Chief Transformation Officer",
    offer: "Operating model design sprint",
    offerState: "Reviewed",
    action: "Develop decision-maker access",
  },
  {
    id: "opp-307",
    account: "Cedar Retail Group",
    title: "Commercial analytics",
    priority: "Insufficient evidence",
    confidence: "Low",
    evidence: ["Analytics interest captured"],
    gaps: [
      "Validate material problem",
      "Document timing",
      "Identify access route",
    ],
    access: "Unknown",
    persona: "Commercial leader · Unconfirmed",
    offer: "Not recommended yet",
    offerState: "Blocked",
    action: "Complete minimum-evidence research",
  },
] as const;

export default function OpportunitiesPage() {
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="/">
          <b>V</b> VAI
        </a>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Primary navigation">
          <a href="/">◫ Overview</a>
          <a href="/accounts">◎ Accounts</a>
          <a className="active" aria-current="page" href="/opportunities">
            ◇ Opportunities
          </a>
          <a href="/research">
            ⌕ Research <b>7</b>
          </a>
          <a href="/decisions">✓ Decisions</a>
          <a href="/reporting">▥ Reporting</a>
        </nav>
        <div className="governance">
          <i /> Governed workspace<small>Priority rules · v0.1</small>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1}>
        <header>
          <div>
            <p className="eyebrow">Commercial decisions</p>
            <h1>Opportunities</h1>
            <p className="lede">
              Each opportunity carries its own evidence, confidence, access,
              offer, and governed next action.
            </p>
          </div>
          <div className="actions">
            <button type="button">Create opportunity</button>
            <span>OS</span>
          </div>
        </header>
        <div className="opportunity-toolbar">
          <label>
            <span>Search opportunities</span>
            <input type="search" placeholder="Opportunity or account" />
          </label>
          <label>
            <span>Priority</span>
            <select defaultValue="all">
              <option value="all">All priorities</option>
              <option>P1 · Pursue now</option>
              <option>P2 · Develop</option>
              <option>P3 · Monitor</option>
              <option>Insufficient evidence</option>
            </select>
          </label>
          <label>
            <span>Confidence</span>
            <select defaultValue="all">
              <option value="all">All confidence</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
        </div>
        <div className="opportunity-summary">
          <span>
            <b>4</b> opportunities
          </span>
          <span>
            <b>3</b> accounts
          </span>
          <span>
            <b>2</b> pursue now
          </span>
          <span>
            <b>1</b> evidence blocked
          </span>
        </div>
        <section className="opportunity-list" aria-label="Opportunities">
          {opportunities.map((opportunity) => (
            <article className="opportunity-card" key={opportunity.id}>
              <div className="opportunity-title">
                <div>
                  <p className="eyebrow">
                    {opportunity.account} · {opportunity.id}
                  </p>
                  <h2>{opportunity.title}</h2>
                </div>
                <div className="decision-badges">
                  <em
                    className={
                      opportunity.priority.startsWith("Insufficient")
                        ? "blocked"
                        : ""
                    }
                  >
                    {opportunity.priority}
                  </em>
                  <span
                    className={`confidence ${opportunity.confidence.toLowerCase()}`}
                  >
                    <i />
                    {opportunity.confidence} confidence
                  </span>
                </div>
              </div>
              <div className="opportunity-detail-grid">
                <section>
                  <p className="detail-label">
                    Supporting evidence <b>{opportunity.evidence.length}</b>
                  </p>
                  <ul className="evidence-points">
                    {opportunity.evidence.map((item) => (
                      <li key={item}>
                        <span>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    className="detail-link"
                    href={`/#evidence-${opportunity.id}`}
                  >
                    Open evidence lineage →
                  </a>
                </section>
                <section>
                  <p className="detail-label">
                    Material gaps <b>{opportunity.gaps.length}</b>
                  </p>
                  <ul className="gap-points">
                    {opportunity.gaps.map((item) => (
                      <li key={item}>
                        <span>!</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <p className="detail-label">Access and target</p>
                  <dl>
                    <div>
                      <dt>Access</dt>
                      <dd>{opportunity.access}</dd>
                    </div>
                    <div>
                      <dt>Persona</dt>
                      <dd>{opportunity.persona}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <p className="detail-label">Recommended offer</p>
                  <strong className="offer">{opportunity.offer}</strong>
                  <small className="offer-state">
                    {opportunity.offerState}
                  </small>
                </section>
              </div>
              <div className="next-action">
                <span>
                  <small>Next governed action</small>
                  <b>{opportunity.action}</b>
                </span>
                <span className="review-state">Human review required</span>
                <button type="button">Review opportunity →</button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
