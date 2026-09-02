import { describe, expect, it } from "vitest";
import { authorize, type ActorContext } from "./index.js";

const reader: ActorContext = {
  actorId: "user_1",
  tenantId: "tenant_1",
  roles: ["READ_ONLY"],
  authenticated: true,
  requestId: "request_1",
};

describe("authorization policy", () => {
  it("permits an assigned capability", () => {
    expect(authorize(reader, "governed:read")).toBe(reader);
  });

  it("denies a missing capability", () => {
    expect(() => authorize(reader, "priority:override")).toThrow(/Forbidden/);
  });

  it("denies an unauthenticated context", () => {
    expect(() =>
      authorize({ ...reader, authenticated: false }, "governed:read"),
    ).toThrow(/Unauthenticated/);
  });

  it("reserves export and deletion for administrators", () => {
    expect(() =>
      authorize({ ...reader, roles: ["COMMERCIAL_OWNER"] }, "data:export"),
    ).toThrow(/Forbidden/);
    expect(
      authorize({ ...reader, roles: ["ADMIN"] }, "data:delete"),
    ).toBeTruthy();
  });
});
