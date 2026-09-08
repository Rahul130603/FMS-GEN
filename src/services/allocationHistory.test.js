import test from "node:test";
import assert from "node:assert/strict";
import { buildAllocationHistory } from "./allocationHistory.js";

test("history recovers server batches and counts unique ISBNs separately from dual assignments", () => {
  const records = [
    { id: "book", batchId: "BATCH-1788780406737", isbn: "9783631436745", batchFile: "source.xlsx", allocationMode: "Dual" },
    { id: "cover", batchId: "BATCH-1788780406737", isbn: "9783631436745", batchFile: "source.xlsx", allocationMode: "Dual" }
  ];
  const [row] = buildAllocationHistory([], [...records, ...records]);
  assert.equal(row.totalFiles, 1);
  assert.equal(row.assignments, 2);
  assert.equal(row.sourceType, "Excel");
  assert.equal(row.status, "Allocated");
});

test("manual uploads appear before allocation and mixed batches preserve both sources", () => {
  const uploads = [{ id: "IMPORT-1", createdAt: 1788780406730, fileName: "Manual ISBN entry", sourceType: "Manual", isbns: ["9783631436745"] }];
  const allocations = [
    { id: "a", batchId: "BATCH-1788780406737", isbn: "9783631436745", sourceName: "Manual ISBN entry", sourceType: "Manual" },
    { id: "b", batchId: "BATCH-1788780406737", isbn: "9783631436783", sourceName: "input.xlsx", sourceType: "Excel" }
  ];
  const rows = buildAllocationHistory([], allocations, uploads);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].sourceType, "Mixed");
  assert.match(rows[0].fileName, /Manual ISBN entry/);
  assert.match(rows[0].fileName, /input.xlsx/);
  assert.equal(rows[1].status, "Uploaded");
  assert.equal(rows[1].totalFiles, 1);
});

test("legacy history is retained without guessing missing source information", () => {
  const [row] = buildAllocationHistory([{ id: "BATCH-1788780406737", totalFiles: 100 }]);
  assert.equal(row.sourceType, "Unknown");
  assert.equal(row.fileName, "Unspecified (legacy)");
  assert.equal(row.totalFiles, 100);
});
