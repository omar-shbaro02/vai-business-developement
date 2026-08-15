import { describe, expect, it } from "vitest";
import { loadApiConfig } from "./index.js";

describe("API configuration", () => {
  it("coerces and validates the port", () => {
    expect(loadApiConfig({ API_PORT: "4100" }).API_PORT).toBe(4100);
  });

  it("rejects invalid ports", () => {
    expect(() => loadApiConfig({ API_PORT: "70000" })).toThrow();
  });

  it("prohibits development authentication in production", () => {
    expect(() =>
      loadApiConfig({ APP_ENV: "production", AUTH_MODE: "development" }),
    ).toThrow(/OIDC/);
  });

  it("requires OIDC configuration when OIDC mode is selected", () => {
    expect(() => loadApiConfig({ AUTH_MODE: "oidc" })).toThrow(/OIDC/);
  });
});
