import { ProspectSearch } from "./prospect-search";

export default function SearchPage() {
  return (
    <div className="search-shell">
      <header className="search-header">
        <a className="brand" href="/">
          <b>V</b> VAI
        </a>
        <nav aria-label="Search workspace navigation">
          <a href="/">Overview</a>
          <a href="/accounts">Accounts</a>
          <a href="/opportunities">Opportunities</a>
          <a className="active" aria-current="page" href="/search">
            Prospect search
          </a>
        </nav>
      </header>
      <main id="main-content" className="search-main">
        <div className="search-intro">
          <p className="eyebrow">Prospect discovery</p>
          <h1>Find businesses worth approaching</h1>
          <p>
            Search reviewed prospect data by industry and region, then compare
            account tier, supporting evidence, and the recommended approach.
          </p>
        </div>
        <ProspectSearch />
      </main>
    </div>
  );
}
