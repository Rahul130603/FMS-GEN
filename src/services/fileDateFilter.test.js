import test from "node:test";
import assert from "node:assert/strict";
import { calendarDate, matchesFileDate } from "./fileDateFilter.js";
import { buildFileWorkflow } from "./fileWorkflow.js";

test("date, month and year filters handle independent and combined selections", () => {
  assert.equal(matchesFileDate("2026-09-07", { date: "2026-09-07" }), true);
  assert.equal(matchesFileDate("2026-09-08", { date: "2026-09-07" }), false);
  assert.equal(matchesFileDate("2025-09-07", { month: "09" }), true);
  assert.equal(matchesFileDate("2025-09-07", { month: "09", year: "2026" }), false);
  assert.equal(matchesFileDate("", {}), true);
  assert.equal(matchesFileDate("", { year: "2026" }), false);
  assert.equal(calendarDate("2026-02-30"), "");
  assert.equal(calendarDate(1), "");
  assert.equal(calendarDate("2026-09-07"), "2026-09-07");
  assert.equal(calendarDate(1788739200), calendarDate(1788739200000));
});

test("workflow uses latest allocation date regardless of input order, with file fallback", () => {
  const isbn = "9783631434109";
  const files = [{ isbn, uploadedAt: "2026-08-01" }];
  const allocations = [{ isbn, date: "2026-09-07" }, { isbn, date: "2026-08-15" }];
  assert.equal(buildFileWorkflow(files, [], allocations)[0].filterDate, "2026-09-07");
  assert.equal(buildFileWorkflow(files)[0].filterDate, "2026-08-01");
});
