import { describe, expect, it } from "vitest";
import { isoWeekday } from "./weekday";

describe("isoWeekday", () => {
  it("el lunes es 1", () => expect(isoWeekday("2026-11-09")).toBe(1));
  it("el domingo es 7", () => expect(isoWeekday("2026-11-15")).toBe(7));
});
