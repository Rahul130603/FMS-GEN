import test from "node:test";
import assert from "node:assert/strict";
import { buildFileWorkflow } from "./fileWorkflow.js";

const isbn = "9783631434048";
const stages = master => {
  const row = buildFileWorkflow([], [{ isbn, ...master }])[0];
  return [row.development, row.qc, row.qag, row.fileUpload];
};
test("development waits for both book and cover in either completion order", () => {
  assert.deepEqual(stages({}), ["YTA", "YTA", "YTA", "YTA"]);
  assert.deepEqual(stages({ developerStatus: "Complete" }), ["Start", "YTA", "YTA", "YTA"]);
  assert.deepEqual(stages({ graphicsStatus: "Complete" }), ["Start", "YTA", "YTA", "YTA"]);
});
test("QC and QAG unlock sequentially; completion alone does not imply upload", () => {
  const master = { developerStatus: "Complete", graphicsStatus: "Complete" };
  assert.deepEqual(stages(master), ["Complete", "Start", "YTA", "YTA"]);
  master.qcStatus = "Completed";
  assert.deepEqual(stages(master), ["Complete", "Complete", "Start", "YTA"]);
  master.qagStatus = "Completed";
  assert.deepEqual(stages(master), ["Complete", "Complete", "Complete", "Start"]);
  assert.equal(buildFileWorkflow([], [{ isbn, ...master }], [], [isbn])[0].fileUpload, "Uploaded");
  master.graphicsStatus = "Rework";
  assert.equal(buildFileWorkflow([], [{ isbn, ...master }], [], [isbn])[0].fileUpload, "YTA");
});
test("one normalized ISBN row retains both assigned names and ignores generic allocated status", () => {
  const rows = buildFileWorkflow([{ isbn }, { isbn: "978-3631434048" }, { isbn: "invalid" }], [], [
    { isbn, process: "Book Development", employee: "Book Employee", status: "Complete" },
    { isbn, process: "Cover Development", employee: "Cover Employee", status: "Allocated" },
    { isbn, process: "Quality Control", employee: "QC Employee", status: "Complete" }
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].assignees.developer, "Book Employee");
  assert.equal(rows[0].assignees.graphics, "Cover Employee");
  assert.equal(rows[0].development, "Start");
  assert.equal(rows[0].qc, "YTA");
});
