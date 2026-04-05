import { describe, expect, it } from "vitest";
import { ApiHttpError } from "./api";
import { simulationHttpErrorMessage } from "./simulationErrorMessage";

describe("simulationHttpErrorMessage", () => {
  it("returns Russian message for 401/403 ApiHttpError", () => {
    expect(simulationHttpErrorMessage(new ApiHttpError(401, "x"))).toContain("Сессия истекла");
    expect(simulationHttpErrorMessage(new ApiHttpError(403, "x"))).toContain("доступ");
  });

  it("returns null for other errors", () => {
    expect(simulationHttpErrorMessage(new ApiHttpError(500, "x"))).toBeNull();
    expect(simulationHttpErrorMessage(new Error("x"))).toBeNull();
  });
});
