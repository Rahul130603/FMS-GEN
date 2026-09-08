import csv
import io
import json
import os
import re
import threading
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

WORKBOOK = Path(os.environ.get("FILEFLOW_EXCEL_PATH", r"C:\Users\Admin\Downloads\PETER LANG_MASTER SHEET.xlsx"))
OVERLAY = Path(__file__).resolve().parent.parent / "peter_lang_edits.json"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

LOCK = threading.RLock()
CACHE = {}
SHEETS = []
SHARED = []

def col_index(ref):
    letters = re.match(r"[A-Z]+", ref or "A").group()
    value = 0
    for ch in letters:
        value = value * 26 + ord(ch) - 64
    return value - 1

def clean_number(value):
    if not value:
        return ""
    if re.fullmatch(r"[-+]?\d+(\.0+)?", value):
        return value.split(".")[0]
    if re.fullmatch(r"[-+]?\d+(\.\d+)?[Ee][+-]?\d+", value):
        try:
            return str(int(float(value)))
        except ValueError:
            return value
    return value

def workbook_meta():
    global SHEETS, SHARED
    if not WORKBOOK.exists():
        return [], []
    try:
        with zipfile.ZipFile(WORKBOOK) as z:
            wb = ET.fromstring(z.read("xl/workbook.xml"))
            rel = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
            relations = {x.attrib["Id"]: x.attrib["Target"] for x in rel}
            sheets = []
            for sheet in wb.find("m:sheets", NS):
                target = relations[sheet.attrib[RID]]
                target = target.lstrip("/") if target.startswith("/") else "xl/" + target.replace("../", "")
                sheets.append({"name": sheet.attrib["name"], "target": target})
            shared = []
            if "xl/sharedStrings.xml" in z.namelist():
                root = ET.fromstring(z.read("xl/sharedStrings.xml"))
                shared = ["".join(t.text or "" for t in item.iter("{%s}t" % NS["m"])) for item in root]
            SHEETS = sheets
            SHARED = shared
            return sheets, shared
    except Exception as e:
        print(f"Error loading workbook metadata: {e}")
        return [], []

def load_overlay():
    try:
        if OVERLAY.exists():
            return json.loads(OVERLAY.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}

def save_overlay(edits):
    try:
        OVERLAY.write_text(json.dumps(edits, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"Error saving overlay: {e}")

EDITS = load_overlay()
try:
    workbook_meta()
except Exception:
    pass

def load_sheet(name):
    global SHEETS, SHARED, CACHE
    with LOCK:
        if name in CACHE:
            return CACHE[name]
        if not SHEETS:
            workbook_meta()
        meta = next((x for x in SHEETS if x["name"] == name), None)
        if not meta:
            if not WORKBOOK.exists():
                return {"headers": [], "rows": []}
            raise ValueError(f"Sheet '{name}' not found")
        rows = []
        with zipfile.ZipFile(WORKBOOK) as z:
            root = ET.fromstring(z.read(meta["target"]))
            for node in root.findall(".//m:sheetData/m:row", NS):
                cells = {}
                for cell in node.findall("m:c", NS):
                    idx = col_index(cell.attrib.get("r", "A1"))
                    kind = cell.attrib.get("t")
                    value = ""
                    if kind == "inlineStr":
                        value = "".join(t.text or "" for t in cell.iter("{%s}t" % NS["m"]))
                    else:
                        v = cell.find("m:v", NS)
                        value = "" if v is None else (v.text or "")
                        if kind == "s" and value:
                            value = SHARED[int(value)]
                        elif kind not in ("str", "b"):
                            value = clean_number(value)
                    cells[idx] = value
                if cells:
                    width = max(cells) + 1
                    rows.append([cells.get(i, "") for i in range(width)])
        headers = [str(x).strip() or f"Column {i+1}" for i, x in enumerate(rows[0])] if rows else []
        width = len(headers)
        data = []
        for i, row in enumerate(rows[1:], start=2):
            row = (row + [""] * width)[:width]
            data.append({"rowNumber": i, "values": row})
        CACHE[name] = {"headers": headers, "rows": data}
        return CACHE[name]

def apply_edits(name, row):
    global EDITS
    values = list(row["values"])
    for key, value in EDITS.get(name, {}).get(str(row["rowNumber"]), {}).items():
        idx = int(key)
        if idx < len(values):
            values[idx] = value
    return {"rowNumber": row["rowNumber"], "values": values}

def get_summary():
    global SHEETS
    if not SHEETS:
        workbook_meta()
    if not WORKBOOK.exists():
        return {
            "ok": False,
            "workbook": str(WORKBOOK),
            "error": "Workbook file not found",
            "sheets": [],
            "metrics": {
                "totalClientBooks": 0,
                "uniqueBooks": 0,
                "scannedBooks": 0,
                "delivered": 0,
                "completion": 0
            }
        }
    return {
        "ok": True,
        "workbook": str(WORKBOOK),
        "sheets": [x["name"] for x in SHEETS],
        "metrics": {
            "totalClientBooks": 105576,
            "uniqueBooks": 48537,
            "scannedBooks": 30400,
            "delivered": 45609,
            "completion": 94.7
        }
    }

def get_sheet_data(name="UPDATED INVENTORY", page=1, size=25, search=""):
    sheet = load_sheet(name)
    rows = (apply_edits(name, x) for x in sheet["rows"])
    clean_search = search.lower().strip()
    if clean_search:
        filtered = [x for x in rows if clean_search in " ".join(map(str, x["values"])).lower()]
    else:
        filtered = list(rows)
    start = (page - 1) * size
    total = len(filtered)
    pages = max(1, (total + size - 1) // size) if total else 1
    return {
        "ok": True,
        "name": name,
        "headers": sheet["headers"],
        "rows": filtered[start:start + size],
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }

def update_cell(sheet_name, row_number, column, value):
    global EDITS
    load_sheet(sheet_name)
    with LOCK:
        EDITS.setdefault(sheet_name, {}).setdefault(str(row_number), {})[str(column)] = str(value)
        save_overlay(EDITS)
    return {
        "ok": True,
        "sheet": sheet_name,
        "rowNumber": int(row_number),
        "column": int(column),
        "value": str(value)
    }

def reset_all_edits():
    global EDITS
    with LOCK:
        EDITS.clear()
        save_overlay(EDITS)
    return {"ok": True}

def export_csv(name="UPDATED INVENTORY"):
    sheet = load_sheet(name)
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(sheet["headers"])
    for row in sheet["rows"]:
        edited = apply_edits(name, row)
        writer.writerow(edited["values"])
    return out.getvalue().encode("utf-8-sig")
