import io
import zipfile
import html

HEADERS = [
    "S.No",
    "ISBN Folder",
    "Employee ID",
    "Employee Name",
    "Work Type",
    "Project ID",
    "Project Name",
    "Priority",
    "Due Date",
    "Allocated At",
    "Started At",
    "Ended At",
    "Working Time",
    "File Break Time",
    "File Break Details",
    "Status",
    "Status Detail Type",
    "Reason / Remarks",
    "Status Detail Updated At"
]

def escape_xml(s):
    if s is None:
        return ""
    return html.escape(str(s), quote=True)

def col_letter(col_idx):
    result = ""
    while col_idx >= 0:
        result = chr(ord('A') + (col_idx % 26)) + result
        col_idx = (col_idx // 26) - 1
    return result

def make_report_xlsx(rows):
    """
    Generates a valid OOXML .xlsx file buffer containing the 19-column Production Report.
    Zero external dependencies, stdlib zipfile and string formatting only.
    """
    buf = io.BytesIO()

    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""

    wb_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    workbook = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews>
    <workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/>
  </bookViews>
  <sheets>
    <sheet name="Production Report" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font>
      <sz val="11"/>
      <color rgb="FF0F172A"/>
      <name val="Calibri"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FF0B3C6D"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF0B3C6D"/>
      </patternFill>
    </fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FFF4F8FC"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="2">
    <border>
      <left/><right/><top/><bottom/><diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFDCE7F3"/></left>
      <right style="thin"><color rgb="FFDCE7F3"/></right>
      <top style="thin"><color rgb="FFDCE7F3"/></top>
      <bottom style="thin"><color rgb="FFDCE7F3"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>"""

    # Build Sheet1
    sheet_rows = []
    # Header Row (Row 1, style 1 = bold white on teal fill)
    header_cells = []
    for c_idx, h_name in enumerate(HEADERS):
        cell_ref = f"{col_letter(c_idx)}1"
        header_cells.append(f'<c r="{cell_ref}" s="1" t="inlineStr"><is><t>{escape_xml(h_name)}</t></is></c>')
    sheet_rows.append(f'<row r="1" ht="28" customHeight="1">{"".join(header_cells)}</row>')

    # Data Rows
    row_num = 2
    for r in rows:
        row_cells = []
        is_total = str(r.get("sno", "")).lower() == "total" or str(r.get("isbn", "")).lower() == "total"
        row_style = "3" if is_total else ("2" if (row_num % 2 == 0) else "0")

        vals = [
            str(r.get("sno", row_num - 1)),
            str(r.get("isbn", "")),
            str(r.get("eid", r.get("employeeId", ""))),
            str(r.get("ename", r.get("employeeName", ""))),
            str(r.get("workType", r.get("role", "Book Developer"))),
            str(r.get("projectId", "")),
            str(r.get("projectName", "")),
            str(r.get("priority", "Normal")),
            str(r.get("dueDate", "")),
            str(r.get("allocatedAt", r.get("allocated", ""))),
            str(r.get("startedAt", r.get("started", ""))),
            str(r.get("endedAt", r.get("ended", ""))),
            str(r.get("workingTime", r.get("workTime", "00:00:00"))),
            str(r.get("fileBreakTime", r.get("breakTime", "00:00:00"))),
            str(r.get("fileBreakDetails", r.get("breakDetails", "-"))),
            str(r.get("status", "Allocated")),
            str(r.get("statusDetailType", r.get("statusType", "-"))),
            str(r.get("statusReason", r.get("reworkReason", r.get("reason", "-")))),
            str(r.get("statusDetailUpdatedAt", r.get("statusUpdatedAt", "")))
        ]

        for c_idx, val in enumerate(vals):
            cell_ref = f"{col_letter(c_idx)}{row_num}"
            row_cells.append(f'<c r="{cell_ref}" s="{row_style}" t="inlineStr"><is><t>{escape_xml(val)}</t></is></c>')

        sheet_rows.append(f'<row r="{row_num}" ht="20" customHeight="1">{"".join(row_cells)}</row>')
        row_num += 1

    last_row = max(1, row_num - 1)
    last_col = col_letter(len(HEADERS) - 1)
    dimension = f"A1:{last_col}{last_row}"

    cols_def = """<cols>
    <col min="1" max="1" width="8" customWidth="1"/>
    <col min="2" max="2" width="18" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="4" width="20" customWidth="1"/>
    <col min="5" max="5" width="16" customWidth="1"/>
    <col min="6" max="6" width="14" customWidth="1"/>
    <col min="7" max="7" width="22" customWidth="1"/>
    <col min="8" max="8" width="12" customWidth="1"/>
    <col min="9" max="9" width="14" customWidth="1"/>
    <col min="10" max="10" width="20" customWidth="1"/>
    <col min="11" max="11" width="20" customWidth="1"/>
    <col min="12" max="12" width="20" customWidth="1"/>
    <col min="13" max="13" width="14" customWidth="1"/>
    <col min="14" max="14" width="14" customWidth="1"/>
    <col min="15" max="15" width="30" customWidth="1"/>
    <col min="16" max="16" width="14" customWidth="1"/>
    <col min="17" max="17" width="18" customWidth="1"/>
    <col min="18" max="18" width="35" customWidth="1"/>
    <col min="19" max="19" width="20" customWidth="1"/>
  </cols>"""

    sheet1 = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="{dimension}"/>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  {cols_def}
  <sheetData>
    {"".join(sheet_rows)}
  </sheetData>
  <autoFilter ref="{dimension}"/>
</worksheet>"""

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        z.writestr("xl/workbook.xml", workbook)
        z.writestr("xl/styles.xml", styles)
        z.writestr("xl/worksheets/sheet1.xml", sheet1)

    buf.seek(0)
    return buf.getvalue()

