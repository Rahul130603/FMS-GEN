import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";
import crypto from "node:crypto";
import { withCounterpartAssignments } from "./src/services/employeeAllocation.js";
import { readRequestBody } from "./requestBody.js";
import { findNetworkItems, copyNetworkItem } from "./networkCopy.js";

const storeFile = path.resolve("data", "admin-allocations.json");
const mailStoreFile = path.resolve("data", "internal-mail.json");
const attendanceFile = process.env.FILEFLOW_ATTENDANCE_PATH || "C:\\Users\\Admin\\Downloads\\Gentize Attendance.xlsx";
const employeeEditsFile = path.resolve("data", "employee-edits.json");
const passwordStoreFile = path.resolve("data", "employee-passwords.json");

async function readJson(file, fallback) { try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; } }
async function writeJson(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8"); }
const cleanId = value => String(value || "").trim();
const defaultPassword = empId => `FF@${cleanId(empId)}`;
const passwordHash = (empId, password) => crypto.createHash("sha256").update(`${cleanId(empId).toLowerCase()}|${password}`).digest("hex");

async function readEmployees() {
  const workbook = XLSX.readFile(attendanceFile);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Employee_Master, { header: 1, defval: "", raw: false });
  const base = rows.slice(1).filter(row => String(row[2] || "").trim()).map(row => ({
    empId:String(row[0]||"").trim(),giEmpId:String(row[1]||"").trim(),name:String(row[2]||"").trim(),address:String(row[3]||"").trim(),permanentAddress:String(row[4]||"").trim(),phone:String(row[5]||"").trim(),personalEmail:String(row[6]||"").trim(),officeEmail:String(row[7]||"").trim(),designation:String(row[8]||"").trim(),panCard:String(row[9]||"").trim(),aadhaarNumber:String(row[10]||"").trim(),emergencyContact:String(row[11]||"").trim(),bloodGroup:String(row[12]||"").trim(),dob:String(row[13]||"").trim(),doj:String(row[14]||"").trim(),qualification:String(row[19]||"").trim(),experience:String(row[20]||"").trim(),gender:String(row[21]||"").trim(),deviceNumber:String(row[23]||"").trim(),mainDoorAccess:String(row[24]||"").trim(),leftDoorAccess:String(row[25]||"").trim()
  }));
  const edits = await readJson(employeeEditsFile, { upserts: {}, deleted: [] });
  const deleted = new Set(edits.deleted || []);
  const merged = base.filter(x => !deleted.has(x.empId)).map(x => ({ ...x, ...(edits.upserts?.[x.empId] || {}) }));
  const existing = new Set(merged.map(x => x.empId));
  Object.values(edits.upserts || {}).forEach(x => { if (x.empId && !existing.has(x.empId) && !deleted.has(x.empId)) merged.push(x); });
  return merged;
}

async function readAllocations() {
  try { return JSON.parse(await fs.readFile(storeFile, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

async function writeAllocations(items) {
  await fs.mkdir(path.dirname(storeFile), { recursive: true });
  const temporary = `${storeFile}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(temporary, storeFile);
}

async function readMail() { try { return JSON.parse(await fs.readFile(mailStoreFile, "utf8")); } catch { return []; } }
async function writeMail(items) { await fs.mkdir(path.dirname(mailStoreFile), { recursive: true }); await fs.writeFile(mailStoreFile, JSON.stringify(items, null, 2), "utf8"); }

const requestBodies = new WeakMap();
function body(req) {
  if (!requestBodies.has(req)) requestBodies.set(req, readRequestBody(req));
  return requestBodies.get(req);
}

function reply(res, status, value) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(value));
}

function fileFlowApi() {
  let allocationQueue = Promise.resolve();
  return {
    name: "fileflow-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        let releaseAllocation;
        if (url.pathname.startsWith("/api/allocations") && req.method === "POST") {
          // Attach stream listeners before waiting: a queued request may finish arriving
          // while an earlier write is still in progress.
          body(req).catch(() => {});
          const previous = allocationQueue;
          allocationQueue = new Promise(resolve => { releaseAllocation = resolve; });
          await previous;
        }
        try {
          if (url.pathname === "/api/health" && req.method === "GET") {
            return reply(res, 200, { status: "ok", database: "connected", server: "FileFlow" });
          }
          if (url.pathname === "/api/allocations" && req.method === "GET") {
            const employee = (url.searchParams.get("employee") || "").toLowerCase();
            const name = (url.searchParams.get("name") || "").toLowerCase();
            const aliases = new Set([employee, ...(url.searchParams.get("aliases") || "").split(",")].map(x => x.trim().toLowerCase()).filter(Boolean));
            const items = withCounterpartAssignments(await readAllocations());
            return reply(res, 200, { ok: true, items: employee || name ? items.filter(x => {
              const ids = [x.employeeId, x.employeeCode, ...(Array.isArray(x.employeeAltIds) ? x.employeeAltIds : [])].map(value => String(value || "").trim().toLowerCase());
              return String(x.employee || "").trim().toLowerCase() === name || ids.some(id => aliases.has(id));
            }) : items });
          }
          if (url.pathname === "/api/employees" && req.method === "GET") {
            const items = await readEmployees();
            return reply(res, 200, { ok: true, source: attendanceFile, count: items.length, items });
          }
function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })).toString("base64url");
  const signature = crypto.createHmac("sha256", process.env.FILEFLOW_SECRET_KEY || "fileflow-lan-secret-key-2026-supersecure").update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

          if (url.pathname === "/api/auth/login" && req.method === "POST") {
            const { employeeId, password } = await body(req);
            const id = cleanId(employeeId);
            if (id.toLowerCase() === "admin" && (password === "Admin@123" || password === "admin" || password === "admin123" || password === "Admin")) {
              const token = makeJwt({ sub: "admin", role: "Admin" });
              return reply(res, 200, { ok:true, token, user:{ id:"admin", username:"admin", name:"Administrator", role:"Admin", empId:"ADMIN" } });
            }
            let employees = [];
            try {
              employees = await readEmployees();
            } catch (err) {
              employees = [];
            }
            const employee = employees.find(x => x.empId.toLowerCase() === id.toLowerCase() || x.giEmpId.toLowerCase() === id.toLowerCase());
            if (!employee) return reply(res, 401, { ok:false, error:"Incorrect employee ID or password" });
            const passwords = await readJson(passwordStoreFile, {});
            const validHash = passwords[employee.empId] || passwordHash(employee.empId, defaultPassword(employee.empId));
            if (passwordHash(employee.empId, password) !== validHash) return reply(res, 401, { ok:false, error:"Incorrect employee ID or password" });
            const token = makeJwt({ sub: employee.empId, role: "Employee" });
            return reply(res, 200, { ok:true, token, user:{ ...employee, username:employee.empId, role:"Employee" } });
          }
          if (url.pathname === "/api/auth/password" && req.method === "POST") {
            const { employeeId, currentPassword, newPassword } = await body(req);
            if (!newPassword || newPassword.length < 8) return reply(res, 400, { ok:false, error:"New password must contain at least 8 characters" });
            const employees = await readEmployees(); const employee = employees.find(x => x.empId === cleanId(employeeId));
            if (!employee) return reply(res, 404, { ok:false, error:"Employee not found" });
            const passwords = await readJson(passwordStoreFile, {}); const currentHash = passwords[employee.empId] || passwordHash(employee.empId, defaultPassword(employee.empId));
            if (passwordHash(employee.empId, currentPassword) !== currentHash) return reply(res, 401, { ok:false, error:"Current password is incorrect" });
            passwords[employee.empId] = passwordHash(employee.empId, newPassword); await writeJson(passwordStoreFile, passwords);
            return reply(res, 200, { ok:true });
          }
          if (url.pathname === "/api/employees" && req.method === "POST") {
            const employee = await body(req); const id = cleanId(employee.empId);
            if (!id || !cleanId(employee.name)) return reply(res, 400, { ok:false, error:"Employee ID and name are required" });
            const edits = await readJson(employeeEditsFile, { upserts:{}, deleted:[] });
            if (employee.originalEmpId && employee.originalEmpId !== id) { delete edits.upserts[employee.originalEmpId]; edits.deleted = [...new Set([...(edits.deleted || []), employee.originalEmpId])]; }
            const { originalEmpId, ...safeEmployee } = employee; edits.upserts[id] = safeEmployee; edits.deleted = (edits.deleted || []).filter(x => x !== id); await writeJson(employeeEditsFile, edits);
            return reply(res, 200, { ok:true, item:safeEmployee });
          }
          if (url.pathname === "/api/employees/delete" && req.method === "POST") {
            const { empId } = await body(req); const id = cleanId(empId); const edits = await readJson(employeeEditsFile, { upserts:{}, deleted:[] });
            delete edits.upserts[id]; edits.deleted = [...new Set([...(edits.deleted || []), id])]; await writeJson(employeeEditsFile, edits); return reply(res, 200, { ok:true });
          }
          if (url.pathname === "/api/mail" && req.method === "GET") {
            const user = (url.searchParams.get("user") || "").toLowerCase();
            const aliases = new Set([user, ...(url.searchParams.get("aliases") || "").split(",")].map(x => x.trim().toLowerCase()).filter(Boolean));
            const items = await readMail();
            return reply(res, 200, { ok: true, items: items.filter(x => {
              const targets = [x.fromId, x.toId, x.assigneeId, ...(Array.isArray(x.toAlternateIds) ? x.toAlternateIds : [])]
                .map(value => String(value || "").trim().toLowerCase());
              return x.toId === "all" || targets.some(value => aliases.has(value));
            }) });
          }
          if (url.pathname === "/api/mail" && req.method === "POST") {
            const item = await body(req); const items = await readMail();
            const mail = { ...item, id: item.id || `MAIL-${Date.now()}`, createdAt: item.createdAt || Date.now(), readBy: item.readBy || [item.fromId], deletedBy: item.deletedBy || [] };
            await writeMail([mail, ...items]); return reply(res, 200, { ok: true, item: mail });
          }
          if (url.pathname === "/api/mail/update" && req.method === "POST") {
            const update = await body(req); const items = await readMail(); const index = items.findIndex(x => x.id === update.id);
            if (index < 0) return reply(res, 404, { ok: false, error: "Mail not found" });
            items[index] = { ...items[index], ...update.patch }; await writeMail(items); return reply(res, 200, { ok: true, item: items[index] });
          }
          if (url.pathname === "/api/mail/delete" && req.method === "POST") {
            const payload = await body(req);
            const ids = new Set(Array.isArray(payload.ids) ? payload.ids : []);
            if (!ids.size) return reply(res, 400, { ok: false, error: "No mail IDs supplied" });
            const items = await readMail();
            const remaining = items.filter(item => !ids.has(item.id));
            await writeMail(remaining);
            return reply(res, 200, { ok: true, deletedCount: items.length - remaining.length });
          }
          if (url.pathname === "/api/allocations" && req.method === "POST") {
            const item = await body(req);
            const items = await readAllocations();
            const next = [item, ...items.filter(x => x.id !== item.id)];
            await writeAllocations(next);
            return reply(res, 200, { ok: true, item });
          }
          if (url.pathname === "/api/allocations/batch" && req.method === "POST") {
            const payload = await body(req); const incoming = Array.isArray(payload.items) ? payload.items : [];
            if (!incoming.length) return reply(res, 400, { ok: false, error: "No allocations supplied" });
            const items = await readAllocations(); const incomingIds = new Set(incoming.map(item => item.id));
            await writeAllocations([...incoming, ...items.filter(item => !incomingIds.has(item.id))]);
            return reply(res, 200, { ok: true, count: incoming.length, items: incoming });
          }
          if (url.pathname === "/api/allocations/status" && req.method === "POST") {
            const update = await body(req);
            const items = await readAllocations();
            const cleanIsbn = update.isbn ? String(update.isbn).trim() : "";

            // If updating trimSize or pageCount, sync across ALL records with this ISBN (Book Dev, Cover Dev, QC, QAG)
            if (cleanIsbn && (update.trimSize !== undefined || update.pageCount !== undefined)) {
              items.forEach((x, idx) => {
                if (String(x.isbn).trim() === cleanIsbn) {
                  if (update.trimSize !== undefined) items[idx].trimSize = update.trimSize;
                  if (update.pageCount !== undefined) items[idx].pageCount = update.pageCount;
                  if (update.specsEnteredBy !== undefined) items[idx].specsEnteredBy = update.specsEnteredBy;
                  items[idx].statusUpdatedAt = Date.now();
                }
              });
            }

            const index = items.findIndex(x => (update.id && x.id === update.id) || (cleanIsbn && String(x.isbn).trim() === cleanIsbn));
            if (index < 0 && !cleanIsbn) return reply(res, 404, { ok: false, error: "Allocation not found" });

            if (index >= 0) {
              const nextStatus = update.status || items[index].status;
              items[index] = {
                ...items[index],
                status: nextStatus,
                completed: nextStatus === "Complete" ? 1 : 0,
                hold: nextStatus === "Hold" ? 1 : 0,
                rejected: ["Reject", "Rework"].includes(nextStatus) ? 1 : 0,
                statusReason: update.statusReason !== undefined ? update.statusReason : items[index].statusReason,
                started: update.started !== undefined ? update.started : items[index].started,
                ended: update.ended !== undefined ? update.ended : items[index].ended,
                trimSize: update.trimSize !== undefined ? update.trimSize : items[index].trimSize,
                pageCount: update.pageCount !== undefined ? update.pageCount : items[index].pageCount,
                specsEnteredBy: update.specsEnteredBy !== undefined ? update.specsEnteredBy : items[index].specsEnteredBy,
                uploaded: update.uploaded || items[index].uploaded || "",
                savedPath: update.savedPath || items[index].savedPath || "",
                downloadSavedPath: update.downloadSavedPath || items[index].downloadSavedPath,
                statusUpdatedAt: Date.now()
              };
            }
            await writeAllocations(items);
            return reply(res, 200, { ok: true, item: index >= 0 ? items[index] : null });
          }
          if (url.pathname === "/api/allocations/clear" && req.method === "POST") {
            const { employeeId, employeeName, isbn } = await body(req);
            let items = await readAllocations();
            if (isbn) {
              items = items.filter(x => x.isbn !== isbn);
            } else if (employeeId || employeeName) {
              const targetId = String(employeeId || "").toLowerCase();
              const targetName = String(employeeName || "").toLowerCase();
              items = items.filter(x => {
                const ids = [x.employeeId, x.employeeCode, ...(Array.isArray(x.employeeAltIds) ? x.employeeAltIds : [])].map(v => String(v || "").toLowerCase());
                const name = String(x.employee || "").toLowerCase();
                const match = (targetId && ids.includes(targetId)) || (targetName && name === targetName);
                return !match;
              });
            } else {
              items = [];
            }
            await writeAllocations(items);
            return reply(res, 200, { ok: true, count: items.length });
          }
          if ((url.pathname === "/api/notifications" || url.pathname === "/notifications") && req.method === "GET") {
            const employeeId = (url.searchParams.get("employeeId") || url.searchParams.get("employee") || "").toLowerCase();
            const role = (url.searchParams.get("role") || "").toLowerCase();
            const notifs = await readJson(path.resolve("data", "notifications.json"), []);
            const filtered = notifs.filter(item => {
              if (!employeeId && !role) return true;
              const targetIds = [item.employeeId, item.recipientId, ...(Array.isArray(item.targetEmployeeIds) ? item.targetEmployeeIds : [])]
                .filter(Boolean).map(x => String(x).toLowerCase());
              const targetRoles = [item.role, item.recipientRole, ...(Array.isArray(item.targetRoles) ? item.targetRoles : [])]
                .filter(Boolean).map(x => String(x).toLowerCase());
              if (employeeId && targetIds.length && !targetIds.includes(employeeId)) return false;
              if (role && targetRoles.length && !targetRoles.includes(role)) return false;
              return true;
            });
            const unreadCount = filtered.filter(n => !n.read).length;
            return reply(res, 200, { ok: true, items: filtered, notifications: filtered, unread: unreadCount, total: filtered.length });
          }
          if ((url.pathname === "/api/notifications" || url.pathname === "/notifications") && req.method === "POST") {
            const item = await body(req);
            const notifsFile = path.resolve("data", "notifications.json");
            const notifs = await readJson(notifsFile, []);
            const cleanIsbn = item.isbn || item.reportSummary?.isbn || item.fileName || "";
            const cleanStatus = item.status || item.reportSummary?.status || "Update";
            const cleanProject = item.projectName || item.project || item.reportSummary?.projectName || (cleanIsbn ? `Peter Lang Title (${cleanIsbn})` : "General Production");
            const cleanProjectId = item.projectId || item.reportSummary?.projectId || "PRJ-PETERLANG";
            const newNotif = {
              id: item.id || `NOTIF-${Date.now()}`,
              createdAt: item.createdAt || Date.now(),
              read: false,
              ...item,
              isbn: cleanIsbn,
              status: cleanStatus,
              projectName: cleanProject,
              projectId: cleanProjectId,
              employeeId: item.employeeId || item.senderId || "EMP",
              employeeName: item.employeeName || item.senderName || "Employee",
              reason: item.reason || item.remarks || item.description || "Status updated",
              remarks: item.remarks || item.reason || item.description || ""
            };
            const updated = [newNotif, ...notifs].slice(0, 500);
            await writeJson(notifsFile, updated);
            return reply(res, 200, { ok: true, item: newNotif, notification: newNotif });
          }
          if ((url.pathname === "/api/notifications/read" || url.pathname === "/notifications/read") && req.method === "POST") {
            const { id } = await body(req);
            const notifsFile = path.resolve("data", "notifications.json");
            const notifs = await readJson(notifsFile, []);
            const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
            await writeJson(notifsFile, updated);
            return reply(res, 200, { ok: true, id });
          }
          if ((url.pathname === "/api/notifications/read-all" || url.pathname === "/notifications/read-all") && req.method === "POST") {
            const { employeeId } = await body(req);
            const notifsFile = path.resolve("data", "notifications.json");
            const notifs = await readJson(notifsFile, []);
            const targetId = String(employeeId || "").toLowerCase();
            const updated = notifs.map(n => (!targetId || String(n.employeeId || "").toLowerCase() === targetId || String(n.recipientId || "").toLowerCase() === targetId) ? { ...n, read: true } : n);
            await writeJson(notifsFile, updated);
            return reply(res, 200, { ok: true, count: updated.filter(n => n.read).length });
          }
          if ((url.pathname === "/api/notifications/clear-read" || url.pathname === "/notifications/clear-read") && req.method === "POST") {
            const { employeeId } = await body(req);
            const notifsFile = path.resolve("data", "notifications.json");
            let notifs = await readJson(notifsFile, []);
            const targetId = String(employeeId || "").toLowerCase();
            if (targetId) {
              notifs = notifs.filter(n => !(n.read && (String(n.employeeId || "").toLowerCase() === targetId || String(n.recipientId || "").toLowerCase() === targetId)));
            } else {
              notifs = notifs.filter(n => !n.read);
            }
            await writeJson(notifsFile, notifs);
            return reply(res, 200, { ok: true, remaining: notifs.length });
          }
          if ((url.pathname === "/api/notifications/delete" || url.pathname === "/notifications/delete") && req.method === "POST") {
            const { id } = await body(req);
            const notifsFile = path.resolve("data", "notifications.json");
            let notifs = await readJson(notifsFile, []);
            notifs = notifs.filter(n => n.id !== id);
            await writeJson(notifsFile, notifs);
            return reply(res, 200, { ok: true, id, remaining: notifs.length });
          }
          if ((url.pathname === "/api/notifications/clear" || url.pathname === "/notifications/clear") && req.method === "POST") {
            const { employeeId } = await body(req);
            const notifsFile = path.resolve("data", "notifications.json");
            let notifs = await readJson(notifsFile, []);
            const targetId = String(employeeId || "").toLowerCase();
            if (targetId) {
              notifs = notifs.filter(n => String(n.employeeId || "").toLowerCase() !== targetId && String(n.recipientId || "").toLowerCase() !== targetId);
            } else {
              notifs = [];
            }
            await writeJson(notifsFile, notifs);
            return reply(res, 200, { ok: true, remaining: notifs.length });
          }
          if (url.pathname === "/api/network/find" && req.method === "POST") {
            const { source, isbns = [] } = await body(req);
            return reply(res, 200, await findNetworkItems(source, isbns));
          }

          if (url.pathname === "/api/network/upload-path" && req.method === "POST") {
            const { source, destination, batch, isbns = [] } = await body(req);
            const sourcePath = String(source || "").trim();
            const destinationPath = String(destination || "").trim();
            if (!sourcePath || !destinationPath) return reply(res, 400, { ok: false, error: "Source and destination paths are required" });

            const sourceStat = await fs.stat(sourcePath);
            const safeBatch = path.basename(String(batch || "FileFlow_Batch")).trim() || "FileFlow_Batch";
            const targetPath = path.join(destinationPath, safeBatch);
            await fs.mkdir(targetPath, { recursive: true });
            const requestedIsbns = [...new Set((Array.isArray(isbns) ? isbns : String(isbns).split(/[\n, ]+/)).map(value => String(value).trim()).filter(Boolean))];
            const files = [];
            const copiedItems = [];
            const collectFiles = async (currentPath, relativeRoot = "") => {
              const entries = await fs.readdir(currentPath, { withFileTypes: true });
              for (const entry of entries) {
                const entryPath = path.join(currentPath, entry.name);
                const relativePath = path.join(relativeRoot, entry.name);
                if (entry.isDirectory()) await collectFiles(entryPath, relativePath);
                else files.push(relativePath);
              }
            };
            if (sourceStat.isDirectory()) {
              if (requestedIsbns.length) {
                const sourceEntries = await fs.readdir(sourcePath, { withFileTypes: true });
                for (const isbn of requestedIsbns) {
                  const match = sourceEntries.find(entry => entry.name === isbn || entry.name.startsWith(`${isbn}_`) || entry.name.startsWith(`${isbn}.`));
                  if (!match) continue;
                  const sourceItem = path.join(sourcePath, match.name);
                  const destinationItem = path.join(targetPath, match.name);
                  await fs.cp(sourceItem, destinationItem, { recursive: true, force: true });
                  copiedItems.push(match.name);
                  if (match.isDirectory()) await collectFiles(sourceItem, match.name);
                  else files.push(match.name);
                }
              } else {
                await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
                await collectFiles(sourcePath);
                copiedItems.push(...files);
              }
            } else {
              const sourceName = path.basename(sourcePath);
              const fileIsbn = sourceName.match(/\b\d{13}\b/)?.[0];
              if (!requestedIsbns.length || (fileIsbn && requestedIsbns.includes(fileIsbn))) {
                await fs.copyFile(sourcePath, path.join(targetPath, sourceName));
                files.push(sourceName);
                copiedItems.push(sourceName);
              }
            }
            const uploadedIsbns = [...new Set(copiedItems.flatMap(file => file.match(/\b\d{13}\b/g) || []))];
            return reply(res, 200, {
              ok: true,
              sourcePath,
              destinationPath: targetPath,
              batch: safeBatch,
              requestedIsbns,
              copiedItems,
              fileCount: files.length,
              uploadedIsbns,
              uploadedAt: Date.now()
            });
          }
          if (url.pathname === "/api/network/copy" && req.method === "POST") {
            const { item, destination, batch } = await body(req);
            return reply(res, 200, await copyNetworkItem(item, destination, batch));
          }

          next();
        } catch (error) {
          reply(res, 500, { ok: false, error: error.message || "Operation failed" });
        } finally {
          releaseAllocation?.();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), fileFlowApi()],
  server: {
    host: "0.0.0.0",
    port: 5175,
    strictPort: false,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/network-find": "http://127.0.0.1:8000",
      "/network-copy": "http://127.0.0.1:8000",
      "/prepare-temp": "http://127.0.0.1:8000",
      "/temp-status": "http://127.0.0.1:8000",
      "/temp-files": "http://127.0.0.1:8000",
      "/temp-download": "http://127.0.0.1:8000",
      "/temp-delete-all": "http://127.0.0.1:8000",
      "/export-report": "http://127.0.0.1:8000",
      "/recents": "http://127.0.0.1:8000",
      "/state": "http://127.0.0.1:8000",
      "/notifications": "http://127.0.0.1:8000",
      "/input-files": "http://127.0.0.1:8000",
      "/open-input-folder": "http://127.0.0.1:8000",
      "/download-file": "http://127.0.0.1:8000",
      "/prepare-dummy": "http://127.0.0.1:8000",
      "/upload-completed": "http://127.0.0.1:8000"
    }
  }
});
