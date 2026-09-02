export interface OrganizationIdentity {
  id: string;
  legalName: string;
  displayName: string;
  domains: readonly string[];
}

export interface DuplicateCandidate {
  sourceOrganizationId: string;
  targetOrganizationId: string;
  score: number;
  reasons: readonly string[];
}

export function normalizeOrganizationName(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/&/g, " and ")
    .replace(
      /\b(incorporated|inc|limited|ltd|llc|plc|corp|corporation|company|co)\b/g,
      " ",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeDomain(value: string): string {
  const candidate = value
    .trim()
    .toLocaleLowerCase("en")
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.replace(/^www\./, "")
    .replace(/\.$/, "");
  if (!candidate || !candidate.includes("."))
    throw new Error(`Invalid organization domain: ${value}`);
  return candidate;
}

function tokenSimilarity(left: string, right: string): number {
  const a = new Set(left.split(" ").filter(Boolean));
  const b = new Set(right.split(" ").filter(Boolean));
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function detectDuplicateOrganizations(
  organizations: readonly OrganizationIdentity[],
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  for (let leftIndex = 0; leftIndex < organizations.length; leftIndex += 1) {
    const left = organizations[leftIndex];
    if (!left) continue;
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < organizations.length;
      rightIndex += 1
    ) {
      const right = organizations[rightIndex];
      if (!right) continue;
      const reasons: string[] = [];
      let score = 0;
      const leftDomains = new Set(left.domains.map(normalizeDomain));
      const sharedDomains = right.domains
        .map(normalizeDomain)
        .filter((domain) => leftDomains.has(domain));
      if (sharedDomains.length > 0) {
        score = 1;
        reasons.push(`SHARED_DOMAIN:${sharedDomains.sort().join(",")}`);
      }
      const leftName = normalizeOrganizationName(
        left.legalName || left.displayName,
      );
      const rightName = normalizeOrganizationName(
        right.legalName || right.displayName,
      );
      if (leftName && leftName === rightName) {
        score = Math.max(score, 0.9);
        reasons.push("NORMALIZED_NAME_EXACT");
      } else if (tokenSimilarity(leftName, rightName) >= 0.75) {
        score = Math.max(score, 0.75);
        reasons.push("NORMALIZED_NAME_SIMILAR");
      }
      if (score >= 0.75)
        candidates.push({
          sourceOrganizationId: left.id,
          targetOrganizationId: right.id,
          score,
          reasons,
        });
    }
  }
  return candidates;
}
