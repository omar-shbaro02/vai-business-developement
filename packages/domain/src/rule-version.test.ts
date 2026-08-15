import { describe, expect, it } from "vitest";
import { createVersionedResult, RuleRegistry } from "./index.js";

describe("rule version framework", () => {
  it("registers exact immutable versions and rejects replacement", () => {
    const registry = new RuleRegistry<{ threshold: number }>();
    const key = registry.register(
      { family: "priority", version: "1.0.0" },
      { threshold: 3 },
    );
    expect(key).toBe("priority/1.0.0");
    expect(() =>
      registry.register(
        { family: "priority", version: "1.0.0" },
        { threshold: 4 },
      ),
    ).toThrow(/already/);
    expect(registry.get(key)).toEqual({ threshold: 3 });
  });

  it("records the exact rule version on a result", () => {
    expect(
      createVersionedResult("priority/1.0.0", "2026-08-15T00:00:00.000Z", {
        priority: "P2_DEVELOP",
      }),
    ).toMatchObject({
      ruleVersion: "priority/1.0.0",
      result: { priority: "P2_DEVELOP" },
    });
  });
});
