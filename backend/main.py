import os
import sys
import json
import time
import shutil
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc

from backend.database import (
    get_db, init_db, SessionLocal,
    User, Employee, Allocation, AllocationHistory, Notification,
    InternalMail, MailCorrection, CustomerQuery, ProjectSpecification,
    ProjectInstruction, Project, Client, Feedback, QAGReport
)
from backend.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_current_user
)
from backend.seed import seed_database
import backend.excel_service as excel_service
import temp_file_store
import xlsx_builder

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DIST_DIR = BASE_DIR / "dist"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Filesystem roots for NAS/local storage
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

store = temp_file_store.TempFileStore(
    db_path=str(DATA_DIR / "fileflow_temp_files.sqlite3"),
    store_dir=str(BASE_DIR / "temp_file_store")
)
RECENTS_FILE = DATA_DIR / "recents_deleted.json"
STATE_FILE = DATA_DIR / "fileflow_state.json"

app = FastAPI(
    title="FileFlow Central Server",
    description="FileFlow Multi-User Company Platform API",
    version="2.0.0"
)

# CORS Middleware configured for company LAN
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Same-origin is preferred; allow all LAN origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup database initialization error: {e}")

# Helper to read/write JSON files
def read_json(path, default=None):
    if default is None:
        default = []
    try:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return default

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(path)

# ==========================================
# 1. Health & Status Endpoints
# ==========================================

@app.get("/api/health")
@app.get("/health")
def get_health(db: Session = Depends(get_db)):
    try:
        db.execute(func.now()) if hasattr(func, "now") else None
        db_status = "connected"
    except Exception:
        db_status = "error"

    return {
        "status": "ok",
        "database": db_status,
        "server": "FileFlow",
        "inputRoot": str(INPUT_ROOT),
        "outputRoot": str(OUTPUT_ROOT),
        "serverTime": time.time()
    }

# ==========================================
# 2. Authentication Endpoints
# ==========================================

class LoginRequest(BaseModel):
    employeeId: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    emp_id = req.employeeId.strip()
    if not emp_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")

    # Check Admin account
    if emp_id.lower() == "admin":
        user = db.query(User).filter(User.username == "admin").first()
        if user and (req.password == "Admin@123" or verify_password(req.password, user.password_hash)):
            token = create_access_token({"sub": "admin", "role": "Admin"})
            return {"ok": True, "token": token, "user": user.to_dict()}
        raise HTTPException(status_code=401, detail="Incorrect employee ID or password")

    # Check Employee accounts (match username, emp_id, or gi_emp_id)
    user = db.query(User).filter(
        or_(
            func.lower(User.username) == emp_id.lower(),
            func.lower(User.emp_id) == emp_id.lower(),
            func.lower(User.gi_emp_id) == emp_id.lower()
        )
    ).first()

    if not user:
        # Check if employee exists in Employee table
        employee = db.query(Employee).filter(
            or_(
                func.lower(Employee.emp_id) == emp_id.lower(),
                func.lower(Employee.gi_emp_id) == emp_id.lower()
            )
        ).first()
        if not employee:
            raise HTTPException(status_code=401, detail="Incorrect employee ID or password")

        # Auto-create user for employee
        user = User(
            id=employee.emp_id,
            username=employee.emp_id,
            password_hash=hash_password(f"FF@{employee.emp_id}"),
            name=employee.name,
            role="Employee",
            designation=employee.designation,
            department=employee.department,
            email=employee.office_email or employee.personal_email or "",
            emp_id=employee.emp_id,
            gi_emp_id=employee.gi_emp_id,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Verify password (checks bcrypt, legacy sha256, and default FF@ID)
    is_valid = verify_password(req.password, user.password_hash, user.emp_id)
    if not is_valid:
        default_pw = f"FF@{user.emp_id}"
        if req.password == default_pw:
            user.password_hash = hash_password(default_pw)
            db.commit()
            is_valid = True

    if not is_valid:
        raise HTTPException(status_code=401, detail="Incorrect employee ID or password")

    token = create_access_token({"sub": user.username, "role": user.role})
    return {"ok": True, "token": token, "user": user.to_dict()}

class PasswordChangeRequest(BaseModel):
    employeeId: str
    currentPassword: str
    newPassword: str

@app.post("/api/auth/password")
def change_password(req: PasswordChangeRequest, db: Session = Depends(get_db)):
    if not req.newPassword or len(req.newPassword) < 8:
        raise HTTPException(status_code=400, detail="New password must contain at least 8 characters")

    user = db.query(User).filter(
        or_(
            func.lower(User.username) == req.employeeId.lower().strip(),
            func.lower(User.emp_id) == req.employeeId.lower().strip()
        )
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Employee user account not found")

    if not verify_password(req.currentPassword, user.password_hash, user.emp_id):
        if req.currentPassword != f"FF@{user.emp_id}":
            raise HTTPException(status_code=401, detail="Current password is incorrect")

    user.password_hash = hash_password(req.newPassword)
    db.commit()
    return {"ok": True}

# ==========================================
# 3. Employee Master Endpoints
# ==========================================

@app.get("/api/employees")
def get_employees(active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Employee)
    if active_only:
        query = query.filter(Employee.status == "Active")
    employees = query.order_by(Employee.name).all()
    items = [e.to_dict() for e in employees]
    return {"ok": True, "source": "Central Database / Employee Master", "count": len(items), "items": items}

@app.post("/api/employees")
def save_employee(data: dict, db: Session = Depends(get_db)):
    emp_id = str(data.get("empId", "")).strip()
    name = str(data.get("name", "")).strip()
    if not emp_id or not name:
        raise HTTPException(status_code=400, detail="Employee ID and name are required")

    orig_id = str(data.get("originalEmpId", "")).strip()
    if orig_id and orig_id != emp_id:
        # Delete old record if ID changed
        old = db.query(Employee).filter(Employee.emp_id == orig_id).first()
        if old:
            db.delete(old)

    emp = db.query(Employee).filter(Employee.emp_id == emp_id).first()
    if not emp:
        emp = Employee(emp_id=emp_id)
        db.add(emp)

    emp.gi_emp_id = data.get("giEmpId", emp.gi_emp_id or "")
    emp.name = name
    emp.designation = data.get("designation", emp.designation or "")
    emp.department = data.get("department", emp.department or "Production")
    emp.office_email = data.get("officeEmail", emp.office_email or "")
    emp.personal_email = data.get("personalEmail", emp.personal_email or "")
    emp.phone = data.get("phone", emp.phone or "")
    emp.address = data.get("address", emp.address or "")
    emp.permanent_address = data.get("permanentAddress", emp.permanent_address or "")
    emp.pan_card = data.get("panCard", emp.pan_card or "")
    emp.aadhaar_number = data.get("aadhaarNumber", emp.aadhaar_number or "")
    emp.emergency_contact = data.get("emergencyContact", emp.emergency_contact or "")
    emp.blood_group = data.get("bloodGroup", emp.blood_group or "")
    emp.dob = data.get("dob", emp.dob or "")
    emp.doj = data.get("doj", emp.doj or "")
    emp.qualification = data.get("qualification", emp.qualification or "")
    emp.experience = data.get("experience", emp.experience or "")
    emp.gender = data.get("gender", emp.gender or "")
    emp.device_number = data.get("deviceNumber", emp.device_number or "")
    emp.main_door_access = data.get("mainDoorAccess", emp.main_door_access or "No")
    emp.left_door_access = data.get("leftDoorAccess", emp.left_door_access or "No")
    emp.status = data.get("status", emp.status or "Active")

    # Update or create user account
    user = db.query(User).filter(User.username == emp_id).first()
    if not user:
        user = User(
            id=emp_id,
            username=emp_id,
            password_hash=hash_password(f"FF@{emp_id}"),
            name=name,
            role="Employee",
            designation=emp.designation,
            department=emp.department,
            email=emp.office_email or emp.personal_email or "",
            emp_id=emp_id,
            gi_emp_id=emp.gi_emp_id,
            is_active=True
        )
        db.add(user)
    else:
        user.name = name
        user.designation = emp.designation
        user.department = emp.department
        user.email = emp.office_email or emp.personal_email or ""
        user.gi_emp_id = emp.gi_emp_id

    db.commit()
    db.refresh(emp)
    return {"ok": True, "item": emp.to_dict()}

@app.post("/api/employees/delete")
def delete_employee(payload: dict, db: Session = Depends(get_db)):
    emp_id = str(payload.get("empId", "")).strip()
    if not emp_id:
        raise HTTPException(status_code=400, detail="Employee ID required")

    emp = db.query(Employee).filter(Employee.emp_id == emp_id).first()
    if emp:
        emp.status = "Inactive"
        user = db.query(User).filter(User.username == emp_id).first()
        if user:
            user.is_active = False
        db.commit()
    return {"ok": True}

# ==========================================
# 4. Allocations Endpoints
# ==========================================

@app.get("/api/allocations")
def get_allocations(
    employee: Optional[str] = None,
    name: Optional[str] = None,
    aliases: Optional[str] = None,
    status: Optional[str] = None,
    isbn: Optional[str] = None,
    batch_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Allocation)

    if isbn:
        query = query.filter(Allocation.isbn == isbn.strip())
    if status:
        query = query.filter(func.lower(Allocation.status) == status.strip().lower())
    if batch_id:
        query = query.filter(Allocation.batch_id == batch_id.strip())

    if employee or name or aliases:
        targets = set()
        if employee: targets.add(employee.strip().lower())
        if name: targets.add(name.strip().lower())
        if aliases:
            for a in aliases.split(","):
                if a.strip(): targets.add(a.strip().lower())

        conditions = []
        for t in targets:
            conditions.append(func.lower(Allocation.employee) == t)
            conditions.append(func.lower(Allocation.employee_id) == t)
            conditions.append(func.lower(Allocation.employee_code) == t)
            conditions.append(Allocation.employee_alt_ids.like(f'%"{t}"%'))
            conditions.append(func.lower(Allocation.posted_to) == t)

        query = query.filter(or_(*conditions))

    items = query.order_by(desc(Allocation.created_at)).all()
    return {"ok": True, "count": len(items), "items": [i.to_dict() for i in items]}

@app.get("/api/allocations/employee/{employee_id}")
def get_employee_allocations(employee_id: str, db: Session = Depends(get_db)):
    t = employee_id.strip().lower()
    items = db.query(Allocation).filter(
        or_(
            func.lower(Allocation.employee_id) == t,
            func.lower(Allocation.employee_code) == t,
            func.lower(Allocation.employee) == t,
            Allocation.employee_alt_ids.like(f'%"{t}"%'),
            func.lower(Allocation.posted_to) == t
        )
    ).order_by(desc(Allocation.created_at)).all()
    return {"ok": True, "count": len(items), "items": [i.to_dict() for i in items]}

@app.post("/api/allocations")
def create_allocation(item: dict, db: Session = Depends(get_db)):
    isbn = str(item.get("isbn", "")).strip()
    if not isbn:
        raise HTTPException(status_code=400, detail="ISBN is required")

    alloc_id = item.get("id") or f"ALC-{int(time.time() * 1000)}-{isbn}"
    alloc = db.query(Allocation).filter(Allocation.id == alloc_id).first()
    if not alloc:
        alloc = Allocation(id=alloc_id, isbn=isbn)
        db.add(alloc)

    alt_ids = item.get("employeeAltIds", [])
    alloc.employee = item.get("employee", alloc.employee or "")
    alloc.employee_id = str(item.get("employeeId") or item.get("employeeCode") or alloc.employee_id or "").strip()
    alloc.employee_code = str(item.get("employeeCode", alloc.employee_code or "")).strip()
    alloc.employee_alt_ids = json.dumps(alt_ids) if isinstance(alt_ids, list) else "[]"
    alloc.team = item.get("team", alloc.team or "")
    alloc.department = item.get("department", alloc.department or "Production")
    alloc.work_type = str(item.get("workType", item.get("role", alloc.work_type or "book"))).lower()
    alloc.role = item.get("role", alloc.role or "DEVELOPER")
    alloc.status = item.get("status", alloc.status or "Allocated")
    alloc.allocated = int(item.get("allocated", 1) or 1)
    alloc.completed = 1 if alloc.status in ("Complete", "Finished", "Completed") else int(item.get("completed", 0) or 0)
    alloc.rejected = 1 if alloc.status in ("Reject", "Rejected", "Rework") else int(item.get("rejected", 0) or 0)
    alloc.hold = 1 if alloc.status == "Hold" else int(item.get("hold", 0) or 0)
    alloc.priority = item.get("priority", alloc.priority or "Normal")
    alloc.due_date = item.get("dueDate", alloc.due_date or "")
    alloc.due = item.get("due", alloc.due or alloc.due_date)
    alloc.project_id = item.get("projectId", alloc.project_id or "PRJ-PETERLANG")
    alloc.project_name = item.get("projectName", alloc.project_name or f"Peter Lang Title ({isbn})")
    alloc.chapter = item.get("chapter", alloc.chapter or "Full Title")
    alloc.posted_by = item.get("postedBy", alloc.posted_by or "Administrator")
    alloc.posted_to = item.get("postedTo", alloc.employee or "")
    alloc.remark = item.get("remark", alloc.remark or "")

    db.commit()
    db.refresh(alloc)
    return {"ok": True, "item": alloc.to_dict()}

@app.post("/api/allocations/batch")
def batch_allocate(payload: dict, db: Session = Depends(get_db)):
    incoming = payload.get("items", [])
    if not incoming:
        raise HTTPException(status_code=400, detail="No allocations supplied")

    saved_items = []
    batch_id = payload.get("batchId") or (incoming[0].get("batchId") if incoming else f"BATCH-{int(time.time() * 1000)}")
    date_str = datetime.utcnow().strftime("%d %b %Y, %I:%M %p")

    for item in incoming:
        isbn = str(item.get("isbn", "")).strip()
        if not isbn:
            continue
        alloc_id = item.get("id") or f"ALC-{int(time.time() * 1000)}-{isbn}"
        alloc = db.query(Allocation).filter(Allocation.id == alloc_id).first()
        if not alloc:
            alloc = Allocation(id=alloc_id, isbn=isbn)
            db.add(alloc)

        alt_ids = item.get("employeeAltIds", [])
        alloc.employee = item.get("employee", "")
        alloc.employee_id = str(item.get("employeeId") or item.get("employeeCode") or "").strip()
        alloc.employee_code = str(item.get("employeeCode", "")).strip()
        alloc.employee_alt_ids = json.dumps(alt_ids) if isinstance(alt_ids, list) else "[]"
        alloc.team = item.get("team", "")
        alloc.department = item.get("department", "Production")
        alloc.work_type = str(item.get("workType", item.get("role", "book"))).lower()
        alloc.role = item.get("role", "DEVELOPER")
        alloc.status = item.get("status", "Allocated")
        alloc.allocated = int(item.get("allocated", 1) or 1)
        alloc.completed = 1 if alloc.status in ("Complete", "Finished", "Completed") else int(item.get("completed", 0) or 0)
        alloc.rejected = 1 if alloc.status in ("Reject", "Rejected", "Rework") else int(item.get("rejected", 0) or 0)
        alloc.hold = 1 if alloc.status == "Hold" else int(item.get("hold", 0) or 0)
        alloc.priority = item.get("priority", "Normal")
        alloc.due_date = item.get("dueDate", "")
        alloc.due = item.get("due", "") or alloc.due_date
        alloc.date = item.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
        alloc.allocation_mode = item.get("allocationMode", "Category Allocation")
        alloc.workflow_stage = item.get("workflowStage", "Based on Employee Role")
        alloc.batch_id = batch_id
        alloc.batch_file = item.get("batchFile", "")
        alloc.notify_employee = bool(item.get("notifyEmployee", True))
        alloc.posted_by = item.get("postedBy", "Administrator")
        alloc.posted_to = item.get("postedTo", alloc.employee)
        alloc.remark = item.get("remark", "")
        alloc.allocated_at = time.time()
        alloc.status_updated_at = time.time()

        saved_items.append(alloc)

        # Create notification for employee
        if alloc.notify_employee and alloc.employee_id:
            notif = Notification(
                id=f"NOTIF-{int(time.time() * 1000)}-{alloc.isbn}",
                title=f"New Allocation: {alloc.isbn}",
                type="allocation",
                category="File Allocation",
                status="Allocated",
                isbn=alloc.isbn,
                project_id=alloc.project_id,
                project_name=alloc.project_name,
                employee_id=alloc.employee_id,
                employee_name=alloc.employee,
                recipient_id=alloc.employee_id,
                recipient_name=alloc.employee,
                target_employee_ids=json.dumps([alloc.employee_id]),
                target_roles=json.dumps([alloc.work_type, alloc.role]),
                reason=f"Admin allocated {alloc.isbn} to you. Priority: {alloc.priority}, Due: {alloc.due_date}",
                remarks=alloc.remark,
                section="File Allocation",
                read=False,
                created_at=time.time()
            )
            db.add(notif)

    # Save AllocationHistory record
    hist = AllocationHistory(
        id=batch_id,
        batch_id=batch_id,
        date=date_str,
        file_name=incoming[0].get("batchFile", "FileFlow Batch"),
        total_files=len(saved_items),
        mode=incoming[0].get("allocationMode", "Category Allocation"),
        status="Completed"
    )
    db.add(hist)

    db.commit()
    return {"ok": True, "count": len(saved_items), "batchId": batch_id}

@app.post("/api/allocations/status")
def update_allocation_status(update: dict, db: Session = Depends(get_db)):
    alloc_id = update.get("id")
    clean_isbn = str(update.get("isbn", "")).strip()

    # Sync trimSize and pageCount across all records with this ISBN
    if clean_isbn and (update.get("trimSize") is not None or update.get("pageCount") is not None):
        same_isbn_allocs = db.query(Allocation).filter(Allocation.isbn == clean_isbn).all()
        for a in same_isbn_allocs:
            if update.get("trimSize") is not None: a.trim_size = str(update["trimSize"])
            if update.get("pageCount") is not None: a.page_count = str(update["pageCount"])
            if update.get("specsEnteredBy") is not None: a.specs_entered_by = str(update["specsEnteredBy"])
            a.status_updated_at = time.time()

    # Find allocation to update
    alloc = None
    if alloc_id:
        alloc = db.query(Allocation).filter(Allocation.id == alloc_id).first()
    if not alloc and clean_isbn:
        work_type = str(update.get("workType", update.get("role", ""))).lower().strip()
        emp_id = str(update.get("employeeId", "")).lower().strip()
        query = db.query(Allocation).filter(Allocation.isbn == clean_isbn)
        if work_type:
            query = query.filter(Allocation.work_type == work_type)
        if emp_id:
            query = query.filter(
                or_(
                    func.lower(Allocation.employee_id) == emp_id,
                    func.lower(Allocation.employee_code) == emp_id
                )
            )
        alloc = query.first()

    if not alloc and not clean_isbn:
        raise HTTPException(status_code=404, detail="Allocation not found")

    if alloc:
        next_status = update.get("status") or alloc.status
        alloc.status = next_status
        alloc.completed = 1 if next_status in ("Complete", "Completed", "Finished") else (0 if next_status != alloc.status else alloc.completed)
        alloc.rejected = 1 if next_status in ("Reject", "Rejected", "Rework") else (0 if next_status != alloc.status else alloc.rejected)
        alloc.hold = 1 if next_status == "Hold" else (0 if next_status != alloc.status else alloc.hold)

        if "statusReason" in update: alloc.status_reason = str(update["statusReason"] or "")
        if "started" in update: alloc.started = float(update["started"] or 0.0)
        if "ended" in update: alloc.ended = float(update["ended"] or 0.0)
        if "uploaded" in update: alloc.uploaded = str(update["uploaded"] or "")
        if "savedPath" in update: alloc.saved_path = str(update["savedPath"] or "")
        if "downloadSavedPath" in update: alloc.download_saved_path = str(update["downloadSavedPath"] or "")
        alloc.status_updated_at = time.time()

        # Create real central notification when employee updates status
        notif = Notification(
            id=f"NOTIF-{int(time.time() * 1000)}-{alloc.isbn}",
            title=f"{alloc.employee} updated {alloc.isbn} to {alloc.status}",
            type="status_update",
            category="Work Status",
            status=alloc.status,
            isbn=alloc.isbn,
            project_id=alloc.project_id,
            project_name=alloc.project_name,
            employee_id=alloc.employee_id,
            employee_name=alloc.employee,
            recipient_id="admin",
            recipient_name="Administrator",
            reason=f"Status changed to {alloc.status}. {alloc.status_reason}",
            remarks=alloc.status_reason,
            section="Notifications",
            read=False,
            created_at=time.time()
        )
        db.add(notif)

    db.commit()
    return {"ok": True, "item": alloc.to_dict() if alloc else None}

@app.post("/api/allocations/clear")
def clear_allocations(payload: dict, db: Session = Depends(get_db)):
    isbn = payload.get("isbn")
    emp_id = payload.get("employeeId")
    emp_name = payload.get("employeeName")

    query = db.query(Allocation)
    if isbn:
        query = query.filter(Allocation.isbn == isbn.strip())
    elif emp_id or emp_name:
        t = str(emp_id or emp_name).strip().lower()
        query = query.filter(
            or_(
                func.lower(Allocation.employee_id) == t,
                func.lower(Allocation.employee_code) == t,
                func.lower(Allocation.employee) == t
            )
        )
    else:
        # Clear all
        query.delete()
        db.commit()
        return {"ok": True, "count": 0}

    count = query.delete(synchronize_session=False)
    db.commit()
    return {"ok": True, "deleted": count}

@app.get("/api/allocations/history")
def get_allocation_history(db: Session = Depends(get_db)):
    items = db.query(AllocationHistory).order_by(desc(AllocationHistory.created_at)).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

@app.get("/api/allocations/matrix")
def get_allocation_matrix(db: Session = Depends(get_db)):
    allocs = db.query(Allocation).all()
    matrix_map = {}

    for a in allocs:
        isbn = a.isbn
        if isbn not in matrix_map:
            matrix_map[isbn] = {
                "isbn": isbn,
                "fileId": f"Master File ({isbn})",
                "bookDev": None,
                "bookDevId": "",
                "bookStatus": "Not Allocated",
                "coverDev": None,
                "coverDevId": "",
                "coverStatus": "Not Allocated",
                "qcName": "",
                "qcStatus": "",
                "qcReady": False,
                "qagName": "",
                "qagStatus": "",
                "qagReady": False,
                "pipelineStage": "Allocated",
                "trimSize": a.trim_size,
                "pageCount": a.page_count
            }

        m = matrix_map[isbn]
        wt = (a.work_type or "").lower()
        st = a.status or "Allocated"

        if "cover" in wt or "graphic" in wt:
            m["coverDev"] = a.employee
            m["coverDevId"] = a.employee_id or a.employee_code
            m["coverStatus"] = st
        elif "qc" in wt:
            m["qcName"] = a.employee
            m["qcStatus"] = st
        elif "qag" in wt:
            m["qagName"] = a.employee
            m["qagStatus"] = st
        else:
            m["bookDev"] = a.employee
            m["bookDevId"] = a.employee_id or a.employee_code
            m["bookStatus"] = st

        # Calculate readiness & stage
        book_done = m["bookStatus"] in ("Complete", "Finished")
        cover_done = m["coverStatus"] in ("Complete", "Finished")
        m["qcReady"] = book_done and cover_done
        qc_done = m["qcStatus"] in ("Complete", "QC Approved", "Pass")
        m["qagReady"] = qc_done

        if m["qagStatus"] in ("Complete", "Approved"):
            m["pipelineStage"] = "QAG Completed"
        elif "Rework" in (m["bookStatus"], m["coverStatus"], m["qcStatus"], m["qagStatus"]):
            m["pipelineStage"] = "Rework"
        elif m["qcReady"] and not qc_done:
            m["pipelineStage"] = "QC Ready"
        elif m["bookStatus"] == "WIP" or m["coverStatus"] == "WIP":
            m["pipelineStage"] = "WIP"

    return {"ok": True, "records": list(matrix_map.values())}

# ==========================================
# 5. Production Dashboard & Productivity Endpoints
# ==========================================

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    allocs = db.query(Allocation).all()
    unique_isbns = set(a.isbn for a in allocs)
    emp_count = db.query(Employee).filter(Employee.status == "Active").count()

    status_lower = lambda x: str(x.status or "Allocated").lower()
    completed = len([a for a in allocs if "complete" in status_lower(a) or "finished" in status_lower(a)])
    wip = len([a for a in allocs if status_lower(a) in ("wip", "work in progress", "in progress")])
    rework = len([a for a in allocs if status_lower(a) in ("rework", "reject", "rejected")])
    hold = len([a for a in allocs if status_lower(a) == "hold"])
    pending = len([a for a in allocs if status_lower(a) in ("allocated", "not started", "yet to start")])

    return {
        "ok": True,
        "masterTotal": len(unique_isbns),
        "total": len(allocs),
        "completed": completed,
        "wip": wip,
        "rework": rework,
        "hold": hold,
        "pending": pending,
        "employees": emp_count
    }

@app.get("/api/dashboard/productivity")
def get_weekly_productivity(period: str = "week", db: Session = Depends(get_db)):
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    actual = [0] * 7
    target = [0] * 7

    now = datetime.utcnow()
    # Monday of current week
    start_of_week = now - timedelta(days=now.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    allocs = db.query(Allocation).filter(
        or_(
            func.lower(Allocation.status).in_(["complete", "completed", "finished"]),
            Allocation.completed == 1
        )
    ).all()

    for a in allocs:
        # Check ended timestamp or status_updated_at or created_at
        ts = a.ended or a.status_updated_at
        if ts and ts > 0:
            dt = datetime.utcfromtimestamp(ts / 1000.0 if ts > 1e11 else ts)
            if dt >= start_of_week:
                day_idx = dt.weekday() # 0 = Mon, 6 = Sun
                if 0 <= day_idx < 7:
                    actual[day_idx] += 1
        elif a.created_at and a.created_at >= start_of_week:
            day_idx = a.created_at.weekday()
            if 0 <= day_idx < 7:
                actual[day_idx] += 1

    # Target calculation based on active allocation load
    total_active = db.query(Allocation).count()
    daily_target = max(1, total_active // 7) if total_active > 0 else 0
    target = [daily_target] * 7

    return {
        "ok": True,
        "labels": days,
        "actual": actual,
        "target": target,
        "totalCompleted": sum(actual),
        "totalTarget": sum(target)
    }

@app.get("/api/dashboard/performers")
def get_top_performers(db: Session = Depends(get_db)):
    allocs = db.query(Allocation).all()
    emp_map = {}

    for a in allocs:
        key = a.employee or a.employee_id
        if not key:
            continue
        if key not in emp_map:
            emp_map[key] = {
                "name": a.employee or key,
                "id": a.employee_id or a.employee_code or "EMP",
                "designation": a.role or "DEVELOPER",
                "allocated": 0,
                "completed": 0
            }
        emp_map[key]["allocated"] += (a.allocated or 1)
        if a.completed == 1 or str(a.status).lower() in ("complete", "finished", "completed"):
            emp_map[key]["completed"] += 1

    candidates = list(emp_map.values())
    candidates.sort(key=lambda x: x["completed"], reverse=True)

    result = []
    for idx, c in enumerate(candidates[:5]):
        quality = round((c["completed"] / c["allocated"]) * 100) if c["allocated"] > 0 else 100
        result.append({
            **c,
            "rank": idx + 1,
            "quality": min(100, quality),
            "time": "—"
        })

    return {"ok": True, "performers": result}

@app.get("/api/dashboard/planning")
def get_planning_data(period: str = "Daily", year: str = "2026", db: Session = Depends(get_db)):
    allocs = db.query(Allocation).all()

    if period == "Daily":
        # Group by last 8 days
        now = datetime.utcnow()
        day_map = {}
        for i in range(7, -1, -1):
            d = (now - timedelta(days=i)).strftime("%m/%d/%Y")
            day_map[d] = {"label": d, "value": 0, "allocated": 0, "completed": 0, "wip": 0, "rework": 0}

        for a in allocs:
            d_str = (a.created_at or now).strftime("%m/%d/%Y")
            if d_str in day_map:
                day_map[d_str]["value"] += 1
                day_map[d_str]["allocated"] += 1
                st = str(a.status).lower()
                if "complete" in st: day_map[d_str]["completed"] += 1
                elif "wip" in st: day_map[d_str]["wip"] += 1
                elif "rework" in st or "reject" in st: day_map[d_str]["rework"] += 1

        data = list(day_map.values())
        max_val = max([x["value"] for x in data] + [10])
        return {
            "title": "Production Planning",
            "subtitle": "Daily demand, completed and work-in-progress files.",
            "planBadge": f"Active: {len(allocs)} total records",
            "maxY": max_val * 2,
            "yTicks": [max_val * 2, int(max_val * 1.5), max_val, int(max_val * 0.5), 0],
            "data": data
        }

    # Monthly
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    month_data = [{"label": m, "value": 0, "allocated": 0, "completed": 0, "wip": 0, "rework": 0} for m in months]

    for a in allocs:
        m_idx = (a.created_at or datetime.utcnow()).month - 1
        month_data[m_idx]["value"] += 1
        month_data[m_idx]["allocated"] += 1
        st = str(a.status).lower()
        if "complete" in st: month_data[m_idx]["completed"] += 1
        elif "wip" in st: month_data[m_idx]["wip"] += 1
        elif "rework" in st or "reject" in st: month_data[m_idx]["rework"] += 1

    return {
        "title": "Production Planning",
        "subtitle": "Monthly demand, completed and work-in-progress files.",
        "planBadge": f"Year {year} production plan",
        "maxY": max([x["value"] for x in month_data] + [10]) * 2,
        "yTicks": [100, 75, 50, 25, 0],
        "data": month_data
    }

# ==========================================
# 6. Reports Module Endpoints
# ==========================================

@app.get("/api/reports/my-report")
def get_my_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Authenticated, user-scoped production report.  No fallback to all users."""
    identities = {str(value).strip().lower() for value in (
        current_user.username, current_user.emp_id, current_user.gi_emp_id, current_user.name
    ) if value}
    # Also resolve employee record if exists to ensure complete alias matching
    emp_record = db.query(Employee).filter(
        or_(
            func.lower(Employee.emp_id) == str(current_user.emp_id or current_user.username).lower(),
            func.lower(Employee.name) == str(current_user.name or "").lower()
        )
    ).first()
    if emp_record:
        for val in (emp_record.emp_id, emp_record.gi_emp_id, emp_record.name):
            if val:
                identities.add(str(val).strip().lower())

    conditions = []
    for identity in identities:
        conditions.extend([
            func.lower(Allocation.employee_id) == identity,
            func.lower(Allocation.employee_code) == identity,
            func.lower(Allocation.employee) == identity,
            func.lower(Allocation.posted_to) == identity,
            Allocation.employee_alt_ids.like(f'%"{identity}"%')
        ])
    if not conditions:
        return {
            "ok": True,
            "summary": {"allocated": 0, "completed": 0, "inProgress": 0, "rework": 0},
            "rows": [],
            "filters": {"start_date": start_date, "end_date": end_date, "status": status_filter, "search": search}
        }
    query = db.query(Allocation).filter(or_(*conditions))
    if status_filter:
        query = query.filter(func.lower(Allocation.status) == status_filter.lower().strip())
    if search:
        needle = f"%{search.strip().lower()}%"
        query = query.filter(or_(func.lower(Allocation.isbn).like(needle), func.lower(Allocation.project_name).like(needle), func.lower(Allocation.chapter).like(needle)))
    items = query.order_by(desc(Allocation.created_at)).all()
    rows = []
    for item in items:
        record_date = item.date or (item.created_at.strftime("%Y-%m-%d") if item.created_at else "")
        if start_date and record_date and record_date < start_date: continue
        if end_date and record_date and record_date > end_date: continue
        rows.append({"id":item.id,"isbn":item.isbn,"project":item.project_name or item.project,"chapter":item.chapter,"process":item.workflow_stage or item.role,"status":item.status,"due":item.due or item.due_date,"allocatedAt":item.allocated_at,"started":item.started,"ended":item.ended,"date":record_date,"employee":item.employee})
    completed = sum(1 for row in rows if str(row["status"]).lower() in ("complete", "completed", "finished"))
    rework = sum(1 for row in rows if any(word in str(row["status"]).lower() for word in ("rework", "reject")))
    return {"ok":True,"summary":{"allocated":len(rows),"completed":completed,"inProgress":sum(1 for row in rows if "progress" in str(row["status"]).lower() or str(row["status"]).lower()=="wip"),"rework":rework},"rows":rows,"filters":{"start_date":start_date,"end_date":end_date,"status":status_filter,"search":search}}

@app.get("/api/reports/my-report/activity")
def get_my_report_activity(limit: int = 10, current_user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    identities = {str(value).strip().lower() for value in (current_user.username, current_user.emp_id, current_user.gi_emp_id, current_user.name) if value}
    clauses = []
    for identity in identities:
        clauses.extend([func.lower(Allocation.employee_id) == identity, func.lower(Allocation.employee_code) == identity, func.lower(Allocation.employee) == identity, func.lower(Allocation.posted_to) == identity, Allocation.employee_alt_ids.like(f'%"{identity}"%')])
    activities=[]
    for item in db.query(Allocation).filter(or_(*clauses)).order_by(desc(Allocation.status_updated_at), desc(Allocation.created_at)).limit(max(1,min(limit,50))).all():
        timestamp=item.status_updated_at or item.allocated_at or (item.created_at.timestamp() if item.created_at else 0)
        activities.append({"id":item.id,"project":item.project_name or item.project,"isbn":item.isbn,"stage":item.workflow_stage or item.role,"status":item.status,"description":item.status_reason or item.remark or f"Status updated to {item.status}","timestamp":timestamp})
    return {"ok":True,"items":activities,"count":len(activities)}

@app.get("/api/reports/incoming-project")
def get_incoming_project_report(
    project_id: Optional[str] = None, isbn: Optional[str] = None, title: Optional[str] = None,
    client: Optional[str] = None, project_type: Optional[str] = None, priority: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"), assigned_to: Optional[str] = None,
    start_date: Optional[str] = None, end_date: Optional[str] = None, search: Optional[str] = None,
    current_user: User = Depends(require_current_user), db: Session = Depends(get_db)
):
    query = db.query(Project)
    if project_id: query = query.filter(func.lower(Project.id).like(f"%{project_id.lower().strip()}%"))
    if isbn: query = query.filter(func.lower(Project.isbn).like(f"%{isbn.lower().strip()}%"))
    if title: query = query.filter(func.lower(Project.name).like(f"%{title.lower().strip()}%"))
    if client: query = query.filter(func.lower(Project.customer) == client.lower().strip())
    if project_type: query = query.filter(func.lower(Project.stage) == project_type.lower().strip())
    if priority: query = query.filter(func.lower(Project.priority) == priority.lower().strip())
    if status_filter: query = query.filter(func.lower(Project.status) == status_filter.lower().strip())
    if search:
        needle=f"%{search.lower().strip()}%"; query=query.filter(or_(func.lower(Project.id).like(needle),func.lower(Project.isbn).like(needle),func.lower(Project.name).like(needle),func.lower(Project.customer).like(needle)))
    projects=query.order_by(desc(Project.created_at)).all(); rows=[]
    for project in projects:
        received=project.created_at.strftime("%Y-%m-%d") if project.created_at else ""
        if start_date and received < start_date: continue
        if end_date and received > end_date: continue
        allocations=db.query(Allocation).filter(or_(Allocation.project_id==project.id,Allocation.isbn==project.isbn)).all()
        assignees=sorted({a.employee for a in allocations if a.employee})
        if assigned_to and assigned_to.lower() not in {x.lower() for x in assignees}: continue
        production_status="In Production" if any("progress" in (a.status or "").lower() or (a.status or "").lower()=="wip" for a in allocations) else ("Assigned" if assignees else "Ready for Assignment")
        rows.append({"id":project.id,"isbn":project.isbn,"bookTitle":project.name,"project":project.name,"client":project.customer,"format":project.stage,"projectType":project.stage,"priority":project.priority,"receivedDate":received,"assignedTo":", ".join(assignees) or "Unassigned","status":project.status,"productionStatus":production_status,"due":project.due,"department":project.department})
    return {"ok":True,"summary":{"totalIncoming":len(rows),"newProjects":sum(1 for r in rows if r["status"].lower() in ("new","yet to start")),"awaitingAssignment":sum(1 for r in rows if r["assignedTo"]=="Unassigned"),"assigned":sum(1 for r in rows if r["assignedTo"]!="Unassigned"),"inProduction":sum(1 for r in rows if r["productionStatus"]=="In Production"),"urgent":sum(1 for r in rows if r["priority"].lower() in ("high","urgent"))},"rows":rows,"filters":{"projectId":project_id,"isbn":isbn,"title":title,"client":client,"projectType":project_type,"priority":priority,"status":status_filter,"assignedTo":assigned_to,"startDate":start_date,"endDate":end_date,"search":search}}

@app.get("/api/reports/daily-allotment")
def get_daily_allotment_report(date: Optional[str] = None, unit: Optional[str] = None, department: Optional[str] = None, employee: Optional[str] = None, status_filter: Optional[str] = Query(None, alias="status"), search: Optional[str] = None, current_user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    query=db.query(Allocation)
    if department: query=query.filter(func.lower(Allocation.department)==department.lower().strip())
    if employee: query=query.filter(or_(func.lower(Allocation.employee).like(f"%{employee.lower().strip()}%"),func.lower(Allocation.employee_id)==employee.lower().strip()))
    if status_filter: query=query.filter(func.lower(Allocation.status)==status_filter.lower().strip())
    if search:
        q=f"%{search.lower().strip()}%"; query=query.filter(or_(func.lower(Allocation.isbn).like(q),func.lower(Allocation.project_name).like(q),func.lower(Allocation.employee).like(q)))
    items=query.order_by(desc(Allocation.created_at)).all(); rows=[]
    for item in items:
        row_date=item.date or (item.created_at.strftime("%Y-%m-%d") if item.created_at else "")
        if date and row_date != date: continue
        if unit and item.team.lower()!=unit.lower() and item.department.lower()!=unit.lower(): continue
        rows.append({"id":item.id,"date":row_date,"isbn":item.isbn,"project":item.project_name or item.project,"employee":item.employee,"employeeId":item.employee_id,"department":item.department,"unit":item.team,"role":item.role,"status":item.status,"priority":item.priority,"due":item.due or item.due_date,"remark":item.remark or item.status_reason})
    def has(row,*terms): return any(term in row["status"].lower() for term in terms)
    return {"ok":True,"summary":{"totalAllocated":len(rows),"employeesAssigned":len({r["employeeId"] or r["employee"] for r in rows if r["employeeId"] or r["employee"]}),"workInProgress":sum(has(r,"progress","wip") for r in rows),"completed":sum(has(r,"complete","finished") for r in rows),"pending":sum(not has(r,"progress","wip","complete","finished","rework","reject") for r in rows),"rework":sum(has(r,"rework","reject") for r in rows)},"rows":rows,"filters":{"date":date,"unit":unit,"department":department,"employee":employee,"status":status_filter,"search":search},"employees":[{"id":e.emp_id,"name":e.name} for e in db.query(Employee).filter(Employee.status=="Active").order_by(Employee.name).all()]}

@app.get("/api/reports/rework-analysis")
def get_rework_analysis(start_date: Optional[str]=None, end_date: Optional[str]=None, employee: Optional[str]=None, department: Optional[str]=None, stage: Optional[str]=None, status_filter: Optional[str]=Query(None,alias="status"), search: Optional[str]=None, current_user: User=Depends(require_current_user), db: Session=Depends(get_db)):
    records=[]
    for a in db.query(Allocation).all():
        if not any(word in (a.status or "").lower() for word in ("rework","reject")): continue
        date_value=a.date or (a.created_at.strftime("%Y-%m-%d") if a.created_at else "")
        records.append({"id":a.id,"isbn":a.isbn,"project":a.project_name or a.project,"employee":a.employee,"department":a.department,"stage":a.workflow_stage or a.role,"status":a.status,"rootCause":a.status_reason or a.remark,"date":date_value,"due":a.due or a.due_date,"source":"Allocation"})
    for m in db.query(MailCorrection).all():
        if not any(word in (m.status or "").lower() for word in ("rework","reject","correction")): continue
        records.append({"id":m.id,"isbn":m.isbn,"project":m.project_name,"employee":m.assigned_employee,"department":"Corrections","stage":m.correction_round,"status":m.status,"rootCause":m.description or m.internal_remarks,"date":m.received_at or m.created_date,"due":m.due_at,"source":"MailCorrection"})
    def matches(row):
        text=" ".join(str(row.get(k,"")).lower() for k in row)
        if employee and employee.lower() not in row["employee"].lower(): return False
        if department and department.lower()!=row["department"].lower(): return False
        if stage and stage.lower()!=row["stage"].lower(): return False
        if status_filter and status_filter.lower()!=row["status"].lower(): return False
        if search and search.lower() not in text: return False
        if start_date and row["date"] and row["date"] < start_date: return False
        if end_date and row["date"] and row["date"] > end_date: return False
        return True
    rows=[row for row in records if matches(row)]
    total_allocations=db.query(Allocation).count(); resolved=sum(1 for r in rows if any(x in r["status"].lower() for x in ("complete","resolved","closed")))
    stages={}; causes={}; trend={}
    for row in rows:
        stages[row["stage"]]=stages.get(row["stage"],0)+1
        if row["rootCause"]: causes[row["rootCause"]]=causes.get(row["rootCause"],0)+1
        if row["date"]: trend[row["date"]]=trend.get(row["date"],0)+1
    return {"ok":True,"summary":{"total_rework":len(rows),"rework_rate":round((len(rows)/total_allocations*100),2) if total_allocations else 0,"reworked_projects":len({r["project"] for r in rows if r["project"]}),"resolved":resolved,"pending":len(rows)-resolved},"stage_analysis":[{"stage":k,"count":v,"percentage":round(v/len(rows)*100,2) if rows else 0} for k,v in stages.items()],"root_causes":[{"reason":k,"count":v,"percentage":round(v/len(rows)*100,2) if rows else 0} for k,v in causes.items()],"trend":[{"date":k,"count":v} for k,v in sorted(trend.items())],"rows":rows,"filters":{"start_date":start_date,"end_date":end_date,"employee":employee,"department":department,"stage":stage,"status":status_filter,"search":search}}

@app.get("/api/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    allocs = db.query(Allocation).all()
    employees = db.query(Employee).all()
    qag_reports = db.query(QAGReport).all()

    if report_id == "qag-report":
        rows = []
        for i, q in enumerate(qag_reports, 1):
            rows.append({
                "id": i,
                "auditId": q.id,
                "project": f"Peter Lang ({q.isbn})",
                "chapter": "Full Title",
                "auditor": q.auditor_name or q.qag_employee,
                "developer": q.developer,
                "unit": "DTPC",
                "defects": q.defects,
                "score": q.score,
                "status": q.status,
                "auditDate": q.submitted_date or "—"
            })
        passed = len([r for r in rows if r["status"] in ("Approved", "Pass")])
        rate = f"{round((passed / max(1, len(rows))) * 100)}%"
        return {
            "title": "QAG Report",
            "sub": "Quality Assurance Group audit summaries, first-time pass rates, and defect counts",
            "kpis": [
                {"label": "Audited Batches", "value": len(rows), "sub": "Total QC checks completed"},
                {"label": "Passed Clean", "value": passed, "sub": "Zero critical defects", "status": "good"},
                {"label": "Audit Pass Rate", "value": rate, "sub": "SLA target: 95%", "status": "good"},
                {"label": "Minor Defects Caught", "value": sum(r["defects"] for r in rows), "sub": "Caught before delivery", "status": "short"}
            ],
            "columns": [
                {"key": "auditId", "label": "Audit ID"},
                {"key": "project", "label": "Project & ISBN"},
                {"key": "chapter", "label": "Chapter / Batch"},
                {"key": "auditor", "label": "QAG Auditor"},
                {"key": "developer", "label": "Developer"},
                {"key": "unit", "label": "Unit"},
                {"key": "defects", "label": "Defects"},
                {"key": "score", "label": "Score"},
                {"key": "status", "label": "Status"},
                {"key": "auditDate", "label": "Audit Date"}
            ],
            "rows": rows
        }

    # Individual / Employee Productivity Report
    if report_id in ("individual-report", "my-report", "employee-productivity"):
        emp_stats = {}
        for a in allocs:
            name = a.employee
            if not name: continue
            if name not in emp_stats:
                emp_stats[name] = {"emp": name, "id": a.employee_id, "allocated": 0, "completed": 0, "rework": 0}
            emp_stats[name]["allocated"] += 1
            st = str(a.status).lower()
            if "complete" in st: emp_stats[name]["completed"] += 1
            elif "rework" in st or "reject" in st: emp_stats[name]["rework"] += 1

        rows = []
        for i, (k, v) in enumerate(emp_stats.items(), 1):
            eff = f"{round((v['completed'] / max(1, v['allocated'])) * 100)}%"
            rows.append({
                "id": i,
                "empId": v["id"],
                "name": v["emp"],
                "department": "Production",
                "allocated": v["allocated"],
                "completed": v["completed"],
                "rework": v["rework"],
                "efficiency": eff,
                "status": "Active"
            })

        return {
            "title": "Individual Report",
            "sub": "Employee task throughput, quality ratings, and individual delivery tracking",
            "kpis": [
                {"label": "Active Personnel", "value": len(rows), "sub": "Tracked this cycle"},
                {"label": "Total Allocated", "value": sum(r["allocated"] for r in rows), "sub": "Workload count"},
                {"label": "Total Completed", "value": sum(r["completed"] for r in rows), "sub": "Delivered files", "status": "good"},
                {"label": "Total Rework", "value": sum(r["rework"] for r in rows), "sub": "Correction needed", "status": "short"}
            ],
            "columns": [
                {"key": "empId", "label": "Emp ID"},
                {"key": "name", "label": "Employee Name"},
                {"key": "department", "label": "Department"},
                {"key": "allocated", "label": "Allocated"},
                {"key": "completed", "label": "Completed"},
                {"key": "rework", "label": "Rework"},
                {"key": "efficiency", "label": "Efficiency"},
                {"key": "status", "label": "Status"}
            ],
            "rows": rows
        }

    # Manpower Data Report
    if report_id == "manpower-data":
        dep_map = {}
        for e in employees:
            dep = e.department or "Production"
            if dep not in dep_map:
                dep_map[dep] = {"headcount": 0, "active": 0}
            dep_map[dep]["headcount"] += 1
            if e.status == "Active": dep_map[dep]["active"] += 1

        rows = []
        for i, (dep, stats) in enumerate(dep_map.items(), 1):
            rows.append({
                "id": i,
                "department": dep,
                "unit": "DTPC",
                "sanctioned": stats["headcount"],
                "present": stats["active"],
                "utilization": "100%",
                "lead": "Team Lead"
            })
        return {
            "title": "Manpower Data Report",
            "sub": "Headcount, departmental capacity, present strength, and resource utilization",
            "kpis": [
                {"label": "Total Headcount", "value": len(employees), "sub": "Across all teams"},
                {"label": "Active Strength", "value": len([e for e in employees if e.status == 'Active']), "sub": "Currently assigned"},
                {"label": "Departments", "value": len(dep_map), "sub": "Operational units"}
            ],
            "columns": [
                {"key": "department", "label": "Department"},
                {"key": "unit", "label": "Unit"},
                {"key": "sanctioned", "label": "Total Headcount"},
                {"key": "present", "label": "Active Strength"},
                {"key": "utilization", "label": "Capacity"},
                {"key": "lead", "label": "Lead"}
            ],
            "rows": rows
        }

    # General production / allocations based reports
    rows = []
    for i, a in enumerate(allocs, 1):
        rows.append({
            "id": i,
            "isbn": a.isbn,
            "project": a.project_name or a.project,
            "employee": a.employee,
            "department": a.department,
            "role": a.role,
            "status": a.status,
            "due": a.due or a.due_date,
            "allocated": a.allocated,
            "completed": a.completed
        })

    return {
        "title": report_id.replace("-", " ").title(),
        "sub": "Production records and execution status.",
        "kpis": [
            {"label": "Total Files", "value": len(rows), "sub": "Database records"},
            {"label": "Completed", "value": len([r for r in rows if 'complete' in str(r['status']).lower()]), "sub": "Delivered", "status": "good"},
            {"label": "In Progress", "value": len([r for r in rows if 'wip' in str(r['status']).lower()]), "sub": "Active work"}
        ],
        "columns": [
            {"key": "isbn", "label": "ISBN"},
            {"key": "project", "label": "Project Name"},
            {"key": "employee", "label": "Employee"},
            {"key": "department", "label": "Department"},
            {"key": "role", "label": "Workflow Role"},
            {"key": "status", "label": "Status"},
            {"key": "due", "label": "Due Date"}
        ],
        "rows": rows
    }

# ==========================================
# 7. Mail & Mail Corrections Endpoints
# ==========================================

@app.get("/api/mail")
def get_internal_mail(user: Optional[str] = None, aliases: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(InternalMail)
    if user:
        targets = set([user.strip().lower()])
        if aliases:
            for a in aliases.split(","):
                if a.strip(): targets.add(a.strip().lower())

        conds = [InternalMail.to_id == "all"]
        for t in targets:
            conds.append(func.lower(InternalMail.from_id) == t)
            conds.append(func.lower(InternalMail.to_id) == t)
            conds.append(func.lower(InternalMail.assignee_id) == t)
            conds.append(InternalMail.to_alternate_ids.like(f'%"{t}"%'))
        query = query.filter(or_(*conds))

    mails = query.order_by(desc(InternalMail.created_at)).all()
    return {"ok": True, "items": [m.to_dict() for m in mails]}

@app.post("/api/mail")
def send_internal_mail(item: dict, db: Session = Depends(get_db)):
    mail_id = item.get("id") or f"MAIL-{int(time.time() * 1000)}"
    mail = InternalMail(
        id=mail_id,
        sender=item.get("sender") or item.get("fromName") or "User",
        sender_email=item.get("senderEmail", ""),
        from_id=str(item.get("fromId", "")).strip().lower(),
        from_name=item.get("fromName", ""),
        from_role=item.get("fromRole", ""),
        to_id=str(item.get("toId", "")).strip().lower(),
        to_name=item.get("toName", ""),
        to_role=item.get("toRole", ""),
        to_alternate_ids=json.dumps(item.get("toAlternateIds", [])),
        assignee=item.get("assignee", item.get("toName", "")),
        assignee_id=str(item.get("assigneeId", item.get("toId", ""))).strip().lower(),
        subject=item.get("subject", "(No subject)"),
        title=item.get("title", item.get("subject", "")),
        project=item.get("project", ""),
        isbn=item.get("isbn", ""),
        chapter=item.get("chapter", ""),
        category=item.get("category", item.get("type", "General")),
        priority=item.get("priority", "Normal"),
        folder="Inbox",
        status="Inbox",
        body=item.get("body", ""),
        attachments=json.dumps(item.get("attachments", [])),
        timeline=json.dumps(item.get("timeline", [{"sender": item.get("fromName"), "role": "Original Mail", "title": item.get("subject"), "time": datetime.utcnow().strftime("%d %b %Y, %I:%M %p")}])),
        notes=json.dumps(item.get("notes", [])),
        draft=bool(item.get("draft", False)),
        resolved=False,
        starred=False,
        read_by=json.dumps([item.get("fromId")]),
        deleted_by=json.dumps([]),
        created_at=time.time() * 1000
    )
    db.add(mail)

    # Create real notification for recipient
    if mail.to_id and mail.to_id != "all":
        notif = Notification(
            id=f"NOTIF-{int(time.time() * 1000)}",
            title=f"New Mail from {mail.from_name}: {mail.subject}",
            type="mail",
            category="Internal Mail",
            status="Mail",
            isbn=mail.isbn,
            project_id="PRJ-MAIL",
            project_name=mail.project or "Internal Mail",
            employee_id=mail.from_id,
            employee_name=mail.from_name,
            recipient_id=mail.to_id,
            recipient_name=mail.to_name,
            reason=f"Mail: {mail.subject}",
            remarks=mail.body[:200],
            section="Mail Corrections",
            read=False,
            created_at=time.time()
        )
        db.add(notif)

    db.commit()
    db.refresh(mail)
    return {"ok": True, "item": mail.to_dict()}

@app.post("/api/mail/update")
def update_internal_mail(update: dict, db: Session = Depends(get_db)):
    mail_id = update.get("id")
    patch = update.get("patch", {})
    mail = db.query(InternalMail).filter(InternalMail.id == mail_id).first()
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")

    if "readBy" in patch: mail.read_by = json.dumps(patch["readBy"])
    if "deletedBy" in patch: mail.deleted_by = json.dumps(patch["deletedBy"])
    if "starred" in patch: mail.starred = bool(patch["starred"])
    if "resolved" in patch: mail.resolved = bool(patch["resolved"])
    if "status" in patch: mail.status = str(patch["status"])
    if "folder" in patch: mail.folder = str(patch["folder"])

    db.commit()
    return {"ok": True, "item": mail.to_dict()}

@app.post("/api/mail/delete")
def delete_internal_mail(payload: dict, db: Session = Depends(get_db)):
    ids = payload.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No mail IDs provided")
    deleted = db.query(InternalMail).filter(InternalMail.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"ok": True, "deletedCount": deleted}

# Mail Corrections CRUD
@app.get("/api/mail-corrections")
def get_mail_corrections(db: Session = Depends(get_db)):
    items = db.query(MailCorrection).order_by(desc(MailCorrection.created_at)).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

@app.post("/api/mail-corrections")
def create_mail_correction(data: dict, db: Session = Depends(get_db)):
    corr_id = data.get("id") or f"MC-2026-{int(time.time() * 1000) % 10000:04d}"
    mc = MailCorrection(
        id=corr_id,
        project_id=data.get("projectId", ""),
        project_name=data.get("projectName", ""),
        isbn=data.get("isbn", ""),
        chapter=data.get("chapter", "C11"),
        client=data.get("client", ""),
        email_sender=data.get("emailSender", ""),
        email_subject=data.get("emailSubject", ""),
        correction_round=data.get("correctionRound", "R1"),
        description=data.get("description", ""),
        assigned_employee_id=data.get("assignedEmployeeId", ""),
        assigned_employee=data.get("assignedEmployee", "Unallocated"),
        priority=data.get("priority", "Normal"),
        received_at=data.get("receivedAt", datetime.utcnow().isoformat()),
        due_at=data.get("dueAt", (datetime.utcnow() + timedelta(days=3)).isoformat()),
        status=data.get("status", "Yet to Allocate"),
        time_spent="00:00:00",
        internal_remarks=data.get("internalRemarks", ""),
        attachments=json.dumps(data.get("attachments", [])),
        activity=json.dumps([{"at": datetime.utcnow().strftime("%I:%M %p"), "text": "Correction logged"}])
    )
    db.add(mc)
    db.commit()
    db.refresh(mc)
    return {"ok": True, "item": mc.to_dict()}

@app.put("/api/mail-corrections/{id}")
def update_mail_correction(id: str, data: dict, db: Session = Depends(get_db)):
    mc = db.query(MailCorrection).filter(MailCorrection.id == id).first()
    if not mc:
        raise HTTPException(status_code=404, detail="Mail correction not found")

    for k in ("status", "assignedEmployee", "assignedEmployeeId", "priority", "dueAt", "timeSpent", "internalRemarks"):
        if k in data:
            setattr(mc, k, data[k])

    db.commit()
    return {"ok": True, "item": mc.to_dict()}

@app.delete("/api/mail-corrections/{id}")
def delete_mail_correction(id: str, db: Session = Depends(get_db)):
    mc = db.query(MailCorrection).filter(MailCorrection.id == id).first()
    if mc:
        db.delete(mc)
        db.commit()
    return {"ok": True}

# ==========================================
# 8. Notifications Endpoints
# ==========================================

@app.get("/api/notifications")
@app.get("/notifications")
def get_notifications(
    employeeId: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)

    if employeeId or role:
        eid = employeeId.strip().lower() if employeeId else ""
        r = role.strip().lower() if role else ""
        conds = []
        if eid:
            conds.append(func.lower(Notification.employee_id) == eid)
            conds.append(func.lower(Notification.recipient_id) == eid)
            conds.append(Notification.target_employee_ids.like(f'%"{eid}"%'))
        if r:
            conds.append(Notification.target_roles.like(f'%"{r}"%'))
        if conds:
            query = query.filter(or_(*conds))

    items = query.order_by(desc(Notification.created_at)).limit(500).all()
    dicts = [i.to_dict() for i in items]
    unread = len([i for i in dicts if not i["read"]])
    return {
        "ok": True,
        "items": dicts,
        "notifications": dicts,
        "unread": unread,
        "total": len(dicts)
    }

@app.post("/api/notifications")
@app.post("/notifications")
def create_notification(body: dict, db: Session = Depends(get_db)):
    notif_id = body.get("id") or f"NOTIF-{int(time.time() * 1000)}"
    isbn = body.get("isbn") or body.get("reportSummary", {}).get("isbn") or body.get("fileName") or ""
    status = body.get("status") or body.get("reportSummary", {}).get("status") or "Update"
    project = body.get("projectName") or body.get("project") or body.get("reportSummary", {}).get("projectName") or (f"Peter Lang Title ({isbn})" if isbn else "General Production")
    project_id = body.get("projectId") or body.get("reportSummary", {}).get("projectId") or "PRJ-PETERLANG"

    t_ids = body.get("targetEmployeeIds", [])
    t_roles = body.get("targetRoles", [])

    notif = Notification(
        id=notif_id,
        title=body.get("title", f"Update: {isbn}"),
        type=body.get("type", "notification"),
        category=body.get("category", "General"),
        status=status,
        isbn=isbn,
        project_id=project_id,
        project_name=project,
        employee_id=body.get("employeeId") or body.get("senderId") or "EMP",
        employee_name=body.get("employeeName") or body.get("senderName") or "Employee",
        recipient_id=body.get("recipientId", ""),
        recipient_name=body.get("recipientName", ""),
        target_employee_ids=json.dumps(t_ids) if isinstance(t_ids, list) else "[]",
        target_roles=json.dumps(t_roles) if isinstance(t_roles, list) else "[]",
        reason=body.get("reason") or body.get("remarks") or body.get("description") or "Status updated",
        remarks=body.get("remarks") or body.get("reason") or body.get("description") or "",
        section=body.get("section", "Notifications"),
        read=False,
        created_at=float(body.get("createdAt") or time.time())
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return {"ok": True, "item": notif.to_dict(), "notification": notif.to_dict()}

@app.post("/api/notifications/read")
@app.post("/notifications/read")
def mark_notification_read(body: dict, db: Session = Depends(get_db)):
    notif_id = body.get("id")
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.read = True
        db.commit()
    return {"ok": True, "id": notif_id}

@app.post("/api/notifications/read-all")
@app.post("/notifications/read-all")
def mark_all_notifications_read(body: dict, db: Session = Depends(get_db)):
    emp_id = str(body.get("employeeId", "")).strip().lower()
    query = db.query(Notification)
    if emp_id:
        query = query.filter(
            or_(
                func.lower(Notification.employee_id) == emp_id,
                func.lower(Notification.recipient_id) == emp_id,
                Notification.target_employee_ids.like(f'%"{emp_id}"%')
            )
        )
    query.update({Notification.read: True}, synchronize_session=False)
    db.commit()
    return {"ok": True}

@app.post("/api/notifications/clear-read")
@app.post("/notifications/clear-read")
def clear_read_notifications(body: dict, db: Session = Depends(get_db)):
    emp_id = str(body.get("employeeId", "")).strip().lower()
    query = db.query(Notification).filter(Notification.read == True)
    if emp_id:
        query = query.filter(
            or_(
                func.lower(Notification.employee_id) == emp_id,
                func.lower(Notification.recipient_id) == emp_id,
                Notification.target_employee_ids.like(f'%"{emp_id}"%')
            )
        )
    query.delete(synchronize_session=False)
    db.commit()
    remaining = db.query(Notification).count()
    return {"ok": True, "remaining": remaining}

@app.post("/api/notifications/delete")
@app.post("/notifications/delete")
def delete_notification(body: dict, db: Session = Depends(get_db)):
    notif_id = body.get("id")
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        db.delete(notif)
        db.commit()
    remaining = db.query(Notification).count()
    return {"ok": True, "id": notif_id, "remaining": remaining}

@app.post("/api/notifications/clear")
@app.post("/notifications/clear")
def clear_all_notifications(body: dict, db: Session = Depends(get_db)):
    emp_id = str(body.get("employeeId", "")).strip().lower()
    query = db.query(Notification)
    if emp_id:
        query = query.filter(
            or_(
                func.lower(Notification.employee_id) == emp_id,
                func.lower(Notification.recipient_id) == emp_id,
                Notification.target_employee_ids.like(f'%"{emp_id}"%')
            )
        )
    query.delete(synchronize_session=False)
    db.commit()
    remaining = db.query(Notification).count()
    return {"ok": True, "remaining": remaining}

# ==========================================
# 9. Customer Support, Specs, Instructions, Clients, Feedback
# ==========================================

@app.get("/api/customer-support")
def get_customer_support(db: Session = Depends(get_db)):
    items = db.query(CustomerQuery).order_by(desc(CustomerQuery.created_at)).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

@app.post("/api/customer-support")
def save_customer_query(data: dict, db: Session = Depends(get_db)):
    cq_id = data.get("id") or f"QRY-2026-{int(time.time() * 1000) % 10000:04d}"
    cq = db.query(CustomerQuery).filter(CustomerQuery.id == cq_id).first()
    if not cq:
        cq = CustomerQuery(id=cq_id)
        db.add(cq)

    cq.isbn = data.get("isbn", "")
    cq.project = data.get("project", "")
    cq.project_id = data.get("projectId", "")
    cq.client = data.get("client", "")
    cq.type = data.get("type", "Technical Query")
    cq.priority = data.get("priority", "Medium")
    cq.assigned_to = data.get("assignedTo", "")
    cq.employee_id = data.get("employeeId", "")
    cq.created_at = data.get("createdAt", datetime.utcnow().isoformat())
    cq.status = data.get("status", "Open")
    cq.subject = data.get("subject", "")
    cq.description = data.get("description", "")
    cq.remarks = data.get("remarks", "")

    db.commit()
    db.refresh(cq)
    return {"ok": True, "item": cq.to_dict()}

@app.get("/api/project-specifications")
def get_project_specifications(db: Session = Depends(get_db)):
    items = db.query(ProjectSpecification).order_by(desc(ProjectSpecification.created_at)).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

@app.post("/api/project-specifications")
def save_project_specification(data: dict, db: Session = Depends(get_db)):
    spec_id = data.get("id") or f"SPEC-2026-{int(time.time() * 1000) % 10000:04d}"
    spec = db.query(ProjectSpecification).filter(ProjectSpecification.id == spec_id).first()
    if not spec:
        spec = ProjectSpecification(id=spec_id)
        db.add(spec)

    spec.project_id = data.get("projectId", "")
    spec.project_name = data.get("projectName", "")
    spec.client_name = data.get("clientName", "")
    spec.author_name = data.get("authorName", "")
    spec.isbn = data.get("isbn", "")
    spec.project_type = data.get("projectType", "Book Production")
    spec.priority = data.get("priority", "Medium")
    spec.start_date = data.get("startDate", "")
    spec.delivery_date = data.get("deliveryDate", "")
    spec.reference = data.get("reference", "")
    spec.description = data.get("description", "")
    spec.services = json.dumps(data.get("services", []))
    spec.client_instructions = data.get("clientInstructions", "")
    spec.internal_notes = data.get("internalNotes", "")
    spec.revision_instructions = data.get("revisionInstructions", "")
    spec.revisions = data.get("revisions", "")
    spec.delivery_format = data.get("deliveryFormat", "")
    spec.final_outputs = data.get("finalOutputs", "")
    spec.quality_notes = data.get("qualityNotes", "")
    spec.attachments = json.dumps(data.get("attachments", []))
    spec.assigned_to = data.get("assignedTo", "")
    spec.status = data.get("status", "Active")
    spec.created_by = data.get("createdBy", "Admin")
    spec.created_at = float(data.get("createdAt") or time.time())
    spec.updated_by = data.get("updatedBy", "Admin")
    spec.updated_at = time.time()

    db.commit()
    db.refresh(spec)
    return {"ok": True, "item": spec.to_dict()}

@app.delete("/api/project-specifications/{id}")
def delete_project_specification(id: str, db: Session = Depends(get_db)):
    spec = db.query(ProjectSpecification).filter(ProjectSpecification.id == id).first()
    if spec:
        db.delete(spec)
        db.commit()
    return {"ok": True}

@app.get("/api/project-instructions")
def get_project_instructions(db: Session = Depends(get_db)):
    items = db.query(ProjectInstruction).order_by(desc(ProjectInstruction.created_at)).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

@app.post("/api/project-instructions")
def save_project_instruction(data: dict, db: Session = Depends(get_db)):
    ins_id = data.get("id") or f"INS-{int(time.time() * 1000) % 10000:04d}"
    ins = db.query(ProjectInstruction).filter(ProjectInstruction.id == ins_id).first()
    if not ins:
        ins = ProjectInstruction(id=ins_id)
        db.add(ins)

    ins.description = data.get("description", "")
    ins.project = data.get("project", "")
    ins.project_id = data.get("projectId", "")
    ins.isbn = data.get("isbn", "")
    ins.client = data.get("client", "")
    ins.file = data.get("file", "")
    ins.posted_by = data.get("postedBy", "Admin")
    ins.created_at = data.get("createdAt", datetime.utcnow().isoformat())
    ins.status = data.get("status", "Active")
    ins.priority = data.get("priority", "Normal")
    ins.department = data.get("department", "Production")

    db.commit()
    db.refresh(ins)
    return {"ok": True, "item": ins.to_dict()}

@app.delete("/api/project-instructions/{id}")
def delete_project_instruction(id: str, db: Session = Depends(get_db)):
    ins = db.query(ProjectInstruction).filter(ProjectInstruction.id == id).first()
    if ins:
        db.delete(ins)
        db.commit()
    return {"ok": True}

@app.get("/api/clients")
def get_clients(db: Session = Depends(get_db)):
    items = db.query(Client).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

@app.post("/api/clients")
def save_client(data: dict, db: Session = Depends(get_db)):
    cli_id = data.get("id") or f"CLI-{int(time.time() * 1000) % 10000}"
    cli = db.query(Client).filter(Client.id == cli_id).first()
    if not cli:
        cli = Client(id=cli_id)
        db.add(cli)
    cli.name = data.get("name", "")
    cli.code = data.get("code", "")
    cli.subtitle = data.get("subtitle", "")
    cli.location = data.get("location", "")
    cli.industry = data.get("industry", "")
    cli.titles_count = str(data.get("titlesCount", "0"))
    cli.stages_count = str(data.get("stagesCount", "0"))
    cli.email = data.get("email", "")
    cli.contact_person = data.get("contactPerson", "")
    cli.status = data.get("status", "Active")
    db.commit()
    db.refresh(cli)
    return {"ok": True, "item": cli.to_dict()}

@app.get("/api/feedback")
def get_feedbacks(db: Session = Depends(get_db)):
    items = db.query(Feedback).order_by(desc(Feedback.created_at)).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

@app.post("/api/feedback")
def save_feedback(data: dict, db: Session = Depends(get_db)):
    fb_id = data.get("id") or f"FB-{int(time.time() * 1000) % 10000}"
    fb = db.query(Feedback).filter(Feedback.id == fb_id).first()
    if not fb:
        fb = Feedback(id=fb_id)
        db.add(fb)
    fb.client = data.get("client", "")
    fb.isbn = data.get("isbn", "")
    fb.project = data.get("project", "")
    fb.feature = data.get("feature", "positive")
    fb.category = data.get("category", "")
    fb.rating = int(data.get("rating", 5))
    fb.title = data.get("title", "")
    fb.comment = data.get("comment", "")
    fb.employee = data.get("employee", "")
    fb.employee_id = data.get("employeeId", "")
    fb.channel = data.get("channel", "")
    fb.date = data.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
    fb.status = data.get("status", "Acknowledged")
    fb.rca = data.get("rca", "")
    fb.capa = data.get("capa", "")
    db.commit()
    return {"ok": True, "item": fb.to_dict()}

@app.get("/api/projects")
def get_projects(db: Session = Depends(get_db)):
    items = db.query(Project).all()
    return {"ok": True, "items": [i.to_dict() for i in items]}

# ==========================================
# 10. Peter Lang Excel API Endpoints
# ==========================================

@app.get("/api/excel/health")
def excel_health():
    return excel_service.get_summary()

@app.get("/api/excel/summary")
def excel_summary():
    return excel_service.get_summary()

@app.get("/api/excel/sheet")
def excel_sheet(name: str = "UPDATED INVENTORY", page: int = 1, size: int = 25, search: str = ""):
    return excel_service.get_sheet_data(name, page, size, search)

@app.post("/api/excel/update")
def excel_update(body: dict):
    return excel_service.update_cell(
        sheet_name=str(body.get("sheet", "UPDATED INVENTORY")),
        row_number=int(body.get("rowNumber", 2)),
        column=int(body.get("column", 0)),
        value=str(body.get("value", ""))
    )

@app.post("/api/excel/reset-edits")
def excel_reset():
    return excel_service.reset_all_edits()

@app.get("/api/excel/export")
def excel_export(name: str = "UPDATED INVENTORY"):
    csv_bytes = excel_service.export_csv(name)
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{name}.csv"'}
    )

# ==========================================
# 11. Temp File Store & NAS Operations
# ==========================================

@app.get("/api/temp-status")
@app.get("/temp-status")
def get_temp_status(ownerId: str = ""):
    return {"ok": True, "status": store.get_status(ownerId)}

@app.get("/api/temp-files")
@app.get("/temp-files")
def get_temp_files(ownerId: str = "", role: Optional[str] = None):
    return {"ok": True, "files": store.list_files(ownerId, role)}

@app.get("/api/temp-download")
@app.get("/temp-download")
def temp_download(id: str, ownerId: Optional[str] = None, role: Optional[str] = None):
    item = store.get_file(id, ownerId)
    if not item:
        raise HTTPException(status_code=404, detail="File not found or expired")
    orig_name = item["original_name"]
    name_lower = orig_name.lower()
    if role == "book" and ("_cvr" in name_lower or "cvr" in name_lower):
        raise HTTPException(status_code=403, detail="Role restricted from this deliverable")
    if role == "cover" and ("_txt" in name_lower or "txt" in name_lower):
        raise HTTPException(status_code=403, detail="Role restricted from this deliverable")
    file_path = Path(item["path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Stored file missing")
    return FileResponse(
        path=str(file_path),
        filename=orig_name,
        media_type=item.get("content_type", "application/octet-stream")
    )

@app.post("/api/temp-delete-all")
@app.post("/temp-delete-all")
def temp_delete_all(body: dict):
    owner_id = body.get("ownerId", "default")
    deleted_rows = body.get("deletedRows", [])
    count = store.delete_all(owner_id)

    if deleted_rows:
        all_recents = read_json(RECENTS_FILE, [])
        batch = {
            "id": f"REC-{int(time.time() * 1000)}",
            "ownerId": owner_id,
            "deletedAt": time.time(),
            "rowCount": len(deleted_rows),
            "rows": deleted_rows
        }
        all_recents.insert(0, batch)
        all_recents = all_recents[:100]
        write_json(RECENTS_FILE, all_recents)

    return {"ok": True, "deletedCount": count}

@app.get("/api/recents")
@app.get("/recents")
def get_recents(ownerId: Optional[str] = None):
    all_recents = read_json(RECENTS_FILE, [])
    if ownerId:
        all_recents = [b for b in all_recents if b.get("ownerId") == ownerId]
    return {"ok": True, "batches": all_recents}

@app.post("/api/prepare-temp")
@app.post("/prepare-temp")
def prepare_temp(body: dict):
    isbn = body.get("isbn", "")
    owner_id = body.get("ownerId", "default")
    role = body.get("role")
    if not isbn:
        raise HTTPException(status_code=400, detail="ISBN required")
    res = store.materialize_to_input(isbn, owner_id, INPUT_ROOT, role)
    return {"ok": True, **res}

@app.get("/api/input-files")
@app.get("/input-files")
def get_input_files(isbn: str):
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
    return {"ok": True, "isbn": isbn, "folder": str(target_dir), "files": files}

@app.get("/api/open-input-folder")
@app.get("/open-input-folder")
def open_input_folder(isbn: str):
    target_dir = INPUT_ROOT / str(isbn)
    target_dir.mkdir(parents=True, exist_ok=True)
    if hasattr(os, "startfile"):
        os.startfile(str(target_dir))
    return {"ok": True, "folder": str(target_dir)}

@app.get("/api/download-file")
@app.get("/download-file")
def download_input_file(isbn: str, name: str):
    target = INPUT_ROOT / str(isbn) / name
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    media_type = "application/pdf" if name.endswith(".pdf") else "application/octet-stream"
    return FileResponse(path=str(target), filename=name, media_type=media_type)

@app.post("/api/upload-completed")
@app.post("/upload-completed")
async def upload_completed(request: Request, isbn: str, filename: str):
    if not isbn or not filename:
        raise HTTPException(status_code=400, detail="isbn and filename required")

    dest_input = INPUT_ROOT / str(isbn) / filename
    dest_input.parent.mkdir(parents=True, exist_ok=True)
    dest_output = OUTPUT_ROOT / str(isbn) / filename
    dest_output.parent.mkdir(parents=True, exist_ok=True)

    bytes_written = 0
    with open(dest_input, "wb") as f:
        async for chunk in request.stream():
            f.write(chunk)
            bytes_written += len(chunk)

    try:
        shutil.copy2(dest_input, dest_output)
    except Exception:
        pass

    return {
        "ok": True,
        "isbn": isbn,
        "filename": filename,
        "bytesWritten": bytes_written,
        "inputPath": str(dest_input),
        "outputPath": str(dest_output)
    }

@app.post("/api/network/find")
@app.post("/network-find")
def network_find(body: dict):
    source = body.get("source", "")
    isbns_raw = body.get("isbns", [])
    if isinstance(isbns_raw, str):
        wanted_isbns = set(s.strip() for s in re.split(r"[\r\n,;\t\s]+", isbns_raw) if s.strip())
    else:
        wanted_isbns = set(str(x).strip() for x in isbns_raw if str(x).strip())

    if not source or not Path(source).exists():
        raise HTTPException(status_code=400, detail=f"Source directory unreachable: {source}")

    found = []
    found_isbns = set()
    src_path = Path(source)

    for root, dirs, files in os.walk(src_path):
        for d in dirs:
            for wanted in wanted_isbns:
                if d == wanted or d.startswith(f"{wanted}_") or d.startswith(f"{wanted}."):
                    found.append({"isbn": wanted, "kind": "Folder", "path": str(Path(root) / d), "name": d})
                    found_isbns.add(wanted)

        for f in files:
            stem = Path(f).stem
            for wanted in wanted_isbns:
                if stem == wanted or stem.startswith(f"{wanted}_") or stem.startswith(f"{wanted}."):
                    found.append({"isbn": wanted, "kind": "File", "path": str(Path(root) / f), "name": f})
                    found_isbns.add(wanted)

    missing = [isbn for isbn in wanted_isbns if isbn not in found_isbns]
    return {"ok": True, "found": found, "missing": missing}

@app.post("/api/network/copy")
@app.post("/network-copy")
def network_copy(body: dict):
    matches = body.get("matches", [])
    if not matches and "item" in body:
        matches = [body["item"]]
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
            return JSONResponse(status_code=400, content={"ok": False, "error": str(e), "staged": staged})

    return {
        "ok": True,
        "stagedCount": len(staged),
        "totalBytes": total_bytes,
        "items": staged
    }

@app.post("/api/export-report")
@app.post("/export-report")
def export_report_xlsx(body: dict):
    rows = body.get("rows", [])
    emp_id = body.get("employeeId", "Employee")
    excel_bytes = xlsx_builder.make_report_xlsx(rows)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{emp_id}_Production_Report.xlsx"'}
    )

@app.get("/state")
def get_legacy_state():
    rows = read_json(STATE_FILE, [])
    return {"ok": True, "rows": rows}

@app.post("/state")
def set_legacy_state(body: dict):
    incoming = body if isinstance(body, list) else body.get("rows", [])
    write_json(STATE_FILE, incoming)
    return {"ok": True, "count": len(incoming), "rows": incoming}

# ==========================================
# 12. Production Frontend Static Files & SPA Fallback
# ==========================================

# Mount assets if dist exists
if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa_frontend(full_path: str):
    # Check if a specific file exists in dist
    candidate = DIST_DIR / full_path
    if candidate.exists() and candidate.is_file():
        return FileResponse(str(candidate))

    # Otherwise fallback to index.html for React SPA
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    return JSONResponse(
        status_code=200,
        content={"message": "FileFlow server is running. Build the frontend using 'npm run build' to serve the React application."}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("FILEFLOW_PORT", 8000))
    print(f"FileFlow central server starting on http://0.0.0.0:{port}")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
