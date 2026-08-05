import { describe, expect, it } from "vitest";
import { filterUsageRowsByHourRange } from "@/lib/db/repos/usageRepo.js";

function timestampAtLocalHour(hour, minute = 0, second = 0) {
  const date = new Date("2026-08-04T12:00:00.000Z");
  date.setHours(hour, minute, second, 0);
  return date.toISOString();
}

describe("filterUsageRowsByHourRange", () => {
  it("keeps rows inside the selected start-inclusive end-exclusive hours", () => {
    const rows = [
      { timestamp: timestampAtLocalHour(8, 59, 59) },
      { timestamp: timestampAtLocalHour(9) },
      { timestamp: timestampAtLocalHour(13, 59, 59) },
      { timestamp: timestampAtLocalHour(14) },
    ];
    expect(filterUsageRowsByHourRange(rows, 9, 14)).toEqual(rows.slice(1, 3));
  });

  it("returns all rows when no hour range is selected", () => {
    const rows = [{ timestamp: timestampAtLocalHour(9) }];
    expect(filterUsageRowsByHourRange(rows, null, null)).toEqual(rows);
  });

  it("supports a range ending at midnight (hour 24)", () => {
    const rows = [
      { timestamp: timestampAtLocalHour(23, 59, 59) },
      { timestamp: timestampAtLocalHour(0) },
    ];
    expect(filterUsageRowsByHourRange(rows, 23, 24)).toEqual(rows.slice(0, 1));
  });

  it("returns empty when start >= end (invalid range)", () => {
    const rows = [
      { timestamp: timestampAtLocalHour(9) },
      { timestamp: timestampAtLocalHour(14) },
    ];
    expect(filterUsageRowsByHourRange(rows, 14, 9)).toEqual([]);
  });

  it("returns empty when start equals end", () => {
    const rows = [{ timestamp: timestampAtLocalHour(9) }];
    expect(filterUsageRowsByHourRange(rows, 9, 9)).toEqual([]);
  });

  it("returns empty for non-integer hour values (invalid range)", () => {
    const rows = [{ timestamp: timestampAtLocalHour(9) }];
    expect(filterUsageRowsByHourRange(rows, "abc", "xyz")).toEqual([]);
  });

  it("filters correctly for a single-hour window (e.g. 09:00–10:00)", () => {
    const rows = [
      { timestamp: timestampAtLocalHour(8, 59) },
      { timestamp: timestampAtLocalHour(9) },
      { timestamp: timestampAtLocalHour(9, 30) },
      { timestamp: timestampAtLocalHour(9, 59, 59) },
      { timestamp: timestampAtLocalHour(10) },
    ];
    expect(filterUsageRowsByHourRange(rows, 9, 10)).toEqual(rows.slice(1, 4));
  });

  it("returns empty for negative hour values (invalid range)", () => {
    const rows = [{ timestamp: timestampAtLocalHour(9) }];
    expect(filterUsageRowsByHourRange(rows, -1, 5)).toEqual([]);
  });
});
