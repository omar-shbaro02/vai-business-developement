export const CALIBRATION_METRIC_VERSION = "calibration/0.1" as const;

export type HistoricalPriority =
  | "P1_PURSUE_NOW"
  | "P2_DEVELOP"
  | "P3_MONITOR"
  | "P4_LOW_PRIORITY"
  | "INSUFFICIENT_EVIDENCE"
  | "DISQUALIFIED";
export type HistoricalConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type OutcomeType =
  | "RESEARCH_COMPLETED"
  | "ACCESS_PATH_FOUND"
  | "OUTREACH_ATTEMPTED"
  | "REPLY_RECEIVED"
  | "MEETING_BOOKED"
  | "MEETING_HELD"
  | "OPPORTUNITY_VALIDATED"
  | "PROPOSAL_CREATED"
  | "PROPOSAL_SENT"
  | "WON"
  | "LOST"
  | "NO_DECISION"
  | "DISQUALIFIED";

export interface CalibrationObservation {
  opportunityId: string;
  recommendation: {
    decisionId: string;
    priority: HistoricalPriority;
    confidence: HistoricalConfidence;
    ruleVersion: string;
    calculatedAt: string;
  };
  outcome: null | {
    outcomeId: string;
    type: OutcomeType;
    occurredAt: string;
  };
}

export interface CalibrationReport {
  metricVersion: typeof CALIBRATION_METRIC_VERSION;
  generatedAt: string;
  cohort: {
    recommendations: number;
    outcomesObserved: number;
    validComparisons: number;
  };
  outcomeCoverage: number;
  comparisons: Array<
    CalibrationObservation & {
      comparisonStatus: "NO_OUTCOME" | "VALID" | "INVALID_CHRONOLOGY";
      positiveOutcome: boolean | null;
    }
  >;
  byPriority: Array<{
    priority: HistoricalPriority;
    recommendations: number;
    outcomesObserved: number;
    positiveOutcomes: number;
    positiveOutcomeRate: number | null;
  }>;
}

const positiveOutcomes = new Set<OutcomeType>([
  "REPLY_RECEIVED",
  "MEETING_BOOKED",
  "MEETING_HELD",
  "OPPORTUNITY_VALIDATED",
  "PROPOSAL_CREATED",
  "PROPOSAL_SENT",
  "WON",
]);

export function buildCalibrationReport(
  observations: readonly CalibrationObservation[],
  generatedAt: string,
): CalibrationReport {
  const comparisons = observations.map((observation) => {
    const snapshot = cloneObservation(observation);
    if (!snapshot.outcome)
      return {
        ...snapshot,
        comparisonStatus: "NO_OUTCOME" as const,
        positiveOutcome: null,
      };
    const valid =
      Date.parse(snapshot.outcome.occurredAt) >=
      Date.parse(snapshot.recommendation.calculatedAt);
    return {
      ...snapshot,
      comparisonStatus: valid
        ? ("VALID" as const)
        : ("INVALID_CHRONOLOGY" as const),
      positiveOutcome: valid
        ? positiveOutcomes.has(snapshot.outcome.type)
        : null,
    };
  });
  const valid = comparisons.filter((item) => item.comparisonStatus === "VALID");
  const priorities = [
    ...new Set(comparisons.map((item) => item.recommendation.priority)),
  ];
  return {
    metricVersion: CALIBRATION_METRIC_VERSION,
    generatedAt,
    cohort: {
      recommendations: comparisons.length,
      outcomesObserved: comparisons.filter((item) => item.outcome).length,
      validComparisons: valid.length,
    },
    outcomeCoverage: comparisons.length ? valid.length / comparisons.length : 0,
    comparisons,
    byPriority: priorities.map((priority) => {
      const recommendations = comparisons.filter(
        (item) => item.recommendation.priority === priority,
      );
      const observed = recommendations.filter(
        (item) => item.comparisonStatus === "VALID",
      );
      const positive = observed.filter((item) => item.positiveOutcome).length;
      return {
        priority,
        recommendations: recommendations.length,
        outcomesObserved: observed.length,
        positiveOutcomes: positive,
        positiveOutcomeRate: observed.length
          ? positive / observed.length
          : null,
      };
    }),
  };
}

function cloneObservation(
  observation: CalibrationObservation,
): CalibrationObservation {
  return {
    opportunityId: observation.opportunityId,
    recommendation: { ...observation.recommendation },
    outcome: observation.outcome ? { ...observation.outcome } : null,
  };
}
