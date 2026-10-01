const allocation = [
  ["Pursue now", 38, "p1"],
  ["Develop", 27, "p2"],
  ["Research", 18, "unknown"],
  ["Monitor", 12, "p3"],
  ["Other", 5, "p4"],
] as const;
const funnel = [
  ["Qualified", 28],
  ["Meeting booked", 17],
  ["Meeting held", 12],
  ["Proposal sent", 7],
  ["Won", 3],
] as const;

export default function ReportingPage() {
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
          <a href="/decisions">✓ Decisions</a>
          <a className="active" aria-current="page" href="/reporting">
            ▥ Reporting
          </a>
        </nav>
        <div className="governance">
          <i /> Governed metrics<small>Reporting definitions · v0.1</small>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1}>
        <header>
          <div>
            <p className="eyebrow">Management reporting</p>
            <h1>Allocation & outcomes</h1>
            <p className="lede">
              A decision-quality view of where BD time goes, what evidence
              supports it, and which commercial outcomes follow.
            </p>
          </div>
          <div className="actions">
            <button type="button">Last 30 days⌄</button>
            <span>OS</span>
          </div>
        </header>
        <div className="report-scope">
          <span>
            <b>Scope:</b> Active portfolio · all owners
          </span>
          <span>
            <b>As of:</b> 31 Aug 2026, 15:50 UTC
          </span>
          <strong>Definitions v0.1 · 92% time coverage</strong>
        </div>
        <section className="report-kpis" aria-label="Management indicators">
          <article className="primary">
            <p>Qualified value per BD hour</p>
            <b>$4.8k</b>
            <span>↗ 12% vs prior period</span>
            <small>
              Shown because recorded-time coverage exceeds the 80% reporting
              threshold.
            </small>
          </article>
          <article>
            <p>Evidence sufficient</p>
            <b>80%</b>
            <span>28 of 35 active</span>
            <small>Minimum evidence gates satisfied.</small>
          </article>
          <article>
            <p>Median decision cycle</p>
            <b>4.2d</b>
            <span>↘ 0.8 days</span>
            <small>Discovery to qualified decision.</small>
          </article>
          <article>
            <p>Research backlog</p>
            <b>7</b>
            <span>12 material gaps</span>
            <small>3 cases older than seven days.</small>
          </article>
        </section>
        <section className="report-grid">
          <article className="panel allocation-report">
            <div className="heading">
              <div>
                <p className="eyebrow">BD allocation</p>
                <h2>Recorded hours by governed state</h2>
              </div>
              <span className="coverage">92% coverage</span>
            </div>
            <div className="allocation-total">
              <b>164h</b>
              <span>recorded pursuit time</span>
            </div>
            <div
              className="allocation-bar"
              aria-label="BD hours: 38 percent pursue now, 27 percent develop, 18 percent research, 12 percent monitor, 5 percent other"
            >
              {allocation.map(([label, value, kind]) => (
                <i
                  key={label}
                  className={kind}
                  style={{ width: `${value}%` }}
                />
              ))}
            </div>
            <div className="allocation-list">
              {allocation.map(([label, value, kind]) => (
                <div key={label}>
                  <i className={kind} />
                  <span>{label}</span>
                  <b>{value}%</b>
                  <small>{Math.round((164 * value) / 100)}h</small>
                </div>
              ))}
            </div>
            <p className="report-note">
              Time is grouped by the opportunity state active when work was
              recorded, not by account tier.
            </p>
          </article>
          <article className="panel distribution-report">
            <p className="eyebrow">Portfolio state</p>
            <h2>Opportunity distribution</h2>
            <div className="distribution-list">
              <Distribution label="P1 · Pursue now" value={6} total={35} />
              <Distribution label="P2 · Develop" value={11} total={35} />
              <Distribution label="P3 · Monitor" value={8} total={35} />
              <Distribution label="P4 · Low priority" value={3} total={35} />
              <Distribution
                label="Insufficient evidence"
                value={7}
                total={35}
              />
            </div>
          </article>
          <article className="panel distribution-report">
            <p className="eyebrow">Evidence quality</p>
            <h2>Confidence distribution</h2>
            <div className="confidence-rings">
              <div>
                <b>14</b>
                <span>High</span>
              </div>
              <div>
                <b>12</b>
                <span>Medium</span>
              </div>
              <div>
                <b>7</b>
                <span>Low</span>
              </div>
              <div>
                <b>2</b>
                <span>Unknown</span>
              </div>
            </div>
            <p className="report-note">
              Confidence measures evidence quality; it does not measure
              attractiveness.
            </p>
          </article>
        </section>
        <section className="report-bottom">
          <article className="panel funnel-report">
            <div className="heading">
              <div>
                <p className="eyebrow">Observed outcomes</p>
                <h2>Qualified-opportunity funnel</h2>
              </div>
              <span className="coverage">Cohort: last 90 days</span>
            </div>
            <div className="funnel">
              {funnel.map(([label, value], index) => (
                <div key={label}>
                  <span>{label}</span>
                  <i style={{ width: `${(value / 28) * 100}%` }} />
                  <b>{value}</b>
                  {index > 0 && (
                    <small>
                      {Math.round(
                        (value / (funnel[index - 1]?.[1] ?? value)) * 100,
                      )}
                      % step conversion
                    </small>
                  )}
                </div>
              ))}
            </div>
            <p className="report-note">
              Counts use recorded outcomes only; missing outcomes remain unknown
              rather than inferred.
            </p>
          </article>
          <article className="panel backlog-report">
            <div className="heading">
              <div>
                <p className="eyebrow">Research backlog</p>
                <h2>Material gaps by category</h2>
              </div>
              <a href="/research">Open queue →</a>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Cases</th>
                  <th>Oldest</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Access route</td>
                  <td>4</td>
                  <td>8 days</td>
                </tr>
                <tr>
                  <td>Problem evidence</td>
                  <td>3</td>
                  <td>5 days</td>
                </tr>
                <tr>
                  <td>Timing / readiness</td>
                  <td>3</td>
                  <td>5 days</td>
                </tr>
                <tr>
                  <td>Target persona</td>
                  <td>2</td>
                  <td>3 days</td>
                </tr>
              </tbody>
            </table>
          </article>
        </section>
        <footer>
          <span>
            Raw lead volume is excluded from management allocation decisions.
          </span>
          <span>Metric definitions · Data lineage · Export</span>
        </footer>
      </main>
    </div>
  );
}

function Distribution({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  return (
    <div>
      <span>{label}</span>
      <i>
        <em style={{ width: `${(value / total) * 100}%` }} />
      </i>
      <b>{value}</b>
    </div>
  );
}
