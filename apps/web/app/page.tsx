const priorities = [
  ["Pursue now", 6, "p1"],
  ["Develop", 11, "p2"],
  ["Monitor", 8, "p3"],
  ["Low priority", 3, "p4"],
  ["Needs evidence", 7, "unknown"],
] as const;

const decisions = [
  ["Northstar Foods", "Planning diagnostic", "P1", "High", "Review offer"],
  ["Atlas Distribution", "Operating model", "P1", "Medium", "Validate access"],
  ["Cedar Retail Group", "Forecast redesign", "P2", "High", "Prepare outreach"],
] as const;

export default function HomePage() {
  const total = priorities.reduce((sum, item) => sum + item[1], 0);
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="/">
          <b>V</b> VAI
        </a>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Primary navigation">
          <a className="active" aria-current="page" href="#overview">
            ◫ Overview
          </a>
          <a href="/accounts">◎ Accounts</a>
          <a href="/opportunities">◇ Opportunities</a>
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
            <p className="eyebrow">Executive workspace</p>
            <h1>Commercial focus</h1>
          </div>
          <div className="actions">
            <button>Last 30 days⌄</button>
            <span>OS</span>
          </div>
        </header>
        <div className="scope">
          <span>
            <b>Portfolio:</b> All active opportunities
          </span>
          <span>
            <b>As of:</b> 31 Aug 2026, 15:50 UTC
          </span>
          <strong>✓ Governed aggregates</strong>
        </div>
        <section
          id="overview"
          className="metrics"
          aria-label="Decision quality metrics"
        >
          <Metric
            primary
            label="Qualified value per BD hour"
            value="$4.8k"
            trend="↗ 12% vs prior period"
          >
            Expected value of evidence-qualified opportunities per recorded
            pursuit hour.
          </Metric>
          <Metric
            label="Evidence sufficient"
            value="80%"
            trend="↗ 6 pts vs prior period"
          >
            28 of 35 active opportunities meet minimum evidence gates.
          </Metric>
          <Metric
            label="Decision cycle"
            value="4.2 days"
            trend="↘ 0.8 days faster"
          >
            Median time from discovery to a qualified decision.
          </Metric>
          <Metric label="Stale opportunities" value="3" trend="— unchanged">
            Material evidence needs review.
          </Metric>
        </section>
        <section className="grid">
          <article className="panel portfolio">
            <Heading
              eyebrow="Decision portfolio"
              title="Where attention is warranted"
              link="View opportunities →"
            />
            <div
              className="bar"
              aria-label={`${total} active opportunities by priority`}
            >
              {priorities.map(([label, value, kind]) => (
                <i
                  key={label}
                  className={kind}
                  style={{ width: `${(value / total) * 100}%` }}
                />
              ))}
            </div>
            <div className="legend">
              {priorities.map(([label, value, kind]) => (
                <div key={label}>
                  <i className={kind} />
                  <b>{value}</b>
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div className="callout">
              <span>!</span>
              <div>
                <b>7 opportunities need evidence before prioritization</b>
                <p>
                  Missing evidence—not account attractiveness—is holding these
                  decisions.
                </p>
              </div>
              <a href="/research">Open research queue →</a>
            </div>
          </article>
          <article className="panel quality">
            <Heading eyebrow="Governance health" title="Decision quality" />
            <Quality label="Traceable to evidence" value={97} />
            <Quality label="Human override rate" value={8} />
            <Quality label="False-positive pursuit rate" value={5} />
            <p className="footnote">
              Calculated from reviewed decisions only. Overrides remain visible
              in decision history.
            </p>
          </article>
        </section>
        <section className="panel decisions" id="decisions">
          <Heading
            eyebrow="Immediate review"
            title="Highest-priority decisions"
            link="Open full workspace →"
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account / opportunity</th>
                  <th>Priority</th>
                  <th>Confidence</th>
                  <th>Next governed action</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {decisions.map(
                  ([account, opportunity, priority, confidence, action]) => (
                    <tr key={opportunity}>
                      <td>
                        <b>{account}</b>
                        <small>{opportunity}</small>
                      </td>
                      <td>
                        <em>{priority}</em>
                      </td>
                      <td>
                        <span
                          className={`confidence ${confidence.toLowerCase()}`}
                        >
                          <i />
                          {confidence}
                        </span>
                      </td>
                      <td>{action}</td>
                      <td>
                        <button aria-label={`Open ${opportunity}`}>→</button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
        <footer>
          <span>
            Raw discovered-account volume is context only and is intentionally
            excluded from primary decision metrics.
          </span>
          <span>Metric definitions · Data lineage</span>
        </footer>
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  trend,
  primary,
  children,
}: {
  label: string;
  value: string;
  trend: string;
  primary?: boolean;
  children: string;
}) {
  return (
    <article className={`metric ${primary ? "primary" : ""}`}>
      <div>{label}</div>
      <strong>{value}</strong>
      <span className="trend">{trend}</span>
      <p>{children}</p>
    </article>
  );
}
function Heading({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: string;
}) {
  return (
    <div className="heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {link && <a href="#opportunities">{link}</a>}
    </div>
  );
}
function Quality({ label, value }: { label: string; value: number }) {
  return (
    <div className="quality-row">
      <span>{label}</span>
      <div>
        <b>{value}%</b>
        <i>
          <em style={{ width: `${value}%` }} />
        </i>
      </div>
    </div>
  );
}
