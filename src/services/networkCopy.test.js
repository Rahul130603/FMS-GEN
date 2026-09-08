import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { findNetworkItems, copyNetworkItem } from "../../networkCopy.js";
import { runCopyPool } from "./networkCopy.js";

test("direct ISBN copy uses the selected paths and copies all matching files and nested folders", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fileflow-copy-test-"));
  t.after(async () => {
    const relative = path.relative(os.tmpdir(), root);
    assert.ok(relative.startsWith("fileflow-copy-test-") && !relative.includes(path.sep));
    await fs.rm(root, { recursive: true, force: true });
  });
  const source = path.join(root, "source"), destination = path.join(root, "destination");
  const isbn = "9783631434109", folderIsbn = "9783631434154", missing = "9783631434178";
  await fs.mkdir(path.join(source, folderIsbn, "nested"), { recursive: true });
  await fs.writeFile(path.join(source, `${isbn}_txt.pdf`), "real interior");
  await fs.writeFile(path.join(source, `${isbn}_cvr.pdf`), "real cover");
  await fs.writeFile(path.join(source, folderIsbn, "nested", "pages.txt"), "nested real file");
  const found = await findNetworkItems(source, [isbn, folderIsbn, missing, isbn]);
  assert.equal(found.found.length, 2);
  assert.deepEqual(found.missing, [missing]);
  const copied = await copyNetworkItem(found.found[0], destination, "");
  assert.equal(copied.copiedPaths.length, 2);
  assert.equal(await fs.readFile(path.join(destination, `${isbn}_txt.pdf`), "utf8"), "real interior");
  assert.equal(await fs.readFile(path.join(destination, `${isbn}_cvr.pdf`), "utf8"), "real cover");
  await copyNetworkItem(found.found[1], destination, "Batch_September");
  assert.equal(await fs.readFile(path.join(destination, "Batch_September", folderIsbn, "nested", "pages.txt"), "utf8"), "nested real file");
  await assert.rejects(findNetworkItems(path.join(root, "absent"), [isbn]), /ENOENT/);
  await assert.rejects(copyNetworkItem({ isbn, path: path.join(root, "absent") }, destination, ""), /ENOENT/);
  await assert.rejects(copyNetworkItem(found.found[0], "", ""), /Destination/);
  await assert.rejects(copyNetworkItem(found.found[0], destination, "../outside"), /Batch/);
  await assert.rejects(copyNetworkItem(found.found[1], path.join(source, folderIsbn), ""), /outside the source/);
  const blocked = path.join(root, "not-a-folder");
  await fs.writeFile(blocked, "retain me");
  await assert.rejects(copyNetworkItem(found.found[0], blocked, ""));
  assert.equal(await fs.readFile(blocked, "utf8"), "retain me");
});

test("copy pool processes every ISBN once with at most four concurrent copies", async () => {
  let active = 0, peak = 0;
  const completed = [];
  await runCopyPool(Array.from({ length: 11 }, (_, i) => i), async item => {
    active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => setImmediate(resolve));
    completed.push(item);
    active--;
  });
  assert.equal(peak, 4);
  assert.equal(new Set(completed).size, 11);
  assert.equal(active, 0);
});
