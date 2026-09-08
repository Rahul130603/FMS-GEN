
import { 
  calculatePending, 
  calculateProductivityScore, 
  getEmployeeTwoHourStats 
} from './statusCalculations';

export function exportToCSV(data: any[], filename: string = 'export.csv') {
  if (!data || data.length === 0) {
    if (typeof alert === 'function') alert("No records selected or available to export.");
    return;
  }

  if (data[0] && (data[0].employeeName || data[0].employeeId)) {
    const headers = [
      "Employee Name", "Employee ID", "Role", "Department", "Date",
      "Allocated", "Daily Target", "Downloaded", "WIP", "Completed",
      "Pending", "Rework", "QC Errors", "Productivity Score", "Status"
    ];
    const rows = data.map((item) => {
      const productivity = calculateProductivityScore(item);
      return [
        `"${(item.employeeName || "").replace(/"/g, '""')}"`,
        `"${item.employeeId || ""}"`,
        `"${item.role || ""}"`,
        `"${item.department || ""}"`,
        `"${item.date || ""}"`,
        item.allocated ?? 0,
        item.dailyTarget ?? item.allocated,
        item.downloaded ?? 0,
        item.wip ?? 0,
        item.completed ?? 0,
        calculatePending(item),
        item.rework ?? 0,
        item.qcErrors ?? 0,
        `"${productivity}%"`,
        `"${item.status || ""}"`
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
  const headerRow = keys.join(',');
  const rows = data.map(item => {
    return keys.map(key => {
      const val = item[key] ?? '';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });
  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const exportToCsv = exportToCSV;



export function exportToJSON(data: any[], filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function triggerPrint() {
  window.print();
}

import { Attachment } from '../types/common';

/**
 * Formats a raw byte count into a human-readable size (KB / MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  return Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

/**
 * Infers standard MIME type based on file extension.
 */
export function inferMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'log':
    case 'txt':
      return 'text/plain';
    case 'patch':
    case 'diff':
      return 'text/x-diff';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Reads a File object from input and returns its Base64 Data URL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Data URL (base64 or percent-encoded) into a real binary Blob.
 */
export function dataUrlToBlob(dataUrl: string, defaultMime: string = 'application/octet-stream'): Blob {
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    return new Blob([dataUrl], { type: defaultMime });
  }

  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : defaultMime;

  if (parts[0].includes(';base64')) {
    try {
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.warn('Failed to decode base64 data, fallback to raw text Blob', e);
      return new Blob([parts[1]], { type: mime });
    }
  } else {
    // Percent-encoded text
    try {
      const text = decodeURIComponent(parts[1]);
      return new Blob([text], { type: mime });
    } catch (e) {
      return new Blob([parts[1]], { type: mime });
    }
  }
}

import { getUploadedFile } from './fileStorage';

/**
 * Downloads an attachment to the user's browser, preserving original binary content,
 * original filename, and correct MIME type.
 * 
 * Strict rules:
 * - For user uploads (source === 'upload'): always downloads the exact uploaded file/blob.
 * - Never synthesizes or substitutes fake diagnostic evidence for uploaded files.
 * - Shows "The original file is unavailable." if original file binary is missing.
 */
export async function downloadAttachment(
  attachment: Attachment | null | undefined,
  onToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void
): Promise<boolean> {
  if (!attachment) {
    if (onToast) onToast('Download failed', 'The original file is unavailable.', 'error');
    return false;
  }

  const isUserUpload =
    attachment.source === 'upload' ||
    Boolean(attachment.storageKey) ||
    Boolean(attachment.fileId) ||
    attachment.file instanceof Blob ||
    Boolean(
      attachment.id &&
      (attachment.id.startsWith('att-doc-') ||
        attachment.id.startsWith('att-img-') ||
        attachment.id.startsWith('att-log-') ||
        attachment.id.startsWith('f-att-doc-') ||
        attachment.id.startsWith('f-att-mock-') ||
        attachment.id.startsWith('f-att-'))
    );
  let blob: Blob | null = null;

  // 1. In-memory File or Blob reference (available during current browser session)
  if (attachment.file instanceof Blob && attachment.file.size > 0) {
    blob = attachment.file;
  }

  // 2. Persistent client-side IndexedDB binary storage (survives page refreshes)
  // Queries id, storageKey, and fileId in priority order
  if (!blob) {
    const candidateKeys = [
      attachment.id,
      attachment.storageKey,
      attachment.fileId
    ].filter((k): k is string => Boolean(k && k.trim()));

    for (const key of candidateKeys) {
      try {
        const stored = await getUploadedFile(key);
        if (stored instanceof Blob && stored.size > 0) {
          blob = stored;
          break;
        }
      } catch (err) {
        console.warn(`Could not read binary file for key ${key}:`, err);
      }
    }
  }

  // 3. Encoded data payload (Data URL or base64 data, if present)
  // Strictly ignore any legacy synthetic/mock PDF data URLs
  if (!blob && attachment.fileData) {
    const isSynthetic =
      attachment.fileData.includes('PubVantage') ||
      attachment.fileData.includes('Automated%20PDF') ||
      attachment.fileData.includes('Diagnostic%20Evidence') ||
      attachment.fileData.includes('JVBERi0xLjQKMSAwIG9iajw8L1R5cGU');

    if (!isSynthetic) {
      try {
        const mime = attachment.type || inferMimeType(attachment.name);
        if (attachment.fileData.startsWith('data:')) {
          blob = dataUrlToBlob(attachment.fileData, mime);
        } else {
          blob = new Blob([attachment.fileData], { type: mime });
        }
      } catch (err) {
        console.warn('Could not decode fileData to Blob:', err);
      }
    }
  }

  // 4. Sample or remote static file asset URL (ONLY for pre-existing sample attachments)
  // CRITICAL: User-uploaded files must NEVER fall back to sample or demo assets!
  if (!blob && !isUserUpload && attachment.source === 'sample' && attachment.url && attachment.url !== '#' && !attachment.url.startsWith('javascript:')) {
    try {
      const metaEnv = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
      const resolvedUrl = attachment.url.startsWith('/') && metaEnv?.BASE_URL && metaEnv.BASE_URL !== '/'
        ? `${metaEnv.BASE_URL.replace(/\/$/, '')}${attachment.url}`
        : attachment.url;

      const response = await fetch(resolvedUrl);
      if (response.ok) {
        blob = await response.blob();
      } else {
        console.warn(`Static asset fetch returned status ${response.status} for ${resolvedUrl}`);
      }
    } catch (err) {
      console.warn('Could not fetch asset from attachment.url:', err);
    }
  }

  // 5. If no real binary data exists, fail cleanly with explicit error toast
  // User uploads will NEVER return a sample or synthetic file.
  if (!blob || blob.size === 0) {
    const errorMsg = isUserUpload
      ? 'The original file is unavailable.'
      : 'The sample evidence file is unavailable.';
    if (onToast) onToast('Download failed', errorMsg, 'error');
    return false;
  }

  // 6. Trigger native browser download using the exact File/Blob
  try {
    const targetMime = attachment.type || inferMimeType(attachment.name || '');
    let finalBlob = blob;
    if (!finalBlob.type || finalBlob.type === 'application/octet-stream') {
      if (targetMime && targetMime !== 'application/octet-stream') {
        finalBlob = new Blob([finalBlob], { type: targetMime });
      }
    }

    const downloadUrl = URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = attachment.name || 'download';
    link.setAttribute('download', attachment.name || 'download');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      try {
        URL.revokeObjectURL(downloadUrl);
      } catch (e) {
        // ignore
      }
    }, 4000);

    if (onToast) {
      onToast(`Downloading ${attachment.name}...`, undefined, 'info');
    }
    return true;
  } catch (err) {
    console.error('Failed to trigger browser download:', err);
    if (onToast) onToast('Download failed', 'The original file is unavailable.', 'error');
    return false;
  }
}

/**
 * Creates a valid minimal PDF file as a Base64 Data URL.
 */
export function createSamplePdfDataUrl(title: string, content: string): string {
  const safeTitle = title.replace(/[()\\]/g, '');
  const safeContent = content.replace(/[()\\]/g, '');
  const stream = `BT /F1 16 Tf 50 740 Td (${safeTitle}) Tj 0 -30 Td /F1 11 Tf (${safeContent}) Tj 0 -20 Td /F1 9 Tf (PubVantage Production Studio - Automated PDF Evidence Artifact) Tj ET`;
  const streamLen = stream.length;

  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
5 0 obj << /Length ${streamLen} >>
stream
${stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000249 00000 n 
0000000328 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
${420 + streamLen}
%%EOF`;

  try {
    return 'data:application/pdf;base64,' + btoa(unescape(encodeURIComponent(pdf)));
  } catch (e) {
    return 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxNzEKJSVFT0Y=';
  }
}

/**
 * Creates a valid PNG Data URL for sample screenshot attachments.
 */
export function createSamplePngDataUrl(title: string, subtitle: string = ''): string {
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 380;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dark theme background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 380);

        // Header bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 640, 36);

        // Window control circles
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(20, 18, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(36, 18, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.arc(52, 18, 5, 0, Math.PI * 2); ctx.fill();

        // Header title
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText('PubVantage Production Studio — Evidence Capture', 75, 22);

        // Content Area Card
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(24, 56, 592, 300, 8);
        } else {
          ctx.rect(24, 56, 592, 300);
        }
        ctx.fill();
        ctx.stroke();

        // Badge
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(44, 80, 140, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('DIAGNOSTIC EVIDENCE', 52, 96);

        // Main Title
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText(title, 44, 136);

        // Subtitle
        if (subtitle) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px system-ui, sans-serif';
          ctx.fillText(subtitle, 44, 160);
        }

        // Code / log simulation box
        ctx.fillStyle = '#090d16';
        ctx.fillRect(44, 180, 552, 140);
        ctx.fillStyle = '#34d399';
        ctx.font = '11px monospace';
        ctx.fillText('> [PRE-FLIGHT STAGE]: Automated EPUB 3.2 Inspector', 56, 208);
        ctx.fillText('> [ERROR CODE]: RSC-005 / WCAG-2.1 Conformance Fault', 56, 230);
        ctx.fillStyle = '#f87171';
        ctx.fillText('> [STATUS]: Flagged for Production Engineer Review', 56, 252);
        ctx.fillStyle = '#64748b';
        ctx.fillText('> Timestamp: 2026-09-05T11:00:00Z | Server Node: PRD-SCAN-1400', 56, 280);

        return canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.warn('Canvas PNG generation failed, using fallback Base64', e);
    }
  }

  // Base64 1x1 fallback PNG
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

/**
 * Creates a text/json/xml Data URL.
 */
export function createSampleTextDataUrl(content: string, mimeType: string = 'text/plain'): string {
  return `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
}


/**
 * Upgraded Export Utilities supporting comprehensive metrics and scope
 */

export const exportToExcel = (data, filename = `Daily_Allotment_Status_${new Date().toISOString().slice(0, 10)}.xls`) => {
  if (!data || !data.length) {
    alert("No records selected or available to export.");
    return;
  }

  const headers = [
    "Employee Name",
    "Employee ID",
    "Role",
    "Department",
    "Date",
    "Allocated",
    "Daily Target",
    "Downloaded",
    "WIP",
    "Completed",
    "Pending",
    "Rework",
    "QC Errors",
    "Productivity Score",
    "Status"
  ];

  const tableRows = data.map((item) => {
    const productivity = calculateProductivityScore(item);

    return `
      <tr>
        <td>${item.employeeName || ""}</td>
        <td>${item.employeeId || ""}</td>
        <td>${item.role || ""}</td>
        <td>${item.department || ""}</td>
        <td>${item.date || ""}</td>
        <td style="text-align:right;">${item.allocated ?? 0}</td>
        <td style="text-align:right;">${item.dailyTarget ?? item.allocated}</td>
        <td style="text-align:right;">${item.downloaded ?? 0}</td>
        <td style="text-align:right;">${item.wip ?? 0}</td>
        <td style="text-align:right;">${item.completed ?? 0}</td>
        <td style="text-align:right;">${item.pending ?? 0}</td>
        <td style="text-align:right;">${item.rework ?? 0}</td>
        <td style="text-align:right;">${item.qcErrors ?? 0}</td>
        <td style="text-align:right;">${item.status === 'No Activity' ? 0 : productivity.score}</td>
        <td>${item.status || ""}</td>
      </tr>
    `;
  }).join("");

  const excelXml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px 12px; }
          td { border: 1px solid #e2e8f0; padding: 6px 10px; font-family: sans-serif; font-size: 12px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelXml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export Dedicated 2 Hours Report Tracking to Excel
 * Includes both:
 * 1. 2-Hour Production Shift Windows Summary
 * 2. Individual Employee 4-Slot Breakdown Matrix
 */
export const exportTwoHourReportToExcel = ({
  slotData = [],
  employees = [],
  selectedDate = new Date().toISOString().slice(0, 10),
  activeSlot = null
}) => {
  if (!slotData || !slotData.length) {
    alert("No 2-hour report data available to export.");
    return;
  }

  const isToday = !selectedDate || selectedDate === '2026-09-05';
  const filename = `Daily_Allotment_2Hours_Report_${selectedDate}.xls`;

  // 1. Shift Windows Summary Rows
  const summaryHeaders = [
    "Slot",
    "Time Window",
    "Shift Session",
    "Status",
    "Files Completed",
    "QC Approved",
    "Window Target",
    "Achievement %"
  ];

  const summaryRows = slotData.map(slot => {
    const isSlot4 = slot.slot === 'Slot 4' || slot.timeWindow.includes('3.30 PM');
    const comp = (isToday && isSlot4) ? 0 : (slot.completed || 0);
    const qc = (isToday && isSlot4) ? 0 : (slot.qcPassed || 0);
    const target = slot.target || 0;
    const eff = target > 0 ? Math.round((comp / target) * 100) : 0;
    const status = (isToday && isSlot4) 
      ? 'Upcoming (Empty / Future Time)' 
      : slot.isCurrent 
        ? 'In Progress (Live @ 2:18 PM)' 
        : 'Completed';

    return `
      <tr>
        <td style="font-weight:bold;">${slot.slot}</td>
        <td>${slot.timeWindow}</td>
        <td>${slot.session || ""}</td>
        <td style="font-weight:600; color:${(isToday && isSlot4) ? '#64748b' : slot.isCurrent ? '#2563eb' : '#059669'};">${status}</td>
        <td style="text-align:right; font-weight:bold; color:${comp > 0 ? '#1d4ed8' : '#94a3b8'};">${comp}</td>
        <td style="text-align:right; color:${qc > 0 ? '#059669' : '#94a3b8'};">${qc}</td>
        <td style="text-align:right;">${target}</td>
        <td style="text-align:right; font-weight:bold;">${eff}%</td>
      </tr>
    `;
  }).join("");

  // Total Row for Summary
  const totalComp = slotData.reduce((acc, s) => {
    const isSlot4 = s.slot === 'Slot 4' || s.timeWindow.includes('3.30 PM');
    return acc + ((isToday && isSlot4) ? 0 : (s.completed || 0));
  }, 0);
  const totalQc = slotData.reduce((acc, s) => {
    const isSlot4 = s.slot === 'Slot 4' || s.timeWindow.includes('3.30 PM');
    return acc + ((isToday && isSlot4) ? 0 : (s.qcPassed || 0));
  }, 0);
  const totalTarget = slotData.reduce((acc, s) => acc + (s.target || 0), 0);
  const totalEff = totalTarget > 0 ? Math.round((totalComp / totalTarget) * 100) : 0;

  // 2. Individual Employee 4-Slot Breakdown Matrix Rows
  const employeeMatrixHeaders = [
    "Employee ID",
    "Employee Name",
    "Role",
    "Department",
    "Slot 1 (8.30-10.30 AM)",
    "Slot 2 (10.30 AM-12.45 PM)",
    "Slot 3 (12.45-3.30 PM) [Live]",
    "Slot 4 (3.30-5.30 PM) [Upcoming]",
    "Total Completed Today",
    "Daily Target",
    "Shift Status"
  ];

  const employeeMatrixRows = employees.map(emp => {
    const s1 = getEmployeeTwoHourStats(emp, "8.30 AM to 10.30 AM", isToday);
    const s2 = getEmployeeTwoHourStats(emp, "10.30 AM to 12.45 PM", isToday);
    const s3 = getEmployeeTwoHourStats(emp, "12.45 PM to 3.30 PM", isToday);
    const s4 = getEmployeeTwoHourStats(emp, "3.30 PM to 5.30 PM", isToday);

    const s4Count = (isToday ? 0 : s4.slotCompleted);
    const empTotal = s1.slotCompleted + s2.slotCompleted + s3.slotCompleted + s4Count;

    return `
      <tr>
        <td style="font-family:monospace; font-weight:bold;">${emp.employeeId || ""}</td>
        <td style="font-weight:600;">${emp.employeeName || ""}</td>
        <td>${emp.role || ""}</td>
        <td>${emp.department || ""}</td>
        <td style="text-align:right;">${s1.slotCompleted}</td>
        <td style="text-align:right;">${s2.slotCompleted}</td>
        <td style="text-align:right; font-weight:bold; color:#2563eb;">${s3.slotCompleted}</td>
        <td style="text-align:right; color:#94a3b8;">${isToday ? '0 (Upcoming)' : s4.slotCompleted}</td>
        <td style="text-align:right; font-weight:bold; color:#0f172a;">${empTotal}</td>
        <td style="text-align:right;">${emp.dailyTarget || emp.allocated}</td>
        <td style="text-align:center;">${emp.status || "In Progress"}</td>
      </tr>
    `;
  }).join("");

  const excelXml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11px; }
          .report-header { font-size: 16px; font-weight: bold; color: #1e3a8a; padding: 10px 0 4px 0; }
          .meta-info { font-size: 11px; color: #475569; margin-bottom: 15px; }
          .section-heading { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 15px; margin-bottom: 6px; }
          th { background-color: #2563eb; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 11px; }
          th.sub { background-color: #e2e8f0; color: #0f172a; }
          td { border: 1px solid #e2e8f0; padding: 5px 8px; font-size: 11px; }
          .total-row td { font-weight: bold; background-color: #f1f5f9; border-top: 2px solid #64748b; }
        </style>
      </head>
      <body>
        <div class="report-header">DAILY ALLOTMENT - 2 HOURS REPORT TRACKING</div>
        <div class="meta-info">
          <strong>Report Date:</strong> ${selectedDate} &nbsp;|&nbsp;
          <strong>Generated At:</strong> ${new Date().toLocaleTimeString()} &nbsp;|&nbsp;
          <strong>Real-Time Shift Status:</strong> Current Time ~2:18 PM (Slot 3: 12.45 PM - 3.30 PM is Active, Slot 4: 3.30 PM - 5.30 PM is Future/Empty)
        </div>

        <div class="section-heading">1. TWO-HOUR PRODUCTION SHIFT WINDOWS SUMMARY</div>
        <table>
          <thead>
            <tr>
              ${summaryHeaders.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
            <tr class="total-row">
              <td colspan="4" style="text-align:right; font-weight:bold;">SHIFT SUMMARY TOTAL:</td>
              <td style="text-align:right; font-weight:bold; color:#1d4ed8;">${totalComp}</td>
              <td style="text-align:right; font-weight:bold; color:#059669;">${totalQc}</td>
              <td style="text-align:right; font-weight:bold;">${totalTarget}</td>
              <td style="text-align:right; font-weight:bold;">${totalEff}%</td>
            </tr>
          </tbody>
        </table>

        <br/>
        <div class="section-heading">2. INDIVIDUAL EMPLOYEE 2-HOUR BREAKDOWN MATRIX (${employees.length} Employees)</div>
        <table>
          <thead>
            <tr>
              ${employeeMatrixHeaders.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${employeeMatrixRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelXml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
