import test from "node:test";
import assert from "node:assert/strict";
import { distributeFiles, editManualCount } from "./allocationDistribution.js";
import { saveAllocationBatch } from "./allocationRequest.js";
import { readRequestBody } from "../../requestBody.js";
import { PassThrough } from "node:stream";

const members = Array.from({ length: 4 }, (_, id) => ({ id: String(id), workload: 20 + id }));
const counts = (total, overrides) => distributeFiles(total, members, overrides, "Custom Count").map(member => member.count);

test("100 files: raising and lowering a manual count redistributes the entire remainder", () => {
  assert.deepEqual(counts(100, { 0: 40 }), [40, 20, 20, 20]);
  assert.deepEqual(counts(100, { 0: 10 }), [10, 30, 30, 30]);
  assert.deepEqual(counts(100, { 0: 39 }), [39, 21, 20, 20]);
  const edited = editManualCount({ 0: 40 }, "1", 70, members, 100);
  assert.deepEqual(counts(100, edited), [10, 70, 10, 10]);
});

test("zero, over-limit, fractional, shrinking batch, deselection and single member counts remain valid", () => {
  assert.deepEqual(counts(100, { 0: 1000 }), [100, 0, 0, 0]);
  assert.deepEqual(counts(100, { 0: -10 }), [0, 34, 33, 33]);
  assert.deepEqual(counts(100, { 0: 40.9 }), [40, 20, 20, 20]);
  assert.deepEqual(counts(20, { 0: 40 }), [20, 0, 0, 0]);
  assert.deepEqual(counts(0, { 0: 40 }), [0, 0, 0, 0]);
  assert.deepEqual(counts(100, editManualCount({ 0: 40 }, "0", "", members, 100)), [25, 25, 25, 25]);
  assert.equal(distributeFiles(100, [members[0]], { 0: 40 }, "Custom Count")[0].count, 100);
  assert.equal(distributeFiles(100, members.slice(1), { 0: 40 }, "Custom Count").reduce((sum, member) => sum + member.count, 0), 100);
});

test("dual groups retain independent manual counts", () => {
  const covers = [{ id: "c1" }, { id: "c2" }];
  const overrides = editManualCount({ 0: 40 }, "c1", 60, covers, 100);
  assert.deepEqual(counts(100, overrides), [40, 20, 20, 20]);
  assert.deepEqual(distributeFiles(100, covers, overrides, "Custom Count").map(member => member.count), [60, 40]);
});

test("equal and workload distributions never lose or duplicate rounding remainders", () => {
  for (let total = 0; total <= 105; total++) {
    for (const method of ["Equal Split", "Workload Balanced"]) {
      const result = distributeFiles(total, members, {}, method);
      assert.equal(result.reduce((sum, member) => sum + member.count, 0), total);
      assert.ok(result.every(member => Number.isInteger(member.count) && member.count >= 0));
    }
  }
});

test("allocation save surfaces server errors and times out a stalled response", async () => {
  await assert.rejects(saveAllocationBatch([], { fetchImpl: async () => ({ ok: false, json: async () => ({ error: "Write failed" }) }) }), /Write failed/);
  await assert.rejects(saveAllocationBatch([], {
    timeoutMs: 10,
    fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))))
  }), /timed out/);
  const result = await saveAllocationBatch([{ id: "test" }], {
    fetchImpl: async (_, options) => {
      assert.deepEqual(JSON.parse(options.body).items, [{ id: "test" }]);
      return { ok: true, json: async () => ({ ok: true, count: 1 }) };
    }
  });
  assert.equal(result.count, 1);
});

test("request arriving while queued is captured, incomplete and aborted streams settle", async () => {
  const queued = new PassThrough();
  const received = readRequestBody(queued);
  queued.end('{"items":[{"id":"queued"}]}');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(await received, { items: [{ id: "queued" }] });
  await assert.rejects(readRequestBody(queued), /no longer available/);
  const stalled = new PassThrough();
  await assert.rejects(readRequestBody(stalled, 10), /timed out/);
  const aborted = new PassThrough();
  const pending = readRequestBody(aborted);
  aborted.emit("aborted");
  await assert.rejects(pending, /aborted/);
  const invalid = new PassThrough();
  const malformed = readRequestBody(invalid);
  invalid.end("{");
  await assert.rejects(malformed, SyntaxError);
});
