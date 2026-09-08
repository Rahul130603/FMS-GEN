import os
import sqlite3
import time
import shutil
import uuid
from pathlib import Path

DEFAULT_TTL_HOURS = 24
DEFAULT_QUOTA_BYTES = 7 * 1024 * 1024 * 1024  # 7 GB
CHUNK_SIZE = 4 * 1024 * 1024  # 4 MB

class TempFileStore:
    def __init__(self, db_path="data/fileflow_temp_files.sqlite3", store_dir="temp_file_store"):
        self.db_path = Path(db_path)
        self.store_dir = Path(store_dir)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.store_dir.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(str(self.db_path), timeout=30.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS temp_files (
                    id TEXT PRIMARY KEY,
                    original_name TEXT NOT NULL,
                    stored_name TEXT NOT NULL,
                    path TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    content_type TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    purpose TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    expires_at REAL NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_owner ON temp_files(owner_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_expires ON temp_files(expires_at)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_purpose ON temp_files(purpose)")
            conn.commit()

    def cleanup_expired(self):
        now = time.time()
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, stored_name FROM temp_files WHERE expires_at < ?", (now,))
            expired = cursor.fetchall()
            for row in expired:
                file_path = self.store_dir / row["stored_name"]
                try:
                    if file_path.exists():
                        if file_path.is_dir():
                            shutil.rmtree(file_path)
                        else:
                            file_path.unlink()
                except Exception:
                    pass
            cursor.execute("DELETE FROM temp_files WHERE expires_at < ?", (now,))
            conn.commit()
            return len(expired)

    def get_owner_usage(self, owner_id):
        self.cleanup_expired()
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COALESCE(SUM(size_bytes), 0) as total FROM temp_files WHERE owner_id = ?", (owner_id,))
            row = cursor.fetchone()
            return row["total"] if row else 0

    def get_status(self, owner_id):
        usage = self.get_owner_usage(owner_id)
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM temp_files WHERE owner_id = ?", (owner_id,))
            count = cursor.fetchone()["count"]
        return {
            "ownerId": owner_id,
            "fileCount": count,
            "totalSizeBytes": usage,
            "total_bytes": usage,
            "count": count,
            "quotaBytes": DEFAULT_QUOTA_BYTES,
            "availableBytes": max(0, DEFAULT_QUOTA_BYTES - usage),
            "usagePercent": round((usage / DEFAULT_QUOTA_BYTES) * 100, 2)
        }


    def store_file(self, src_path, owner_id, purpose, ttl_hours=DEFAULT_TTL_HOURS):
        self.cleanup_expired()
        src = Path(src_path)
        if not src.exists():
            raise FileNotFoundError(f"Source path not found: {src_path}")

        is_dir = src.is_dir()
        if is_dir:
            size_bytes = sum(f.stat().st_size for f in src.rglob('*') if f.is_file())
        else:
            size_bytes = src.stat().st_size

        cur_usage = self.get_owner_usage(owner_id)
        if cur_usage + size_bytes > DEFAULT_QUOTA_BYTES:
            raise ValueError(f"Quota exceeded. Needed: {size_bytes} bytes, Available: {DEFAULT_QUOTA_BYTES - cur_usage} bytes")

        file_id = f"TMP-{uuid.uuid4().hex[:12]}"
        ext = src.suffix if not is_dir else ""
        stored_name = f"{file_id}{ext}"
        dest = self.store_dir / stored_name

        if is_dir:
            shutil.copytree(src, dest)
        else:
            part_dest = self.store_dir / f"{stored_name}.part"
            with open(src, "rb") as fsrc, open(part_dest, "wb") as fdest:
                while True:
                    chunk = fsrc.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    fdest.write(chunk)
            part_dest.replace(dest)

        content_type = "application/pdf" if ext.lower() == ".pdf" else "application/octet-stream"
        created_at = time.time()
        expires_at = created_at + (ttl_hours * 3600)

        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO temp_files (id, original_name, stored_name, path, size_bytes, content_type, owner_id, purpose, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (file_id, src.name, stored_name, str(dest), size_bytes, content_type, owner_id, purpose, created_at, expires_at))
            conn.commit()

        return {
            "id": file_id,
            "originalName": src.name,
            "storedName": stored_name,
            "sizeBytes": size_bytes,
            "ownerId": owner_id,
            "purpose": purpose,
            "createdAt": created_at,
            "expiresAt": expires_at
        }

    def list_files(self, owner_id, role=None):
        self.cleanup_expired()
        with self._get_conn() as conn:
            cursor = conn.cursor()
            if owner_id:
                cursor.execute("SELECT * FROM temp_files WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,))
            else:
                cursor.execute("SELECT * FROM temp_files ORDER BY created_at DESC")
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["expired"] = item["expires_at"] < time.time()
                name_lower = item["original_name"].lower()
                if role == "book" and ("_cvr" in name_lower or "cvr" in name_lower):
                    continue
                if role == "cover" and ("_txt" in name_lower or "txt" in name_lower):
                    continue
                results.append(item)
            return results

    def get_file(self, file_id, owner_id=None):
        self.cleanup_expired()
        with self._get_conn() as conn:
            cursor = conn.cursor()
            if owner_id:
                cursor.execute("SELECT * FROM temp_files WHERE id = ? AND owner_id = ?", (file_id, owner_id))
            else:
                cursor.execute("SELECT * FROM temp_files WHERE id = ?", (file_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return dict(row)

    def delete_all(self, owner_id):
        self.cleanup_expired()
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, stored_name FROM temp_files WHERE owner_id = ?", (owner_id,))
            rows = cursor.fetchall()
            for r in rows:
                p = self.store_dir / r["stored_name"]
                try:
                    if p.exists():
                        if p.is_dir():
                            shutil.rmtree(p)
                        else:
                            p.unlink()
                except Exception:
                    pass
            cursor.execute("DELETE FROM temp_files WHERE owner_id = ?", (owner_id,))
            conn.commit()
            return len(rows)

    def materialize_to_input(self, isbn, owner_id, input_root, role=None):
        self.cleanup_expired()
        purpose_key = f"network-copy:{isbn}"
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM temp_files WHERE owner_id = ? AND purpose = ?", (owner_id, purpose_key))
            rows = cursor.fetchall()

        if not rows:
            with self._get_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM temp_files WHERE owner_id = ? AND original_name LIKE ?", (owner_id, f"%{isbn}%"))
                rows = cursor.fetchall()

        dest_dir = Path(input_root) / str(isbn)
        dest_dir.mkdir(parents=True, exist_ok=True)
        copied_files = []

        for r in rows:
            orig_name = r["original_name"]
            name_lower = orig_name.lower()
            if role == "book" and ("_cvr" in name_lower or "cvr" in name_lower):
                continue
            if role == "cover" and ("_txt" in name_lower or "txt" in name_lower):
                continue

            src_path = self.store_dir / r["stored_name"]
            if not src_path.exists():
                continue

            target_name = orig_name
            if not target_name.startswith(str(isbn)):
                target_name = f"{isbn}_{orig_name}"

            target_dest = dest_dir / target_name
            if src_path.is_dir():
                for root, _, fnames in os.walk(src_path):
                    for fn in fnames:
                        f_lower = fn.lower()
                        if role == "book" and ("_cvr" in f_lower or "cvr" in f_lower):
                            continue
                        if role == "cover" and ("_txt" in f_lower or "txt" in f_lower):
                            continue
                        f_src = Path(root) / fn
                        f_dest = dest_dir / fn
                        part_file = dest_dir / f"{fn}.part"
                        with open(f_src, "rb") as fs, open(part_file, "wb") as fd:
                            while True:
                                ch = fs.read(CHUNK_SIZE)
                                if not ch:
                                    break
                                fd.write(ch)
                        part_file.replace(f_dest)
                        copied_files.append(str(f_dest))
            else:
                part_file = dest_dir / f"{target_name}.part"
                with open(src_path, "rb") as fsrc, open(part_file, "wb") as fdest:
                    while True:
                        chunk = fsrc.read(CHUNK_SIZE)
                        if not chunk:
                            break
                        fdest.write(chunk)
                part_file.replace(target_dest)
                copied_files.append(str(target_dest))


        return {
            "isbn": isbn,
            "destinationFolder": str(dest_dir),
            "filesCopied": len(copied_files),
            "paths": copied_files
        }
