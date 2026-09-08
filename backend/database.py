import os
import json
from datetime import datetime
from pathlib import Path
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database URL: Supports PostgreSQL (production) and SQLite (testing/fallback)
# Example PostgreSQL: postgresql+psycopg://user:password@localhost:5432/fileflow
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATA_DIR / 'fileflow.db'}")

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Enable WAL mode for SQLite for safe multi-user concurrent reads/writes
if is_sqlite:
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------- Models -----------------

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True) # username / empId
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(128), nullable=False)
    role = Column(String(64), default="Employee", nullable=False) # Admin, Project Admin, Employee, QC, QAG, etc.
    designation = Column(String(128), default="")
    department = Column(String(128), default="Production")
    email = Column(String(128), default="")
    emp_id = Column(String(64), default="", index=True)
    gi_emp_id = Column(String(64), default="", index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "role": self.role,
            "designation": self.designation,
            "department": self.department,
            "email": self.email,
            "empId": self.emp_id or self.username,
            "giEmpId": self.gi_emp_id,
            "isActive": self.is_active
        }


class Employee(Base):
    __tablename__ = "employees"

    emp_id = Column(String(64), primary_key=True, index=True)
    gi_emp_id = Column(String(64), default="", index=True)
    name = Column(String(128), nullable=False, index=True)
    designation = Column(String(128), default="")
    department = Column(String(128), default="Production")
    office_email = Column(String(128), default="")
    personal_email = Column(String(128), default="")
    phone = Column(String(64), default="")
    address = Column(Text, default="")
    permanent_address = Column(Text, default="")
    pan_card = Column(String(64), default="")
    aadhaar_number = Column(String(64), default="")
    emergency_contact = Column(String(128), default="")
    blood_group = Column(String(32), default="")
    dob = Column(String(64), default="")
    doj = Column(String(64), default="")
    qualification = Column(String(128), default="")
    experience = Column(String(64), default="")
    gender = Column(String(32), default="")
    device_number = Column(String(64), default="")
    main_door_access = Column(String(32), default="No")
    left_door_access = Column(String(32), default="No")
    status = Column(String(32), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "empId": self.emp_id,
            "giEmpId": self.gi_emp_id,
            "name": self.name,
            "designation": self.designation,
            "department": self.department,
            "officeEmail": self.office_email,
            "personalEmail": self.personal_email,
            "phone": self.phone,
            "address": self.address,
            "permanentAddress": self.permanent_address,
            "panCard": self.pan_card,
            "aadhaarNumber": self.aadhaar_number,
            "emergencyContact": self.emergency_contact,
            "bloodGroup": self.blood_group,
            "dob": self.dob,
            "doj": self.doj,
            "qualification": self.qualification,
            "experience": self.experience,
            "gender": self.gender,
            "deviceNumber": self.device_number,
            "mainDoorAccess": self.main_door_access,
            "leftDoorAccess": self.left_door_access,
            "status": self.status
        }


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(String(128), primary_key=True, index=True)
    isbn = Column(String(64), nullable=False, index=True)
    employee = Column(String(128), default="", index=True)
    employee_id = Column(String(64), default="", index=True)
    employee_code = Column(String(64), default="", index=True)
    employee_alt_ids = Column(Text, default="[]") # JSON list
    team = Column(String(128), default="")
    department = Column(String(128), default="Production")
    work_type = Column(String(64), default="book") # book, cover, qc, qag
    role = Column(String(64), default="DEVELOPER")
    status = Column(String(64), default="Allocated", index=True) # Allocated, WIP, Complete, Rework, Reject, Hold
    completed = Column(Integer, default=0)
    rejected = Column(Integer, default=0)
    hold = Column(Integer, default=0)
    status_reason = Column(Text, default="")
    allocated = Column(Integer, default=1)
    allocated_at = Column(Float, default=0.0)
    started = Column(Float, default=0.0)
    ended = Column(Float, default=0.0)
    trim_size = Column(String(64), default="")
    page_count = Column(String(64), default="")
    specs_entered_by = Column(String(128), default="")
    uploaded = Column(String(255), default="")
    saved_path = Column(String(512), default="")
    download_saved_path = Column(String(512), default="")
    project_id = Column(String(64), default="PRJ-PETERLANG")
    project_name = Column(String(255), default="")
    project = Column(String(255), default="")
    chapter = Column(String(128), default="Full Title")
    priority = Column(String(32), default="Normal")
    due_date = Column(String(64), default="")
    due = Column(String(64), default="")
    date = Column(String(64), default="")
    allocation_mode = Column(String(128), default="Category Allocation")
    workflow_stage = Column(String(128), default="Based on Employee Role")
    batch_id = Column(String(128), default="", index=True)
    batch_file = Column(String(255), default="")
    notify_employee = Column(Boolean, default=True)
    posted_by = Column(String(128), default="Administrator")
    posted_to = Column(String(128), default="")
    remark = Column(Text, default="")
    status_updated_at = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        try:
            alt_ids = json.loads(self.employee_alt_ids) if self.employee_alt_ids else []
        except Exception:
            alt_ids = []
        return {
            "id": self.id,
            "isbn": self.isbn,
            "employee": self.employee,
            "employeeId": self.employee_id,
            "employeeCode": self.employee_code,
            "employeeAltIds": alt_ids,
            "team": self.team,
            "department": self.department,
            "workType": self.work_type,
            "role": self.role,
            "status": self.status,
            "completed": self.completed,
            "rejected": self.rejected,
            "hold": self.hold,
            "statusReason": self.status_reason,
            "allocated": self.allocated,
            "allocatedAt": self.allocated_at,
            "started": self.started,
            "ended": self.ended,
            "trimSize": self.trim_size,
            "pageCount": self.page_count,
            "specsEnteredBy": self.specs_entered_by,
            "uploaded": self.uploaded,
            "savedPath": self.saved_path,
            "downloadSavedPath": self.download_saved_path,
            "projectId": self.project_id,
            "projectName": self.project_name or f"Peter Lang Title ({self.isbn})",
            "project": self.project or self.project_name,
            "chapter": self.chapter,
            "priority": self.priority,
            "dueDate": self.due_date,
            "due": self.due or self.due_date,
            "date": self.date,
            "allocationMode": self.allocation_mode,
            "workflowStage": self.workflow_stage,
            "batchId": self.batch_id,
            "batchFile": self.batch_file,
            "notifyEmployee": self.notify_employee,
            "postedBy": self.posted_by,
            "postedTo": self.posted_to,
            "remark": self.remark,
            "statusUpdatedAt": self.status_updated_at
        }


class AllocationHistory(Base):
    __tablename__ = "allocation_history"

    id = Column(String(128), primary_key=True)
    batch_id = Column(String(128), default="")
    date = Column(String(64), default="")
    file_name = Column(String(255), default="")
    total_files = Column(Integer, default=0)
    mode = Column(String(128), default="")
    status = Column(String(64), default="Completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "batchId": self.batch_id,
            "date": self.date,
            "fileName": self.file_name,
            "totalFiles": self.total_files,
            "mode": self.mode,
            "status": self.status
        }


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(128), primary_key=True)
    title = Column(String(255), default="")
    type = Column(String(64), default="notification")
    category = Column(String(64), default="General")
    status = Column(String(64), default="Update")
    isbn = Column(String(64), default="", index=True)
    project_id = Column(String(64), default="PRJ-PETERLANG")
    project_name = Column(String(255), default="")
    employee_id = Column(String(64), default="", index=True)
    employee_name = Column(String(128), default="")
    recipient_id = Column(String(64), default="", index=True)
    recipient_name = Column(String(128), default="")
    target_employee_ids = Column(Text, default="[]") # JSON list
    target_roles = Column(Text, default="[]") # JSON list
    reason = Column(Text, default="")
    remarks = Column(Text, default="")
    section = Column(String(64), default="Notifications")
    read = Column(Boolean, default=False, index=True)
    created_at = Column(Float, default=0.0) # Timestamp ms or sec

    def to_dict(self):
        try:
            t_ids = json.loads(self.target_employee_ids) if self.target_employee_ids else []
        except Exception:
            t_ids = []
        try:
            t_roles = json.loads(self.target_roles) if self.target_roles else []
        except Exception:
            t_roles = []
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "category": self.category,
            "status": self.status,
            "isbn": self.isbn,
            "projectId": self.project_id,
            "projectName": self.project_name,
            "employeeId": self.employee_id,
            "employeeName": self.employee_name,
            "recipientId": self.recipient_id,
            "recipientName": self.recipient_name,
            "targetEmployeeIds": t_ids,
            "targetRoles": t_roles,
            "reason": self.reason,
            "remarks": self.remarks,
            "section": self.section,
            "read": self.read,
            "createdAt": self.created_at
        }


class InternalMail(Base):
    __tablename__ = "internal_mail"

    id = Column(String(128), primary_key=True)
    sender = Column(String(128), default="")
    sender_email = Column(String(128), default="")
    from_id = Column(String(64), default="", index=True)
    from_name = Column(String(128), default="")
    from_role = Column(String(64), default="")
    to_id = Column(String(64), default="", index=True)
    to_name = Column(String(128), default="")
    to_role = Column(String(64), default="")
    to_alternate_ids = Column(Text, default="[]") # JSON list
    assignee = Column(String(128), default="")
    assignee_id = Column(String(64), default="", index=True)
    subject = Column(String(255), default="")
    title = Column(String(255), default="")
    project = Column(String(255), default="")
    isbn = Column(String(64), default="")
    chapter = Column(String(128), default="")
    category = Column(String(64), default="General")
    priority = Column(String(32), default="Normal")
    folder = Column(String(64), default="Inbox")
    status = Column(String(64), default="Inbox")
    body = Column(Text, default="")
    attachments = Column(Text, default="[]") # JSON list
    timeline = Column(Text, default="[]") # JSON list
    notes = Column(Text, default="[]") # JSON list
    draft = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)
    starred = Column(Boolean, default=False)
    read_by = Column(Text, default="[]") # JSON list
    deleted_by = Column(Text, default="[]") # JSON list
    created_at = Column(Float, default=0.0)

    def to_dict(self):
        try: alt_ids = json.loads(self.to_alternate_ids) if self.to_alternate_ids else []
        except Exception: alt_ids = []
        try: att = json.loads(self.attachments) if self.attachments else []
        except Exception: att = []
        try: tl = json.loads(self.timeline) if self.timeline else []
        except Exception: tl = []
        try: nt = json.loads(self.notes) if self.notes else []
        except Exception: nt = []
        try: rb = json.loads(self.read_by) if self.read_by else []
        except Exception: rb = []
        try: db = json.loads(self.deleted_by) if self.deleted_by else []
        except Exception: db = []

        return {
            "id": self.id,
            "sender": self.sender or self.from_name,
            "senderEmail": self.sender_email,
            "fromId": self.from_id,
            "fromName": self.from_name,
            "fromRole": self.from_role,
            "toId": self.to_id,
            "toName": self.to_name,
            "toRole": self.to_role,
            "toAlternateIds": alt_ids,
            "assignee": self.assignee,
            "assigneeId": self.assignee_id,
            "subject": self.subject,
            "title": self.title or self.subject,
            "project": self.project,
            "isbn": self.isbn,
            "chapter": self.chapter,
            "category": self.category,
            "priority": self.priority,
            "folder": self.folder,
            "status": self.status,
            "body": self.body,
            "attachments": att,
            "hasAttachment": len(att) > 0,
            "timeline": tl,
            "notes": nt,
            "draft": self.draft,
            "resolved": self.resolved,
            "starred": self.starred,
            "readBy": rb,
            "deletedBy": db,
            "createdAt": self.created_at
        }


class MailCorrection(Base):
    __tablename__ = "mail_corrections"

    id = Column(String(128), primary_key=True)
    project_id = Column(String(64), default="")
    project_name = Column(String(255), default="")
    isbn = Column(String(64), default="", index=True)
    chapter = Column(String(128), default="")
    client = Column(String(128), default="")
    email_sender = Column(String(128), default="")
    email_subject = Column(String(255), default="")
    correction_round = Column(String(64), default="R1")
    description = Column(Text, default="")
    assigned_employee_id = Column(String(64), default="", index=True)
    assigned_employee = Column(String(128), default="")
    priority = Column(String(32), default="Normal")
    received_at = Column(String(64), default="")
    due_at = Column(String(64), default="")
    status = Column(String(64), default="Yet to Allocate", index=True)
    time_spent = Column(String(64), default="00:00:00")
    internal_remarks = Column(Text, default="")
    attachments = Column(Text, default="[]") # JSON list
    corrected_files = Column(Text, default="[]") # JSON list
    qc_feedback = Column(Text, default="[]") # JSON list
    messages = Column(Text, default="[]") # JSON list
    activity = Column(Text, default="[]") # JSON list
    created_date = Column(String(64), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        try: att = json.loads(self.attachments) if self.attachments else []
        except Exception: att = []
        try: cf = json.loads(self.corrected_files) if self.corrected_files else []
        except Exception: cf = []
        try: fb = json.loads(self.qc_feedback) if self.qc_feedback else []
        except Exception: fb = []
        try: msg = json.loads(self.messages) if self.messages else []
        except Exception: msg = []
        try: act = json.loads(self.activity) if self.activity else []
        except Exception: act = []

        return {
            "id": self.id,
            "projectId": self.project_id,
            "projectName": self.project_name,
            "isbn": self.isbn,
            "chapter": self.chapter,
            "client": self.client,
            "emailSender": self.email_sender,
            "emailSubject": self.email_subject,
            "correctionRound": self.correction_round,
            "description": self.description,
            "assignedEmployeeId": self.assigned_employee_id,
            "assignedEmployee": self.assigned_employee,
            "priority": self.priority,
            "receivedAt": self.received_at,
            "dueAt": self.due_at,
            "status": self.status,
            "timeSpent": self.time_spent,
            "internalRemarks": self.internal_remarks,
            "attachments": att,
            "correctedFiles": cf,
            "qcFeedback": fb,
            "messages": msg,
            "activity": act,
            "createdDate": self.created_date
        }


class CustomerQuery(Base):
    __tablename__ = "customer_queries"

    id = Column(String(128), primary_key=True)
    isbn = Column(String(64), default="", index=True)
    project = Column(String(255), default="")
    project_id = Column(String(64), default="")
    client = Column(String(128), default="")
    type = Column(String(64), default="Technical Query")
    priority = Column(String(32), default="Medium")
    assigned_to = Column(String(128), default="")
    employee_id = Column(String(64), default="", index=True)
    created_at = Column(String(64), default="")
    status = Column(String(64), default="Open", index=True)
    subject = Column(String(255), default="")
    description = Column(Text, default="")
    remarks = Column(Text, default="")

    def to_dict(self):
        return {
            "id": self.id,
            "isbn": self.isbn,
            "project": self.project,
            "projectId": self.project_id,
            "client": self.client,
            "type": self.type,
            "priority": self.priority,
            "assignedTo": self.assigned_to,
            "employeeId": self.employee_id,
            "createdAt": self.created_at,
            "status": self.status,
            "subject": self.subject,
            "description": self.description,
            "remarks": self.remarks
        }


class ProjectSpecification(Base):
    __tablename__ = "project_specifications"

    id = Column(String(128), primary_key=True)
    project_id = Column(String(64), default="")
    project_name = Column(String(255), default="")
    client_name = Column(String(128), default="")
    author_name = Column(String(128), default="")
    isbn = Column(String(64), default="", index=True)
    project_type = Column(String(64), default="Book Production")
    priority = Column(String(32), default="Medium")
    start_date = Column(String(64), default="")
    delivery_date = Column(String(64), default="")
    reference = Column(String(128), default="")
    description = Column(Text, default="")
    services = Column(Text, default="[]") # JSON list
    client_instructions = Column(Text, default="")
    internal_notes = Column(Text, default="")
    revision_instructions = Column(Text, default="")
    revisions = Column(String(64), default="")
    delivery_format = Column(String(128), default="")
    final_outputs = Column(String(128), default="")
    quality_notes = Column(Text, default="")
    attachments = Column(Text, default="[]") # JSON list
    assigned_to = Column(String(128), default="")
    status = Column(String(64), default="Active")
    created_by = Column(String(128), default="")
    created_at = Column(Float, default=0.0)
    updated_by = Column(String(128), default="")
    updated_at = Column(Float, default=0.0)

    def to_dict(self):
        try: srv = json.loads(self.services) if self.services else []
        except Exception: srv = []
        try: att = json.loads(self.attachments) if self.attachments else []
        except Exception: att = []
        return {
            "id": self.id,
            "projectId": self.project_id,
            "projectName": self.project_name,
            "clientName": self.client_name,
            "authorName": self.author_name,
            "isbn": self.isbn,
            "projectType": self.project_type,
            "priority": self.priority,
            "startDate": self.start_date,
            "deliveryDate": self.delivery_date,
            "reference": self.reference,
            "description": self.description,
            "services": srv,
            "clientInstructions": self.client_instructions,
            "internalNotes": self.internal_notes,
            "revisionInstructions": self.revision_instructions,
            "revisions": self.revisions,
            "deliveryFormat": self.delivery_format,
            "finalOutputs": self.final_outputs,
            "qualityNotes": self.quality_notes,
            "attachments": att,
            "assignedTo": self.assigned_to,
            "status": self.status,
            "createdBy": self.created_by,
            "createdAt": self.created_at,
            "updatedBy": self.updated_by,
            "updatedAt": self.updated_at
        }


class ProjectInstruction(Base):
    __tablename__ = "project_instructions"

    id = Column(String(128), primary_key=True)
    description = Column(Text, default="")
    project = Column(String(255), default="")
    project_id = Column(String(64), default="")
    isbn = Column(String(64), default="", index=True)
    client = Column(String(128), default="")
    file = Column(String(255), default="")
    posted_by = Column(String(128), default="")
    created_at = Column(String(64), default="")
    status = Column(String(64), default="Active")
    priority = Column(String(32), default="Normal")
    department = Column(String(128), default="Production")

    def to_dict(self):
        return {
            "id": self.id,
            "description": self.description,
            "project": self.project,
            "projectId": self.project_id,
            "isbn": self.isbn,
            "client": self.client,
            "file": self.file,
            "postedBy": self.posted_by,
            "createdAt": self.created_at,
            "status": self.status,
            "priority": self.priority,
            "department": self.department
        }


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True) # PRJ001
    project_id = Column(Integer, default=0)
    isbn = Column(String(64), default="", index=True)
    name = Column(String(255), default="")
    customer = Column(String(128), default="")
    unit = Column(String(32), default="DTPM")
    stage = Column(String(128), default="Artwork 1")
    department = Column(String(128), default="Production")
    priority = Column(String(32), default="Medium")
    status = Column(String(64), default="In Progress")
    progress = Column(Integer, default=0)
    due = Column(String(64), default="")
    manager = Column(String(128), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "projectId": self.project_id,
            "isbn": self.isbn,
            "name": self.name,
            "customer": self.customer,
            "unit": self.unit,
            "stage": self.stage,
            "department": self.department,
            "priority": self.priority,
            "status": self.status,
            "progress": self.progress,
            "due": self.due,
            "manager": self.manager
        }


class Client(Base):
    __tablename__ = "clients"

    id = Column(String(64), primary_key=True)
    code = Column(String(32), default="")
    name = Column(String(128), nullable=False)
    subtitle = Column(String(255), default="")
    location = Column(String(128), default="")
    industry = Column(String(128), default="")
    titles_count = Column(String(64), default="0")
    stages_count = Column(String(64), default="0")
    email = Column(String(128), default="")
    contact_person = Column(String(128), default="")
    status = Column(String(64), default="Active")
    master_file_name = Column(String(255), default="")
    master_file_size = Column(String(64), default="")
    uploaded_date = Column(String(64), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "subtitle": self.subtitle,
            "location": self.location,
            "industry": self.industry,
            "titlesCount": self.titles_count,
            "stagesCount": self.stages_count,
            "email": self.email,
            "contactPerson": self.contact_person,
            "status": self.status,
            "masterFileName": self.master_file_name,
            "masterFileSize": self.master_file_size,
            "uploadedDate": self.uploaded_date
        }


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String(64), primary_key=True)
    client = Column(String(128), default="")
    isbn = Column(String(64), default="", index=True)
    project = Column(String(255), default="")
    feature = Column(String(32), default="positive")
    category = Column(String(128), default="")
    rating = Column(Integer, default=5)
    title = Column(String(255), default="")
    comment = Column(Text, default="")
    employee = Column(String(128), default="")
    employee_id = Column(String(64), default="", index=True)
    channel = Column(String(128), default="")
    date = Column(String(64), default="")
    status = Column(String(64), default="Acknowledged")
    rca = Column(Text, default="")
    capa = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "client": self.client,
            "isbn": self.isbn,
            "project": self.project,
            "feature": self.feature,
            "category": self.category,
            "rating": self.rating,
            "title": self.title,
            "comment": self.comment,
            "employee": self.employee,
            "employeeId": self.employee_id,
            "channel": self.channel,
            "date": self.date,
            "status": self.status,
            "rca": self.rca,
            "capa": self.capa
        }


class QAGReport(Base):
    __tablename__ = "qag_reports"

    id = Column(String(64), primary_key=True)
    isbn = Column(String(64), nullable=False, index=True)
    qag_id = Column(String(64), default="")
    qag_employee = Column(String(128), default="")
    auditor_id = Column(String(64), default="")
    auditor_name = Column(String(128), default="")
    developer = Column(String(128), default="")
    developer_id = Column(String(64), default="")
    graphics = Column(String(128), default="")
    graphics_id = Column(String(64), default="")
    qc = Column(String(128), default="")
    qc_id = Column(String(64), default="")
    score = Column(String(32), default="100%")
    first_time_right = Column(String(32), default="Yes")
    defects = Column(Integer, default=0)
    findings = Column(Text, default="")
    status = Column(String(64), default="Approved")
    submitted_date = Column(String(64), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "isbn": self.isbn,
            "qagId": self.qag_id,
            "qagEmployee": self.qag_employee,
            "auditorId": self.auditor_id,
            "auditorName": self.auditor_name,
            "developer": self.developer,
            "developerId": self.developer_id,
            "developerName": self.developer,
            "graphics": self.graphics,
            "graphicsId": self.graphics_id,
            "graphicsName": self.graphics,
            "qc": self.qc,
            "qcId": self.qc_id,
            "qcName": self.qc,
            "score": self.score,
            "firstTimeRight": self.first_time_right,
            "defects": self.defects,
            "findings": self.findings,
            "status": self.status,
            "submittedDate": self.submitted_date
        }


def init_db():
    Base.metadata.create_all(bind=engine)
