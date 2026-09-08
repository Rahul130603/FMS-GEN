import os
import json
import time
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from backend.database import (
    SessionLocal, init_db, User, Employee, Allocation, InternalMail, Client
)
from backend.auth import hash_password, legacy_sha256_hash

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
ATTENDANCE_FILE = Path(os.environ.get("FILEFLOW_ATTENDANCE_PATH", r"C:\Users\Admin\Downloads\Gentize Attendance.xlsx"))
EDITS_FILE = DATA_DIR / "employee-edits.json"
PASSWORDS_FILE = DATA_DIR / "employee-passwords.json"
ALLOCATIONS_FILE = DATA_DIR / "admin-allocations.json"
MAIL_FILE = DATA_DIR / "internal-mail.json"

def read_json_file(file_path, default=None):
    if default is None:
        default = {}
    try:
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return default

def is_disallowed_isbn(isbn):
    if not isbn:
        return True
    s = str(isbn).strip()
    return "978-1-234567" in s or s.startswith("978-1-234567")

def read_attendance_employees():
    if not ATTENDANCE_FILE.exists():
        print(f"Attendance file not found at {ATTENDANCE_FILE}")
        return []

    try:
        with zipfile.ZipFile(ATTENDANCE_FILE) as z:
            shared = []
            if "xl/sharedStrings.xml" in z.namelist():
                root = ET.fromstring(z.read("xl/sharedStrings.xml"))
                ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                shared = ["".join(t.text or "" for t in item.iter("{%s}t" % ns["m"])) for item in root]

            sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
            ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            rows = []
            for r in sheet.findall(".//m:sheetData/m:row", ns):
                cells_dict = {}
                for c in r.findall("m:c", ns):
                    ref = c.attrib.get("r", "A1")
                    # Extract column letters
                    letters = "".join([ch for ch in ref if ch.isalpha()])
                    col_idx = 0
                    for ch in letters:
                        col_idx = col_idx * 26 + ord(ch) - 64
                    col_idx -= 1

                    k = c.attrib.get("t")
                    v = c.find("m:v", ns)
                    val = "" if v is None else (v.text or "")
                    if k == "s" and val:
                        try:
                            val = shared[int(val)]
                        except Exception:
                            pass
                    cells_dict[col_idx] = val

                width = max(cells_dict.keys()) + 1 if cells_dict else 0
                row_arr = [cells_dict.get(i, "") for i in range(width)]
                rows.append(row_arr)

        if not rows:
            return []

        base = []
        for row in rows[1:]:
            # Column 2 is employee name
            name = row[2] if len(row) > 2 else ""
            if not str(name).strip():
                continue

            def get_col(idx):
                return str(row[idx]).strip() if len(row) > idx else ""

            emp = {
                "empId": get_col(0),
                "giEmpId": get_col(1),
                "name": get_col(2),
                "address": get_col(3),
                "permanentAddress": get_col(4),
                "phone": get_col(5),
                "personalEmail": get_col(6),
                "officeEmail": get_col(7),
                "designation": get_col(8),
                "panCard": get_col(9),
                "aadhaarNumber": get_col(10),
                "emergencyContact": get_col(11),
                "bloodGroup": get_col(12),
                "dob": get_col(13),
                "doj": get_col(14),
                "qualification": get_col(19),
                "experience": get_col(20),
                "gender": get_col(21),
                "deviceNumber": get_col(23),
                "mainDoorAccess": get_col(24) or "No",
                "leftDoorAccess": get_col(25) or "No",
                "department": "Production"
            }
            base.append(emp)

        edits = read_json_file(EDITS_FILE, {"upserts": {}, "deleted": []})
        deleted = set(edits.get("deleted", []))
        upserts = edits.get("upserts", {})

        merged = []
        for x in base:
            if x["empId"] in deleted:
                continue
            ov = upserts.get(x["empId"], {})
            merged.append({**x, **ov})

        existing_ids = set(x["empId"] for x in merged)
        for emp_id, data in upserts.items():
            if emp_id and emp_id not in existing_ids and emp_id not in deleted:
                merged.append(data)

        return merged
    except Exception as e:
        print(f"Error parsing attendance workbook: {e}")
        return []

def seed_database():
    init_db()
    db = SessionLocal()

    try:
        # 1. Seed Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                id="admin",
                username="admin",
                password_hash=hash_password("Admin@123"),
                name="Administrator",
                role="Admin",
                designation="System Administrator",
                department="Administration",
                email="admin@fileflow.internal",
                emp_id="ADMIN",
                gi_emp_id="ADMIN",
                is_active=True
            )
            db.add(admin_user)
            print("Created Admin user account.")

        # 2. Seed Employees from Excel
        passwords = read_json_file(PASSWORDS_FILE, {})
        employees = read_attendance_employees()
        print(f"Read {len(employees)} real employees from Employee Master.")

        for emp_data in employees:
            emp_id = str(emp_data.get("empId", "")).strip()
            if not emp_id:
                continue

            existing_emp = db.query(Employee).filter(Employee.emp_id == emp_id).first()
            if not existing_emp:
                new_emp = Employee(
                    emp_id=emp_id,
                    gi_emp_id=emp_data.get("giEmpId", ""),
                    name=emp_data.get("name", ""),
                    designation=emp_data.get("designation", "DEVELOPER"),
                    department=emp_data.get("department", "Production"),
                    office_email=emp_data.get("officeEmail", ""),
                    personal_email=emp_data.get("personalEmail", ""),
                    phone=emp_data.get("phone", ""),
                    address=emp_data.get("address", ""),
                    permanent_address=emp_data.get("permanentAddress", ""),
                    pan_card=emp_data.get("panCard", ""),
                    aadhaar_number=emp_data.get("aadhaarNumber", ""),
                    emergency_contact=emp_data.get("emergencyContact", ""),
                    blood_group=emp_data.get("bloodGroup", ""),
                    dob=emp_data.get("dob", ""),
                    doj=emp_data.get("doj", ""),
                    qualification=emp_data.get("qualification", ""),
                    experience=emp_data.get("experience", ""),
                    gender=emp_data.get("gender", ""),
                    device_number=emp_data.get("deviceNumber", ""),
                    main_door_access=emp_data.get("mainDoorAccess", "No"),
                    left_door_access=emp_data.get("leftDoorAccess", "No"),
                    status=emp_data.get("status", "Active")
                )
                db.add(new_emp)

            # Create / sync User account for employee
            user_account = db.query(User).filter(User.username == emp_id).first()
            if not user_account:
                # Determine role based on designation
                desig = (emp_data.get("designation") or "").upper()
                if "ADMIN" in desig:
                    role = "Project Admin"
                elif "QC" in desig:
                    role = "QC"
                elif "QAG" in desig:
                    role = "QAG"
                elif "GRAPHIC" in desig or "COVER" in desig:
                    role = "Cover Developer"
                else:
                    role = "Employee"

                # Check if custom password exists
                raw_hash = passwords.get(emp_id)
                if not raw_hash:
                    default_pw = f"FF@{emp_id}"
                    stored_hash = hash_password(default_pw)
                else:
                    stored_hash = raw_hash

                user_account = User(
                    id=emp_id,
                    username=emp_id,
                    password_hash=stored_hash,
                    name=emp_data.get("name", ""),
                    role=role,
                    designation=emp_data.get("designation", "DEVELOPER"),
                    department=emp_data.get("department", "Production"),
                    email=emp_data.get("officeEmail") or emp_data.get("personalEmail") or "",
                    emp_id=emp_id,
                    gi_emp_id=emp_data.get("giEmpId", ""),
                    is_active=True
                )
                db.add(user_account)

        # 3. Seed Clients
        client_count = db.query(Client).count()
        if False and client_count == 0:
            pl_client = Client(
                id="CLI-PETERLANG",
                code="PL",
                name="Peter Lang Publishing Group",
                subtitle="International Academic & Scientific Publishers · Established 1970",
                location="Bern, Switzerland / International",
                industry="Academic & Scientific Publishing",
                titles_count="200+ Books & Journals",
                stages_count="10 Production Stages",
                email="editorial@peterlang.com",
                contact_person="Dr. Hans Meyer (Publishing Director)",
                status="Active Enterprise Partner",
                master_file_name="PeterLang_Master_Batch_2026.xlsx",
                master_file_size="4.8 MB",
                uploaded_date="01 Sep 2026"
            )
            db.add(pl_client)

        # 4. Import Real Allocations from data/admin-allocations.json
        existing_allocations = []
        alloc_added = 0
        for item in existing_allocations:
            isbn = str(item.get("isbn", "")).strip()
            if not isbn or is_disallowed_isbn(isbn):
                continue
            item_id = item.get("id") or f"ALC-{int(time.time() * 1000)}-{isbn}"
            exists = db.query(Allocation).filter(Allocation.id == item_id).first()
            if not exists:
                alt_ids = item.get("employeeAltIds", [])
                alt_ids_str = json.dumps(alt_ids) if isinstance(alt_ids, list) else "[]"
                status = item.get("status", "Allocated")
                completed_num = 1 if status in ("Complete", "Finished", "Completed") else int(item.get("completed", 0) or 0)
                rejected_num = 1 if status in ("Reject", "Rejected", "Rework") else int(item.get("rejected", 0) or 0)
                hold_num = 1 if status == "Hold" else int(item.get("hold", 0) or 0)

                alloc = Allocation(
                    id=item_id,
                    isbn=isbn,
                    employee=item.get("employee", ""),
                    employee_id=str(item.get("employeeId") or item.get("employeeCode") or "").strip(),
                    employee_code=str(item.get("employeeCode", "")).strip(),
                    employee_alt_ids=alt_ids_str,
                    team=item.get("team", ""),
                    department=item.get("department", "Production"),
                    work_type=str(item.get("workType", item.get("role", "book"))).lower(),
                    role=item.get("role", "DEVELOPER"),
                    status=status,
                    completed=completed_num,
                    rejected=rejected_num,
                    hold=hold_num,
                    status_reason=item.get("statusReason", ""),
                    allocated=int(item.get("allocated", 1) or 1),
                    allocated_at=float(item.get("allocatedAt", 0.0) or 0.0),
                    started=float(item.get("started", 0.0) or 0.0),
                    ended=float(item.get("ended", 0.0) or 0.0),
                    trim_size=item.get("trimSize", ""),
                    page_count=item.get("pageCount", ""),
                    specs_entered_by=item.get("specsEnteredBy", ""),
                    uploaded=item.get("uploaded", ""),
                    saved_path=item.get("savedPath", ""),
                    download_saved_path=item.get("downloadSavedPath", ""),
                    project_id=item.get("projectId", "PRJ-PETERLANG"),
                    project_name=item.get("projectName", f"Peter Lang Title ({isbn})"),
                    project=item.get("project", ""),
                    chapter=item.get("chapter", "Full Title"),
                    priority=item.get("priority", "Normal"),
                    due_date=item.get("dueDate", ""),
                    due=item.get("due", ""),
                    date=item.get("date", ""),
                    allocation_mode=item.get("allocationMode", "Category Allocation"),
                    workflow_stage=item.get("workflowStage", "Based on Employee Role"),
                    batch_id=item.get("batchId", ""),
                    batch_file=item.get("batchFile", ""),
                    notify_employee=bool(item.get("notifyEmployee", True)),
                    posted_by=item.get("postedBy", "Administrator"),
                    posted_to=item.get("postedTo", ""),
                    remark=item.get("remark", ""),
                    status_updated_at=float(item.get("statusUpdatedAt", 0.0) or 0.0)
                )
                db.add(alloc)
                alloc_added += 1

        print(f"Imported {alloc_added} verified allocations into database.")

        # 5. Import Real Internal Mail from data/internal-mail.json
        existing_mails = []
        mail_added = 0
        for m in existing_mails:
            mail_id = m.get("id")
            if not mail_id:
                continue
            exists = db.query(InternalMail).filter(InternalMail.id == mail_id).first()
            if not exists:
                new_mail = InternalMail(
                    id=mail_id,
                    sender=m.get("sender", ""),
                    sender_email=m.get("senderEmail", ""),
                    from_id=m.get("fromId", ""),
                    from_name=m.get("fromName", ""),
                    from_role=m.get("fromRole", ""),
                    to_id=m.get("toId", ""),
                    to_name=m.get("toName", ""),
                    to_role=m.get("toRole", ""),
                    to_alternate_ids=json.dumps(m.get("toAlternateIds", [])),
                    assignee=m.get("assignee", ""),
                    assignee_id=m.get("assigneeId", ""),
                    subject=m.get("subject", ""),
                    title=m.get("title", ""),
                    project=m.get("project", ""),
                    isbn=m.get("isbn", ""),
                    chapter=m.get("chapter", ""),
                    category=m.get("category", "General"),
                    priority=m.get("priority", "Normal"),
                    folder=m.get("folder", "Inbox"),
                    status=m.get("status", "Inbox"),
                    body=m.get("body", ""),
                    attachments=json.dumps(m.get("attachments", [])),
                    timeline=json.dumps(m.get("timeline", [])),
                    notes=json.dumps(m.get("notes", [])),
                    draft=bool(m.get("draft", False)),
                    resolved=bool(m.get("resolved", False)),
                    starred=bool(m.get("starred", False)),
                    read_by=json.dumps(m.get("readBy", [])),
                    deleted_by=json.dumps(m.get("deletedBy", [])),
                    created_at=float(m.get("createdAt", time.time() * 1000))
                )
                db.add(new_mail)
                mail_added += 1

        print(f"Imported {mail_added} internal mails into database.")

        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Seeding error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
