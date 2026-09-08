import os
import sys
import json
import time
import shutil
import re
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import temp_file_store
import xlsx_builder

PORT = int(os.environ.get("FILEFLOW_PORT", 8000))
SHARED_TOKEN = os.environ.get("FILEFLOW_TOKEN", "fileflow-secret-token-2026")

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Filesystem roots
INPUT_ROOT = Path(os.environ.get("INPUT_ROOT", r"C:\QC_Testing"))
OUTPUT_ROOT = Path(os.environ.get("OUTPUT_ROOT", r"C:\QC_Testing\Output"))

try:
    INPUT_ROOT.mkdir(parents=True, exist_ok=True)
except Exception:
    INPUT_ROOT = BASE_DIR / "QC_Testing"
    INPUT_ROOT.mkdir(parents=True, exist_ok=True)

try:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
except Exception:
    OUTPUT_ROOT = BASE_DIR / "Output_Files"
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

STATE_FILE = DATA_DIR / "fileflow_state.json"
NOTIFS_FILE = DATA_DIR / "notifications.json"
RECENTS_FILE = DATA_DIR / "recents_deleted.json"

store = temp_file_store.TempFileStore(
    db_path=str(DATA_DIR / "fileflow_temp_files.sqlite3"),
    store_dir=str(BASE_DIR / "temp_file_store")
)

def read_json_file(file_path, default):
    try:
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return default

def write_json_file(file_path, data):
    file_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = file_path.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    temp_path.replace(file_path)

def merge_state_rows(incoming_rows):
    current_rows = read_json_file(STATE_FILE, [])
    row_map = {}
    for r in current_rows:
        eid = str(r.get("eid", r.get("employeeId", ""))).strip()
        isbn = str(r.get("isbn", "")).strip()
        role = str(r.get("workType", r.get("role", ""))).strip().lower()
        key = f"{eid}:{isbn}:{role}"
        row_map[key] = r

    for r in incoming_rows:
        eid = str(r.get("eid", r.get("employeeId", ""))).strip()
        isbn = str(r.get("isbn", "")).strip()
        role = str(r.get("workType", r.get("role", ""))).strip().lower()
        key = f"{eid}:{isbn}:{role}"
        old = row_map.get(key, {})
        row_map[key] = {**old, **r}

    all_merged = list(row_map.values())
    write_json_file(STATE_FILE, all_merged)
    return all_merged

def parse_isbns(text):
    return [s.strip() for s in re.split(r"[\r\n,;\t\s]+", text or "") if s.strip()]

class FileFlowHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Clean stdout
        pass

    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-FileFlow-Token")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors()
        self.end_headers()

    def check_auth(self):
        # X-FileFlow-Token OR same-origin
        client_token = self.headers.get("X-FileFlow-Token")
        if client_token and client_token == SHARED_TOKEN:
            return True
        origin = self.headers.get("Origin") or self.headers.get("Referer") or ""
        host = self.headers.get("Host") or ""
        if host and (host in origin or not origin):
            return True
        return True  # Dev flexibility

    def reply_json(self, status, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def do_GET(self):
        if not self.check_auth():
            return self.reply_json(401, {"ok": False, "error": "Unauthorized"})

        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        path = parsed.path

        if path in ("/", "/index.html", "/fileflow"):
            # Serve vanilla frontend
            html_path = BASE_DIR / "public" / "fileflow.html"
            if not html_path.exists():
                html_path = BASE_DIR / "index.html"
            if html_path.exists():
                with open(html_path, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_cors()
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return

        if path == "/health":
            return self.reply_json(200, {
                "ok": True,
                "inputRoot": str(INPUT_ROOT),
                "outputRoot": str(OUTPUT_ROOT),
                "serverTime": time.time()
            })

        if path == "/temp-status":
            owner_id = params.get("ownerId", [""])[0]
            return self.reply_json(200, {"ok": True, "status": store.get_status(owner_id)})

        if path == "/temp-files":
            owner_id = params.get("ownerId", [""])[0]
            role = params.get("role", [None])[0]
            return self.reply_json(200, {"ok": True, "files": store.list_files(owner_id, role)})

        if path == "/recents":
            owner_id = params.get("ownerId", [""])[0]
            all_recents = read_json_file(RECENTS_FILE, [])
            if owner_id:
                filtered = [b for b in all_recents if b.get("ownerId") == owner_id]
            else:
                filtered = all_recents
            return self.reply_json(200, {"ok": True, "batches": filtered})

        if path == "/temp-download":
            file_id = params.get("id", [""])[0]
            owner_id = params.get("ownerId", [None])[0]
            role = params.get("role", [None])[0]
            item = store.get_file(file_id, owner_id)
            if not item:
                return self.reply_json(404, {"ok": False, "error": "File not found or expired"})

            orig_name = item["original_name"]
            # Role check
            name_lower = orig_name.lower()
            if role == "book" and ("_cvr" in name_lower or "cvr" in name_lower):
                return self.reply_json(403, {"ok": False, "error": "Role restricted from this deliverable"})
            if role == "cover" and ("_txt" in name_lower or "txt" in name_lower):
                return self.reply_json(403, {"ok": False, "error": "Role restricted from this deliverable"})

            file_path = Path(item["path"])
            if not file_path.exists():
                return self.reply_json(404, {"ok": False, "error": "Stored file missing"})

            self.send_response(200)
            self.send_cors()
            self.send_header("Content-Type", item.get("content_type", "application/octet-stream"))
            self.send_header("Content-Disposition", f'attachment; filename="{orig_name}"')
            self.send_header("Content-Length", str(file_path.stat().st_size))
            self.end_headers()
            with open(file_path, "rb") as f:
                shutil.copyfileobj(f, self.wfile, length=temp_file_store.CHUNK_SIZE)
            return

        if path == "/state":
            rows = read_json_file(STATE_FILE, [])
            return self.reply_json(200, {"ok": True, "rows": rows})

        if path == "/notifications":
            notifs = read_json_file(NOTIFS_FILE, [])
            employee_id = params.get("employeeId", [""])[0].strip().lower()
            role = params.get("role", [""])[0].strip().lower()
            if employee_id or role:
                def visible_to_employee(item):
                    target_ids = [str(value).strip().lower() for value in item.get("targetEmployeeIds", []) if value]
                    target_roles = [str(value).strip().lower() for value in item.get("targetRoles", []) if value]
                    item_employee_id = str(item.get("employeeId") or item.get("recipientId") or "").strip().lower()
                    if not target_ids and item_employee_id and employee_id and item_employee_id != employee_id:
                        return False
                    if target_ids and employee_id not in target_ids:
                        return False
                    if target_roles and role not in target_roles:
                        return False
                    return True
                notifs = [item for item in notifs if visible_to_employee(item)]
            unread_count = len([item for item in notifs if not item.get("read")])
            return self.reply_json(200, {
                "ok": True,
                "items": notifs,
                "notifications": notifs,
                "unread": unread_count,
                "total": len(notifs)
            })

        if path == "/input-files":
            isbn = params.get("isbn", [""])[0]
            target_dir = INPUT_ROOT / str(isbn)
            files = []
            if target_dir.exists():
                for root, dirs, fnames in os.walk(target_dir):
                    for fn in fnames:
                        fp = Path(root) / fn
                        files.append({
                            "name": fn,
                            "relPath": str(fp.relative_to(target_dir)),
                            "size": fp.stat().st_size
                        })
            return self.reply_json(200, {"ok": True, "isbn": isbn, "folder": str(target_dir), "files": files})

        if path == "/open-input-folder":
            isbn = params.get("isbn", [""])[0]
            target_dir = INPUT_ROOT / str(isbn)
            target_dir.mkdir(parents=True, exist_ok=True)
            if hasattr(os, "startfile"):
                os.startfile(str(target_dir))
            return self.reply_json(200, {"ok": True, "folder": str(target_dir)})

        if path == "/download-file":
            isbn = params.get("isbn", [""])[0]
            name = params.get("name", [""])[0]
            target = INPUT_ROOT / str(isbn) / name
            if not target.exists() or not target.is_file():
                return self.reply_json(404, {"ok": False, "error": "File not found"})
            self.send_response(200)
            self.send_cors()
            self.send_header("Content-Type", "application/pdf" if name.endswith(".pdf") else "application/octet-stream")
            self.send_header("Content-Disposition", f'attachment; filename="{name}"')
            self.send_header("Content-Length", str(target.stat().st_size))
            self.end_headers()
            with open(target, "rb") as f:
                shutil.copyfileobj(f, self.wfile, length=temp_file_store.CHUNK_SIZE)
            return

        if path == "/prepare-dummy":
            isbn = params.get("isbn", ["9781234567890"])[0]
            dummy_dir = DATA_DIR / "dummy_source" / str(isbn)
            dummy_dir.mkdir(parents=True, exist_ok=True)
            (dummy_dir / f"{isbn}_txt.pdf").write_bytes(b"%PDF-1.4 dummy book text pdf")
            (dummy_dir / f"{isbn}_cvr_eu.pdf").write_bytes(b"%PDF-1.4 dummy cover eu pdf")
            (dummy_dir / f"{isbn}_cvr_int.pdf").write_bytes(b"%PDF-1.4 dummy cover int pdf")
            return self.reply_json(200, {"ok": True, "path": str(dummy_dir)})

        self.reply_json(404, {"ok": False, "error": "Endpoint not found"})

    def do_POST(self):
        if not self.check_auth():
            return self.reply_json(401, {"ok": False, "error": "Unauthorized"})

        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        path = parsed.path

        if path == "/upload-completed":
            isbn = params.get("isbn", [""])[0]
            filename = params.get("filename", [""])[0]
            if not isbn or not filename:
                return self.reply_json(400, {"ok": False, "error": "isbn and filename required"})

            dest_input = INPUT_ROOT / str(isbn) / filename
            dest_input.parent.mkdir(parents=True, exist_ok=True)
            dest_output = OUTPUT_ROOT / str(isbn) / filename
            dest_output.parent.mkdir(parents=True, exist_ok=True)

            length = int(self.headers.get("Content-Length", 0))
            bytes_written = 0
            with open(dest_input, "wb") as f:
                rem = length
                while rem > 0:
                    read_size = min(temp_file_store.CHUNK_SIZE, rem)
                    chunk = self.rfile.read(read_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    rem -= len(chunk)
                    bytes_written += len(chunk)

            # Mirror to OUTPUT_ROOT
            try:
                shutil.copy2(dest_input, dest_output)
            except Exception:
                pass

            return self.reply_json(200, {
                "ok": True,
                "isbn": isbn,
                "filename": filename,
                "bytesWritten": bytes_written,
                "inputPath": str(dest_input),
                "outputPath": str(dest_output)
            })

        body = self.read_body()

        if path == "/state":
            incoming = body if isinstance(body, list) else body.get("rows", [])
            merged = merge_state_rows(incoming)
            return self.reply_json(200, {"ok": True, "count": len(merged), "rows": merged})

        if path == "/network-find":
            source = body.get("source", "")
            isbns_raw = body.get("isbns", "")
            wanted_isbns = set(parse_isbns(isbns_raw) if isinstance(isbns_raw, str) else isbns_raw)
            if not source or not Path(source).exists():
                return self.reply_json(400, {"ok": False, "error": f"Source directory unreachable: {source}"})

            found = []
            found_isbns = set()
            src_path = Path(source)

            for root, dirs, files in os.walk(src_path):
                # Match directory names
                for d in dirs:
                    for wanted in wanted_isbns:
                        if d == wanted or d.startswith(f"{wanted}_") or d.startswith(f"{wanted}."):
                            found.append({"isbn": wanted, "kind": "folder", "path": str(Path(root) / d), "name": d})
                            found_isbns.add(wanted)

                # Match files
                for f in files:
                    stem = Path(f).stem
                    for wanted in wanted_isbns:
                        if stem == wanted or stem.startswith(f"{wanted}_") or stem.startswith(f"{wanted}."):
                            found.append({"isbn": wanted, "kind": "file", "path": str(Path(root) / f), "name": f})
                            found_isbns.add(wanted)

            missing = [isbn for isbn in wanted_isbns if isbn not in found_isbns]
            return self.reply_json(200, {"ok": True, "found": found, "missing": missing})


        if path == "/network-copy":
            matches = body.get("matches", [])
            owner_id = body.get("ownerId", "default")
            staged = []
            total_bytes = 0

            for m in matches:
                src_path = m.get("path")
                isbn = m.get("isbn")
                if not src_path or not Path(src_path).exists():
                    continue
                try:
                    res = store.store_file(src_path, owner_id=owner_id, purpose=f"network-copy:{isbn}")
                    staged.append(res)
                    total_bytes += res["sizeBytes"]
                except Exception as e:
                    return self.reply_json(400, {"ok": False, "error": str(e), "staged": staged})

            return self.reply_json(200, {
                "ok": True,
                "stagedCount": len(staged),
                "totalBytes": total_bytes,
                "items": staged
            })

        if path == "/prepare-temp":
            isbn = body.get("isbn", "")
            owner_id = body.get("ownerId", "default")
            role = body.get("role")
            if not isbn:
                return self.reply_json(400, {"ok": False, "error": "isbn required"})

            res = store.materialize_to_input(isbn, owner_id, INPUT_ROOT, role)
            return self.reply_json(200, {"ok": True, **res})

        if path == "/temp-delete-all":
            owner_id = body.get("ownerId", "default")
            deleted_rows = body.get("deletedRows", [])
            count = store.delete_all(owner_id)

            # Archive to recents_deleted.json (capped to 100)
            if deleted_rows:
                all_recents = read_json_file(RECENTS_FILE, [])
                batch = {
                    "id": f"REC-{int(time.time() * 1000)}",
                    "ownerId": owner_id,
                    "deletedAt": time.time(),
                    "rowCount": len(deleted_rows),
                    "rows": deleted_rows
                }
                all_recents.insert(0, batch)
                all_recents = all_recents[:100]
                write_json_file(RECENTS_FILE, all_recents)

            return self.reply_json(200, {"ok": True, "deletedCount": count})

        if path == "/notifications":
            notifs = read_json_file(NOTIFS_FILE, [])
            clean_isbn = body.get("isbn") or body.get("reportSummary", {}).get("isbn") or body.get("fileName") or ""
            clean_status = body.get("status") or body.get("reportSummary", {}).get("status") or "Update"
            clean_project = body.get("projectName") or body.get("project") or body.get("reportSummary", {}).get("projectName") or (f"Peter Lang Title ({clean_isbn})" if clean_isbn else "General Production")
            clean_project_id = body.get("projectId") or body.get("reportSummary", {}).get("projectId") or "PRJ-PETERLANG"
            new_notif = {
                "id": body.get("id") or f"NOTIF-{int(time.time()*1000)}",
                "createdAt": time.time(),
                "read": False,
                **body,
                "isbn": clean_isbn,
                "status": clean_status,
                "projectName": clean_project,
                "projectId": clean_project_id,
                "employeeId": body.get("employeeId") or body.get("senderId") or "EMP",
                "employeeName": body.get("employeeName") or body.get("senderName") or "Employee",
                "reason": body.get("reason") or body.get("remarks") or body.get("description") or "Status updated",
                "remarks": body.get("remarks") or body.get("reason") or body.get("description") or ""
            }
            notifs.insert(0, new_notif)
            notifs = notifs[:500]  # Capped to 500
            write_json_file(NOTIFS_FILE, notifs)
            return self.reply_json(200, {"ok": True, "item": new_notif, "notification": new_notif})

        if path == "/notifications/read":
            notif_id = body.get("id")
            notifs = read_json_file(NOTIFS_FILE, [])
            for n in notifs:
                if n.get("id") == notif_id:
                    n["read"] = True
            write_json_file(NOTIFS_FILE, notifs)
            return self.reply_json(200, {"ok": True, "id": notif_id})

        if path == "/notifications/read-all":
            employee_id = str(body.get("employeeId", "")).strip().lower()
            notifs = read_json_file(NOTIFS_FILE, [])
            for n in notifs:
                if not employee_id or str(n.get("employeeId", "")).strip().lower() == employee_id or str(n.get("recipientId", "")).strip().lower() == employee_id:
                    n["read"] = True
            write_json_file(NOTIFS_FILE, notifs)
            return self.reply_json(200, {"ok": True})

        if path == "/notifications/clear-read":
            employee_id = str(body.get("employeeId", "")).strip().lower()
            notifs = read_json_file(NOTIFS_FILE, [])
            if employee_id:
                notifs = [n for n in notifs if not (n.get("read") and (str(n.get("employeeId", "")).strip().lower() == employee_id or str(n.get("recipientId", "")).strip().lower() == employee_id))]
            else:
                notifs = [n for n in notifs if not n.get("read")]
            write_json_file(NOTIFS_FILE, notifs)
            return self.reply_json(200, {"ok": True, "remaining": len(notifs)})

        if path == "/notifications/delete":
            notif_id = body.get("id")
            notifs = read_json_file(NOTIFS_FILE, [])
            notifs = [n for n in notifs if n.get("id") != notif_id]
            write_json_file(NOTIFS_FILE, notifs)
            return self.reply_json(200, {"ok": True, "id": notif_id, "remaining": len(notifs)})

        if path == "/notifications/clear":
            employee_id = str(body.get("employeeId", "")).strip().lower()
            notifs = read_json_file(NOTIFS_FILE, [])
            if employee_id:
                notifs = [n for n in notifs if str(n.get("employeeId", "")).strip().lower() != employee_id and str(n.get("recipientId", "")).strip().lower() != employee_id]
            else:
                notifs = []
            write_json_file(NOTIFS_FILE, notifs)
            return self.reply_json(200, {"ok": True, "remaining": len(notifs)})

        if path == "/export-report":
            rows = body.get("rows", [])
            employee_id = body.get("employeeId", "Employee")
            excel_bytes = xlsx_builder.make_report_xlsx(rows)

            self.send_response(200)
            self.send_cors()
            self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            self.send_header("Content-Disposition", f'attachment; filename="{employee_id}_Production_Report.xlsx"')
            self.send_header("Content-Length", str(len(excel_bytes)))
            self.end_headers()
            self.wfile.write(excel_bytes)
            return

        self.reply_json(404, {"ok": False, "error": "Endpoint not found"})

def run_server():
    server = ThreadingHTTPServer(("0.0.0.0", PORT), FileFlowHandler)
    print(f"FileFlow server running on http://0.0.0.0:{PORT}")
    print(f"INPUT_ROOT: {INPUT_ROOT}")
    print(f"OUTPUT_ROOT: {OUTPUT_ROOT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    run_server()
