import { describe, expect, it } from "vitest";
import { transition } from "./index.js";

describe("governed lifecycle transitions", () => {
  it("allows evidence review with an actor", () => {
    expect(
      transition(
        {
          lifecycle: "EVIDENCE",
          from: "RAW",
          to: "REVIEWED",
          actorId: "user_1",
          occurredAt: "2026-08-15T00:00:00.000Z",
        },
        "transition_1",
      ),
    ).toMatchObject({ from: "RAW", to: "REVIEWED" });
  });

  it("blocks prohibited terminal transitions", () => {
    expect(() =>
      transition(
        {
          lifecycle: "HYPOTHESIS",
          from: "REJECTED",
          to: "VALIDATED",
          actorId: "user_1",
          occurredAt: "2026-08-15T00:00:00.000Z",
        },
        "transition_2",
      ),
    ).toThrow(/prohibited/);
  });

  it("requires an actor", () => {
    expect(() =>
      transition(
        {
          lifecycle: "OPPORTUNITY",
          from: "DRAFT",
          to: "ACTIVE",
          actorId: "",
          occurredAt: "2026-08-15T00:00:00.000Z",
        },
        "transition_3",
      ),
    ).toThrow(/actor/);
  });
});
