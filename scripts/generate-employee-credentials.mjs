import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const workbookPath = process.env.FILEFLOW_ATTENDANCE_PATH || "C:\\Users\\Admin\\Downloads\\Gentize Attendance.xlsx";
const workbook = XLSX.readFile(workbookPath);
const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Employee_Master, { header: 1, defval: "", raw: false });
const csv = [["Employee ID", "GI Employee ID", "Employee Name", "Initial Password"], ...rows.slice(1)
  .filter(row => String(row[0] || "").trim() && String(row[2] || "").trim())
  .map(row => {
    const empId = String(row[0]).trim();
    return [empId, String(row[1] || "").trim(), String(row[2]).trim(), `FF@${empId}`];
  })]
  .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
  .join("\r\n");

const output = path.resolve("private", "employee-credentials.csv");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, csv, "utf8");
console.log(`Created ${output} with ${csv.split("\r\n").length - 1} employee accounts.`);
