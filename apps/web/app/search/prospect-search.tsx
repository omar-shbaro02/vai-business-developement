"use client";

import type {
  ProspectSearchRequest,
  ProspectSearchResult,
} from "@vai/contracts";
import { useState, type FormEvent } from "react";

type SearchResponse = {
  data: ProspectSearchResult[];
  page: { cursor: string | null; has_more: boolean };
};

const tierLabels = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
  UNCLASSIFIED: "Unclassified",
} as const;

export function ProspectSearch() {
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [tier, setTier] = useState<ProspectSearchRequest["tier"]>(null);
  const [results, setResults] = useState<ProspectSearchResult[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/prospect-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ industry, region, tier, limit: 20 }),
      });
      const body = (await response.json()) as
        SearchResponse | { error?: { message?: string } };
      if (!response.ok || !("data" in body))
        throw new Error(
          "error" in body
            ? (body.error?.message ?? "Search could not be completed")
            : "Search could not be completed",
        );
      setResults(body.data);
      setStatus("success");
    } catch (error) {
      setResults([]);
      setMessage(
        error instanceof Error
          ? error.message
          : "Search could not be completed",
      );
      setStatus("error");
    }
  }

  return (
    <>
      <form className="prospect-search-form" onSubmit={submit}>
        <label>
          <span>Industry</span>
          <input
            required
            minLength={2}
            maxLength={120}
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="e.g. Trade and logistics"
          />
        </label>
        <label>
          <span>Region</span>
          <input
            required
            minLength={2}
            maxLength={120}
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            placeholder="e.g. Northern Virginia"
          />
        </label>
        <label>
          <span>Account tier</span>
          <select
            value={tier ?? ""}
            onChange={(event) =>
              setTier(
                (event.target.value || null) as ProspectSearchRequest["tier"],
              )
            }
          >
            <option value="">All tiers</option>
            {Object.entries(tierLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button disabled={status === "loading"} type="submit">
          {status === "loading" ? "Searching…" : "Find prospects"}
        </button>
      </form>

      <div className="search-status" aria-live="polite">
        {status === "idle" &&
          "Enter an industry and region to search the reviewed prospect database."}
        {status === "loading" &&
          "Searching prospects and preparing strategies…"}
        {status === "error" && message}
        {status === "success" &&
          (results.length
            ? `${results.length} prospect${results.length === 1 ? "" : "s"} found.`
            : "No matching prospects are in the database yet. Import a CSV or add a business manually, then search again.")}
      </div>

      {results.length > 0 && (
        <section className="prospect-results" aria-label="Prospect results">
          {results.map((result) => (
            <article className="prospect-card" key={result.organization_id}>
              <div className="prospect-card-heading">
                <div>
                  <span className={`tier tier-${result.tier.toLowerCase()}`}>
                    {tierLabels[result.tier]}
                  </span>
                  <h2>{result.display_name}</h2>
                  <p>
                    {result.industry ?? "Industry unconfirmed"} ·{" "}
                    {formatLocations(result.locations)}
                  </p>
                </div>
                {result.website && (
                  <a href={result.website} target="_blank" rel="noreferrer">
                    Visit website ↗
                  </a>
                )}
              </div>

              <div className="prospect-grid">
                <section>
                  <h3>Why this tier</h3>
                  <ul>
                    {result.tier_reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <small>Rule: {result.tier_rule_version}</small>
                </section>
                <section>
                  <h3>Recommended approach</h3>
                  <p>{result.strategy.positioning}</p>
                  <dl>
                    <dt>Target roles</dt>
                    <dd>{result.strategy.target_roles.join(", ")}</dd>
                    <dt>Opening angle</dt>
                    <dd>{result.strategy.opening_angle}</dd>
                    <dt>VAI offer</dt>
                    <dd>{result.strategy.recommended_offer}</dd>
                    <dt>Next action</dt>
                    <dd>{result.strategy.next_action}</dd>
                  </dl>
                </section>
              </div>

              {result.strategy.evidence_gaps.length > 0 && (
                <div className="evidence-gaps">
                  <b>Evidence needed:</b>{" "}
                  {result.strategy.evidence_gaps.join(", ")}
                </div>
              )}
              <footer>
                Human approval required before outreach ·{" "}
                {result.evidence_ids.length} supporting evidence item
                {result.evidence_ids.length === 1 ? "" : "s"}
              </footer>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function formatLocations(locations: ProspectSearchResult["locations"]): string {
  const values = locations
    .flatMap((location) => [
      location.locality,
      location.region,
      location.country,
    ])
    .filter((value): value is string => Boolean(value));
  return [...new Set(values)].join(", ") || "Location unconfirmed";
}
