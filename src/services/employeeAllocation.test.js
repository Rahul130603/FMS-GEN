import test from "node:test";
import assert from "node:assert/strict";
import { matchesEmployee, assignedRole, mergeEmployeeAllocations, withCounterpartAssignments } from "./employeeAllocation.js";
import { calculateEqualDistribution, syncAllocatedMasterRecords, getMasterIsbnRecords, updateDeveloperCompletion } from "./masterIsbnStore.js";

test("employee identity never matches just because the role or an empty ID matches", () => {
  const user = { empId: "20022", giEmpId: "GEN0014", name: "Monica R" };
  assert.equal(matchesEmployee({ employeeCode: "GEN0014" }, user), true);
  assert.equal(matchesEmployee({ role: "book", employeeId: "20013" }, user), false);
  assert.equal(matchesEmployee({}, {}), false);
  assert.equal(assignedRole({ role: "book", department: "Graphic Designer" }), "book");
});
test("poll merge retains latest assignment, with server winning ties over stale local data", () => {
  const server = { isbn: "9783631434048", status: "WIP", statusUpdatedAt: 20 };
  const stale = { ...server, status: "Allocated", statusUpdatedAt: 10 };
  assert.deepEqual(mergeEmployeeAllocations([server, stale, server]), [server]);
});

test("a new book-only batch still resolves the current cover assignee and status", () => {
  const isbn = "9783631434260";
  const items = [
    { isbn, employee: "Monica R", department: "DEVELOPER", createdAt: 30 },
    { isbn, role: "book", employee: "Monica R", createdAt: 10 },
    { isbn, role: "cover", employee: "Dinesh S", employeeId: "20036", status: "WIP", createdAt: 10 },
    { isbn, role: "cover", employee: "Old assignee", createdAt: 1 }
  ];
  const joined = withCounterpartAssignments(items);
  assert.equal(joined[0].counterpartEmployee, "Dinesh S");
  assert.equal(joined[0].counterpartStatus, "WIP");
  assert.equal(joined[2].counterpartEmployee, "Monica R");
  const mine = mergeEmployeeAllocations(joined.filter(item => item.employee === "Monica R"));
  assert.equal(mine.length, 1);
  assert.equal(mine[0].counterpartEmployee, "Dinesh S");
});
test("100 dual ISBNs retain exact reviewed book and cover assignments through master sync", () => {
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
  globalThis.window = { dispatchEvent() {} };
  const isbns = Array.from({ length: 100 }, (_, index) => String(9783631434000 + index));
  const books = calculateEqualDistribution(100, Array.from({ length: 13 }, (_, i) => ({ id: `b${i}`, name: `Book ${i}` })));
  const covers = calculateEqualDistribution(100, Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, name: `Cover ${i}` })));
  const items = [];
  for (const [role, employees] of [["book", books], ["cover", covers]]) {
    let cursor = 0;
    employees.forEach(employee => {
      isbns.slice(cursor, cursor + employee.count).forEach(isbn => items.push({ id: `${role}-${isbn}`, isbn, role, employeeId: employee.id, employee: employee.name, status: "Allocated" }));
      cursor += employee.count;
    });
  }
  localStorage.setItem("fileflow_admin_allocations", JSON.stringify(items));
  syncAllocatedMasterRecords(items);
  assert.equal(getMasterIsbnRecords().length, 100);
  assert.equal(getMasterIsbnRecords().filter(item => item.developerId === "b0").length, 8);
  assert.equal(getMasterIsbnRecords().filter(item => item.graphicsId === "c0").length, 20);
  assert.equal(JSON.parse(localStorage.getItem("fileflow_admin_allocations")).length, 200);
  const extra = { id: "other", isbn: "9783631434999", role: "book", employeeId: "other" };
  localStorage.setItem("fileflow_admin_allocations", JSON.stringify([...items, extra]));
  updateDeveloperCompletion(isbns[0], "b0");
  assert.equal(JSON.parse(localStorage.getItem("fileflow_admin_allocations")).length, 201);
});
