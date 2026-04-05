import { describe, expect, it } from "vitest";
import {
  DESKTOP_VIRUS_CATALOG,
  getDesktopVirusEntry,
  isDesktopVirusId,
} from "./desktopVirusCatalog";

describe("desktopVirusCatalog", () => {
  it("isDesktopVirusId guards ids", () => {
    expect(isDesktopVirusId("process_parasite")).toBe(true);
    expect(isDesktopVirusId("nope")).toBe(false);
    expect(isDesktopVirusId(undefined)).toBe(false);
  });

  it("getDesktopVirusEntry returns catalog row", () => {
    const e = getDesktopVirusEntry("file_worm");
    expect(e.id).toBe("file_worm");
    expect(DESKTOP_VIRUS_CATALOG.length).toBeGreaterThan(0);
  });
});
