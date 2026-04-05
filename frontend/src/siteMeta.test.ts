import { describe, expect, it } from "vitest";
import { SITE_NAME, SITE_TITLE } from "./siteMeta";

describe("siteMeta", () => {
  it("SITE_TITLE includes SITE_NAME", () => {
    expect(SITE_TITLE).toContain(SITE_NAME);
  });
});
