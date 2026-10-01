const histories = [
  {
    account: "Northstar Foods",
    opportunity: "Planning diagnostic",
    id: "opp-101",
    current: "P2 · Develop",
    confidence: "High",
    rule: "priority/0.1",
    events: [
      {
        kind: "System recommendation",
        badge: "P1 · Pursue now",
        actor: "Deterministic priority engine",
        time: "28 Aug 2026 · 09:42 UTC",
        text: "Strong problem and readiness evidence; access, value, feasibility, and risk gates satisfied.",
        evidence: "5 evidence items",
      },
      {
        kind: "Human decision · Override",
        badge: "P2 · Develop",
        actor: "Omar Shbaro",
        time: "28 Aug 2026 · 11:06 UTC",
        text: "Sponsor access is credible, but procurement timing was moved to Q4. Develop the relationship until the window is confirmed.",
        evidence: "Reason required · 2 supporting items",
      },
      {
        kind: "Outcome · Meeting booked",
        badge: "Recorded",
        actor: "Omar Shbaro",
        time: "30 Aug 2026 · 14:20 UTC",
        text: "Discovery meeting scheduled with Planning Director for 4 September.",
        evidence: "Calendar confirmation",
      },
    ],
  },
  {
    account: "Atlas Distribution",
    opportunity: "Operating model",
    id: "opp-205",
    current: "P1 · Pursue now",
    confidence: "Medium",
    rule: "priority/0.1",
    events: [
      {
        kind: "System recommendation",
        badge: "P1 · Pursue now",
        actor: "Deterministic priority engine",
        time: "29 Aug 2026 · 08:15 UTC",
        text: "Verified operating pain and timing; medium access strength creates a material uncertainty.",
        evidence: "4 evidence items",
      },
      {
        kind: "Human decision · Accepted",
        badge: "Accepted",
        actor: "Omar Shbaro",
        time: "29 Aug 2026 · 10:31 UTC",
        text: "Proceed with access development while preserving the system priority.",
        evidence: "No override reason required",
      },
      {
        kind: "Outcome · Access path found",
        badge: "Recorded",
        actor: "Maya Haddad",
        time: "31 Aug 2026 · 12:05 UTC",
        text: "Partner introduction confirmed to the transformation office.",
        evidence: "Introduction email · EV-882",
      },
    ],
  },
] as const;

export default function DecisionsPage() {
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
          <a href="/search">⌕ Prospect search</a>
          <a href="/opportunities">◇ Opportunities</a>
          <a href="/research">
            ⌕ Research <b>7</b>
          </a>
          <a className="active" aria-current="page" href="/decisions">
            ✓ Decisions
          </a>
          <a href="/reporting">▥ Reporting</a>
        </nav>
        <div className="governance">
          <i /> Append-only history
          <small>Human and system states retained</small>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1}>
        <header>
          <div>
            <p className="eyebrow">Governed audit trail</p>
            <h1>Decision history</h1>
            <p className="lede">
              Review what the system recommended, what a human decided, why it
              changed, and what happened afterward.
            </p>
          </div>
          <div className="actions">
            <button type="button">Export audit trail</button>
            <span>OS</span>
          </div>
        </header>
        <div className="decision-toolbar">
          <label>
            <span>Search history</span>
            <input type="search" placeholder="Opportunity, account, or actor" />
          </label>
          <label>
            <span>Decision type</span>
            <select defaultValue="all">
              <option value="all">All decisions</option>
              <option>Overrides</option>
              <option>Accepted</option>
              <option>Rejected</option>
              <option>Deferred</option>
            </select>
          </label>
          <label>
            <span>Period</span>
            <select defaultValue="30">
              <option value="30">Last 30 days</option>
              <option>Last 90 days</option>
              <option>All time</option>
            </select>
          </label>
        </div>
        <section
          className="history-summary"
          aria-label="Decision history summary"
        >
          <div>
            <b>24</b>
            <span>Reviewed decisions</span>
          </div>
          <div>
            <b>2</b>
            <span>Overrides · 8%</span>
          </div>
          <div>
            <b>18</b>
            <span>Accepted</span>
          </div>
          <div>
            <b>11</b>
            <span>Outcomes recorded</span>
          </div>
        </section>
        <div className="audit-note">
          <b>Immutable by design.</b> An override creates a new human decision;
          it does not alter the system recommendation. Later outcomes append to
          the same opportunity history.
        </div>
        <section
          className="history-list"
          aria-label="Opportunity decision histories"
        >
          {histories.map((history) => (
            <article className="history-card" key={history.id}>
              <div className="history-heading">
                <div>
                  <p className="eyebrow">
                    {history.account} · {history.id}
                  </p>
                  <h2>{history.opportunity}</h2>
                </div>
                <div>
                  <small>Current reviewed state</small>
                  <b>{history.current}</b>
                  <span>
                    {history.confidence} confidence · {history.rule}
                  </span>
                </div>
              </div>
              <ol className="timeline">
                {history.events.map((event, index) => (
                  <li
                    key={`${event.kind}-${event.time}`}
                    className={
                      event.kind.includes("Override")
                        ? "override"
                        : event.kind.includes("Outcome")
                          ? "outcome"
                          : "system"
                    }
                  >
                    <span className="timeline-marker" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div className="timeline-content">
                      <div className="event-heading">
                        <div>
                          <p>{event.kind}</p>
                          <b>{event.badge}</b>
                        </div>
                        <time>{event.time}</time>
                      </div>
                      <p className="event-text">{event.text}</p>
                      <div className="event-meta">
                        <span>By {event.actor}</span>
                        <a href={`/#audit-${history.id}-${index}`}>
                          {event.evidence} →
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="history-actions">
                <span>All timestamps shown in UTC · oldest to newest</span>
                <button type="button">Open full audit record →</button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
