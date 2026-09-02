const accounts = [
  {
    name: "Northstar Foods",
    domain: "northstar.example",
    location: "Beirut, Lebanon",
    industry: "Food manufacturing",
    tier: "Tier 1",
    tierReason: "Regional scale and transformation scope",
    opportunities: [
      {
        title: "Planning diagnostic",
        priority: "P1 · Pursue now",
        confidence: "High",
      },
      {
        title: "S&OP capability review",
        priority: "P3 · Monitor",
        confidence: "Medium",
      },
    ],
    evidence: [
      ["Company profile", "Manual research", "Reviewed", "29 Aug 2026"],
      ["Regional footprint", "CSV import · IMP-024", "Verified", "27 Aug 2026"],
    ],
  },
  {
    name: "Atlas Distribution",
    domain: "atlas.example",
    location: "Dubai, UAE",
    industry: "Distribution",
    tier: "Tier 2",
    tierReason: "Multi-market operating complexity",
    opportunities: [
      {
        title: "Operating model",
        priority: "P1 · Pursue now",
        confidence: "Medium",
      },
    ],
    evidence: [
      ["Organization website", "Approved connector", "Reviewed", "30 Aug 2026"],
    ],
  },
  {
    name: "Cedar Retail Group",
    domain: "cedar.example",
    location: "Amman, Jordan",
    industry: "Retail",
    tier: "Tier 2",
    tierReason: "Regional portfolio and planning need",
    opportunities: [
      {
        title: "Forecast redesign",
        priority: "P2 · Develop",
        confidence: "High",
      },
      {
        title: "Commercial analytics",
        priority: "Needs evidence",
        confidence: "Low",
      },
    ],
    evidence: [
      ["Discovery interview", "Manual · USR-014", "Verified", "28 Aug 2026"],
    ],
  },
] as const;

export default function AccountsPage() {
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="/">
          <b>V</b> VAI
        </a>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Primary navigation">
          <a href="/">◫ Overview</a>
          <a className="active" aria-current="page" href="/accounts">
            ◎ Accounts
          </a>
          <a href="/opportunities">◇ Opportunities</a>
          <a href="/research">
            ⌕ Research <b>7</b>
          </a>
          <a href="/decisions">✓ Decisions</a>
          <a href="/reporting">▥ Reporting</a>
        </nav>
        <div className="governance">
          <i /> Governed workspace<small>Account tier · context only</small>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1}>
        <header>
          <div>
            <p className="eyebrow">Account intelligence</p>
            <h1>Accounts</h1>
            <p className="lede">
              Organization context and evidence, without conflating account tier
              with opportunity priority.
            </p>
          </div>
          <div className="actions">
            <button type="button">Export view</button>
            <span>OS</span>
          </div>
        </header>
        <div className="account-toolbar">
          <label>
            <span>Search accounts</span>
            <input type="search" placeholder="Name, domain, or market" />
          </label>
          <label>
            <span>Account tier</span>
            <select defaultValue="all">
              <option value="all">All tiers</option>
              <option>Tier 1</option>
              <option>Tier 2</option>
              <option>Tier 3</option>
            </select>
          </label>
          <div>
            <b>3</b>
            <small>accounts in view</small>
          </div>
        </div>
        <div className="boundary-note">
          <b>Account tier is context—not priority.</b> Each opportunity is
          assessed independently from its own evidence, timing, access, value,
          feasibility, and risk.
        </div>
        <section className="account-list" aria-label="Accounts">
          {accounts.map((account) => (
            <article className="account-card" key={account.name}>
              <div className="account-identity">
                <span className="account-avatar">
                  {account.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </span>
                <div>
                  <h2>{account.name}</h2>
                  <p>
                    {account.domain} · {account.location}
                  </p>
                </div>
              </div>
              <div className="account-context">
                <p className="eyebrow">Account context</p>
                <div>
                  <span className="tier">{account.tier}</span>
                  <span>{account.industry}</span>
                </div>
                <small>{account.tierReason}</small>
              </div>
              <div className="opportunity-context">
                <p className="eyebrow">Independent opportunities</p>
                {account.opportunities.map((opportunity) => (
                  <div className="account-opportunity" key={opportunity.title}>
                    <span>
                      <b>{opportunity.title}</b>
                      <small>Confidence · {opportunity.confidence}</small>
                    </span>
                    <em
                      className={
                        opportunity.priority.startsWith("Needs") ? "needs" : ""
                      }
                    >
                      {opportunity.priority}
                    </em>
                  </div>
                ))}
              </div>
              <details className="provenance">
                <summary>
                  Evidence provenance{" "}
                  <span>{account.evidence.length} sources</span>
                </summary>
                <div className="evidence-list">
                  {account.evidence.map(([item, source, status, date]) => (
                    <div key={item}>
                      <span>
                        <b>{item}</b>
                        <small>{source}</small>
                      </span>
                      <span>
                        <b>{status}</b>
                        <small>Observed {date}</small>
                      </span>
                      <a
                        href={`/#evidence-${item.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        View evidence →
                      </a>
                    </div>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
