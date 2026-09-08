import os
import hashlib
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from backend.database import get_db, User, Employee

SECRET_KEY = os.environ.get("FILEFLOW_SECRET_KEY", "fileflow-lan-secret-key-2026-supersecure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def legacy_sha256_hash(emp_id: str, password: str) -> str:
    clean_id = (emp_id or "").strip().lower()
    return hashlib.sha256(f"{clean_id}|{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str, emp_id: str = "") -> bool:
    if not hashed_password:
        return False
    # Check if it is a bcrypt hash
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False
    # Check legacy sha256 hash or plain comparison if needed
    if emp_id and legacy_sha256_hash(emp_id, plain_password) == hashed_password:
        return True
    return plain_password == hashed_password

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token or str(token).strip() in ("undefined", "null", ""):
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = str(
            payload.get("sub")
            or payload.get("empId")
            or payload.get("employeeId")
            or payload.get("id")
            or payload.get("username")
            or ""
        ).strip()
        if not sub or sub in ("undefined", "null"):
            return None
    except JWTError:
        return None

    # Case-insensitive resolution against username, id, emp_id, gi_emp_id, or name
    user = db.query(User).filter(
        or_(
            func.lower(User.username) == sub.lower(),
            func.lower(User.emp_id) == sub.lower(),
            func.lower(User.gi_emp_id) == sub.lower(),
            func.lower(User.id) == sub.lower(),
            func.lower(User.name) == sub.lower()
        )
    ).first()

    if not user and sub.lower() in ("admin", "administrator"):
        user = db.query(User).filter(func.lower(User.username) == "admin").first()

    if not user:
        employee = db.query(Employee).filter(
            or_(
                func.lower(Employee.emp_id) == sub.lower(),
                func.lower(Employee.gi_emp_id) == sub.lower(),
                func.lower(Employee.name) == sub.lower()
            )
        ).first()
        if employee:
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

    return user

def require_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
