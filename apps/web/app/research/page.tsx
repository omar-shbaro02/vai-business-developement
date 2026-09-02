const cases = [
  {
    id: "RES-307",
    account: "Cedar Retail Group",
    opportunity: "Commercial analytics",
    confidence: "Low",
    age: "2 days in queue",
    gaps: [
      {
        category: "Problem",
        task: "Validate a material commercial analytics problem",
        source: "Stakeholder interview",
        material: true,
      },
      {
        category: "Timing",
        task: "Document a decision or budget window",
        source: "Annual plan or interview",
        material: true,
      },
      {
        category: "Access",
        task: "Identify a credible route to the target persona",
        source: "Relationship review",
        material: true,
      },
    ],
  },
  {
    id: "RES-411",
    account: "Meridian Consumer",
    opportunity: "Portfolio planning",
    confidence: "Unknown",
    age: "5 days in queue",
    gaps: [
      {
        category: "Persona",
        task: "Confirm the accountable planning leader",
        source: "Organization evidence",
        material: true,
      },
      {
        category: "Value",
        task: "Establish expected commercial value band",
        source: "Reviewed financial context",
        material: false,
      },
    ],
  },
  {
    id: "RES-528",
    account: "Levant Logistics",
    opportunity: "Network performance",
    confidence: "Low",
    age: "8 days in queue",
    gaps: [
      {
        category: "Evidence",
        task: "Replace stale operating-footprint evidence",
        source: "Approved source or manual review",
        material: true,
      },
      {
        category: "Readiness",
        task: "Verify an active change mandate",
        source: "Stakeholder interview",
        material: true,
      },
    ],
  },
] as const;

export default function ResearchPage() {
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
          <a href="/opportunities">◇ Opportunities</a>
          <a className="active" aria-current="page" href="/research">
            ⌕ Research <b>7</b>
          </a>
          <a href="/decisions">✓ Decisions</a>
          <a href="/reporting">▥ Reporting</a>
        </nav>
        <div className="governance">
          <i /> Governed workspace<small>Evidence before inference</small>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1}>
        <header>
          <div>
            <p className="eyebrow">Evidence operations</p>
            <h1>Research queue</h1>
            <p className="lede">
              Resolve material evidence gaps before an opportunity can receive a
              pursuit priority.
            </p>
          </div>
          <div className="actions">
            <button type="button">Research guidance</button>
            <span>OS</span>
          </div>
        </header>
        <section
          className="research-summary"
          aria-label="Research queue summary"
        >
          <div>
            <b>7</b>
            <span>Insufficient-evidence cases</span>
          </div>
          <div>
            <b>12</b>
            <span>Material gaps</span>
          </div>
          <div>
            <b>3</b>
            <span>Stale-evidence reviews</span>
          </div>
          <div>
            <b>4.1d</b>
            <span>Median queue age</span>
          </div>
        </section>
        <div className="pipeline-banner">
          <div>
            <p className="eyebrow">Approved update path</p>
            <b>New evidence never edits a decision directly</b>
          </div>
          <ol aria-label="Evidence processing pipeline">
            <li>
              <span>1</span>Capture
            </li>
            <li>
              <span>2</span>Review
            </li>
            <li>
              <span>3</span>Enrich
            </li>
            <li>
              <span>4</span>Reassess
            </li>
            <li>
              <span>5</span>Recalculate
            </li>
          </ol>
        </div>
        <section className="research-layout">
          <div className="research-cases">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Prioritized queue</p>
                <h2>Cases requiring evidence</h2>
              </div>
              <label>
                <span className="sr-only">Filter research cases</span>
                <select defaultValue="material">
                  <option value="material">Material gaps first</option>
                  <option>Oldest first</option>
                  <option>Account name</option>
                </select>
              </label>
            </div>
            {cases.map((item, caseIndex) => (
              <article className="research-case" key={item.id}>
                <div className="case-heading">
                  <div>
                    <p className="eyebrow">
                      {item.id} · {item.account}
                    </p>
                    <h3>{item.opportunity}</h3>
                  </div>
                  <div>
                    <span className="insufficient">Insufficient evidence</span>
                    <small>
                      {item.confidence} confidence · {item.age}
                    </small>
                  </div>
                </div>
                <div className="checklist">
                  <p className="detail-label">
                    Evidence-driven checklist <b>{item.gaps.length}</b>
                  </p>
                  {item.gaps.map((gap, index) => (
                    <label key={gap.task}>
                      <input type="checkbox" name={`${item.id}-${index}`} />
                      <span>
                        <b>{gap.task}</b>
                        <small>
                          <em>{gap.category}</em>
                          {gap.source}
                          {gap.material && <strong>Material</strong>}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="case-actions">
                  <a href={`/opportunities#${item.id}`}>View opportunity</a>
                  <button type="button">
                    {caseIndex === 0 ? "Add evidence" : "Open research case"} →
                  </button>
                </div>
              </article>
            ))}
          </div>
          <aside
            className="evidence-submit"
            aria-labelledby="evidence-intake-title"
          >
            <p className="eyebrow">Evidence intake</p>
            <h2 id="evidence-intake-title">Add reviewed evidence</h2>
            <p>
              Evidence is queued for validation and cannot change priority until
              the approved pipeline completes.
            </p>
            <form aria-describedby="evidence-intake-guidance">
              <label>
                Research case
                <select defaultValue="RES-307">
                  <option>RES-307 · Commercial analytics</option>
                  <option>RES-411 · Portfolio planning</option>
                  <option>RES-528 · Network performance</option>
                </select>
              </label>
              <label>
                Evidence type
                <select defaultValue="interview">
                  <option value="interview">Stakeholder interview</option>
                  <option>Manual research</option>
                  <option>Approved connector record</option>
                  <option>CSV import</option>
                </select>
              </label>
              <label>
                Source reference
                <input
                  required
                  aria-required="true"
                  placeholder="URL, document, or interview reference"
                />
              </label>
              <label>
                Observation date
                <input type="date" defaultValue="2026-08-31" />
              </label>
              <label>
                Research notes
                <textarea
                  rows={4}
                  placeholder="Record observations; do not infer unsupported conclusions."
                />
              </label>
              <button type="button">Submit to evidence review</button>
              <p className="form-status" role="status" aria-live="polite">
                Required fields are announced before evidence can be queued.
              </p>
            </form>
            <div className="intake-note" id="evidence-intake-guidance">
              <b>What happens next?</b>
              <span>
                Review creates a new immutable evidence item. Successful
                validation triggers enrichment, qualification, and priority
                recalculation while retaining prior assessments.
              </span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
