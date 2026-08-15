import { describe, expect, it } from "vitest";
import { DOMAIN_PACKAGE_READY } from "./index.js";

describe("domain package foundation", () => {
  it("is available for TASK 010 domain types", () => {
    expect(DOMAIN_PACKAGE_READY).toBe(true);
  });
});
