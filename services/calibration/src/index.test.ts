import { describe, expect, it } from "vitest";
import {
  buildCalibrationReport,
  type CalibrationObservation,
} from "./index.js";

const observations: CalibrationObservation[] = [
  {
    opportunityId: "opp-1",
    recommendation: {
      decisionId: "dec-1",
      priority: "P1_PURSUE_NOW",
      confidence: "HIGH",
      ruleVersion: "priority/0.1",
      calculatedAt: "2026-08-01T00:00:00.000Z",
    },
    outcome: {
      outcomeId: "out-1",
      type: "MEETING_BOOKED",
      occurredAt: "2026-08-03T00:00:00.000Z",
    },
  },
  {
    opportunityId: "opp-2",
    recommendation: {
      decisionId: "dec-2",
      priority: "P2_DEVELOP",
      confidence: "LOW",
      ruleVersion: "priority/0.1",
      calculatedAt: "2026-08-02T00:00:00.000Z",
    },
    outcome: null,
  },
];

describe("outcome calibration", () => {
  it("compares historical recommendations with later outcomes without mutating inputs", () => {
    const before = JSON.parse(
      JSON.stringify(observations),
    ) as CalibrationObservation[];
    const report = buildCalibrationReport(
      observations,
      "2026-09-01T00:00:00.000Z",
    );
    expect(observations).toEqual(before);
    expect(report.comparisons[0]).toMatchObject({
      opportunityId: "opp-1",
      comparisonStatus: "VALID",
      positiveOutcome: true,
      recommendation: { decisionId: "dec-1", priority: "P1_PURSUE_NOW" },
    });
  });

  it("versions metrics and preserves unknown outcomes outside denominators", () => {
    const report = buildCalibrationReport(
      observations,
      "2026-09-01T00:00:00.000Z",
    );
    expect(report.metricVersion).toBe("calibration/0.1");
    expect(report.cohort).toEqual({
      recommendations: 2,
      outcomesObserved: 1,
      validComparisons: 1,
    });
    expect(report.outcomeCoverage).toBe(0.5);
    expect(
      report.byPriority.find((item) => item.priority === "P2_DEVELOP")
        ?.positiveOutcomeRate,
    ).toBeNull();
  });

  it("rejects outcomes predating recommendations from calibration", () => {
    const invalid: CalibrationObservation = {
      ...observations[0]!,
      outcome: {
        outcomeId: "out-old",
        type: "WON",
        occurredAt: "2026-07-01T00:00:00.000Z",
      },
    };
    const report = buildCalibrationReport(
      [invalid],
      "2026-09-01T00:00:00.000Z",
    );
    expect(report.comparisons[0]?.comparisonStatus).toBe("INVALID_CHRONOLOGY");
    expect(report.cohort.validComparisons).toBe(0);
    expect(report.byPriority[0]?.positiveOutcomeRate).toBeNull();
  });
});
