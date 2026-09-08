import * as XLSX from 'xlsx';

/**
 * Format ISO or YYYY-MM-DD date string to DD-MM-YYYY
 */
export function formatDateForExcel(dateStr) {
  if (!dateStr) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return dateStr;
}

/**
 * Specifically format and export My Report Summary metrics to a professional Excel (.xlsx) file.
 *
 * Structure:
 * Title: "My Report Summary"
 * Report Date: "Report Date: DD-MM-YYYY"
 *
 * Table Columns:
 * # | Card Label | Example Value (Default Data)
 *
 * Rows:
 * 1 | TOTAL FILES | [dynamic Total Files count]
 * 2 | IN PROGRESS | [dynamic In Progress count]
 * 3 | COMPLETED | [dynamic Completed count]
 * 4 | PENDING | [dynamic Pending count]
 * 5 | OVERDUE | [dynamic Overdue count]
 * 6 | DUE TODAY | [dynamic Due Today count]
 */
export async function exportMyReportSummaryToExcel(metrics, todayStr = '2026-09-04', customFilename = null) {
  if (!metrics) {
    throw new Error('NO_DATA');
  }

  // Format date as DD-MM-YYYY
  const formattedDate = formatDateForExcel(todayStr);
  const fileDateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `My_Report_Summary_${fileDateStr}.xlsx`;

  // Worksheet structure
  const sheetData = [
    ['My Report Summary', '', ''],
    [`Report Date: ${formattedDate}`, '', ''],
    ['', '', ''],
    ['#', 'Card Label', 'Example Value (Default Data)'],
    [1, 'TOTAL FILES', Number(metrics.total) || 0],
    [2, 'IN PROGRESS', Number(metrics.inProgress) || 0],
    [3, 'COMPLETED', Number(metrics.completed) || 0],
    [4, 'PENDING', Number(metrics.pending) || 0],
    [5, 'OVERDUE', Number(metrics.overdue) || 0],
    [6, 'DUE TODAY', Number(metrics.dueToday) || 0]
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column Widths
  ws['!cols'] = [
    { wch: 8 },   // #
    { wch: 22 },  // Card Label
    { wch: 32 }   // Example Value (Default Data)
  ];

  // Freeze top table headers (Row 4)
  ws['!views'] = [
    {
      xSplit: 0,
      ySplit: 4,
      topLeftCell: 'A5',
      activeCell: 'A5',
      state: 'frozen'
    }
  ];

  // Create Workbook and append worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'My Report Summary');

  // Set workbook properties
  wb.Props = {
    Title: 'My Report Summary',
    Subject: 'Book Publishing Fulfillment & Production Summary Report',
    Author: 'PubFlow FMS',
    CreatedDate: new Date()
  };

  // Trigger browser download (.xlsx)
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`, {
    bookType: 'xlsx',
    type: 'binary'
  });

  return true;
}

/**
 * Specifically format and export My Report projects table to a professional Excel (.xlsx) file (Full Details).
 */
export async function exportMyReportToExcel(projects = [], customFilename = null) {
  if (!projects || projects.length === 0) {
    throw new Error('NO_DATA');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `My_Report_${todayStr}.xlsx`;

  const headers = [
    'ISBN',
    'Book Title',
    'Client / Publisher',
    'Project Type',
    'Assigned Date',
    'Due Date',
    'Progress',
    'Current Stage',
    'Status',
    'Priority'
  ];

  const dataRows = projects.map(p => [
    String(p.isbn || ''),
    p.bookTitle || '',
    p.client || p.publisher || '',
    p.projectType || p.format || '',
    formatDateForExcel(p.assignedDate),
    formatDateForExcel(p.dueDate),
    typeof p.progress === 'number' ? `${p.progress}%` : p.progress ? `${p.progress}%` : '0%',
    p.currentStage || 'Pre-Production',
    p.status || 'In Progress',
    p.priority || 'Medium'
  ]);

  const worksheetData = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  const colWidths = headers.map((header, colIdx) => {
    let maxLength = header.length;
    dataRows.forEach(row => {
      const cellValue = String(row[colIdx] || '');
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });

    if (header === 'ISBN') return { wch: Math.min(Math.max(maxLength + 4, 18), 24) };
    if (header === 'Book Title') return { wch: Math.min(Math.max(maxLength + 4, 32), 65) };
    if (header === 'Client / Publisher') return { wch: Math.min(Math.max(maxLength + 4, 22), 35) };
    if (header === 'Project Type') return { wch: Math.min(Math.max(maxLength + 4, 16), 22) };
    if (header === 'Assigned Date' || header === 'Due Date') return { wch: Math.min(Math.max(maxLength + 4, 16), 20) };
    if (header === 'Progress') return { wch: 14 };
    if (header === 'Current Stage') return { wch: Math.min(Math.max(maxLength + 4, 16), 24) };
    if (header === 'Status') return { wch: Math.min(Math.max(maxLength + 4, 16), 22) };
    if (header === 'Priority') return { wch: 14 };

    return { wch: Math.min(Math.max(maxLength + 3, 12), 50) };
  });
  ws['!cols'] = colWidths;

  const totalRows = dataRows.length;
  const totalCols = headers.length;
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: totalRows, c: totalCols - 1 }
    })
  };

  ws['!views'] = [
    {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activeCell: 'A2',
      state: 'frozen'
    }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'My Assigned Projects');

  wb.Props = {
    Title: 'My Assigned Publishing Projects Report',
    Subject: 'Book Publishing Fulfillment & Production Report',
    Author: 'PubFlow FMS',
    CreatedDate: new Date()
  };

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`, {
    bookType: 'xlsx',
    type: 'binary'
  });

  return true;
}

/**
 * Generic Excel export function for any tabular dataset
 */
export async function exportToExcel(filename, rows, columns, sheetName = 'Sheet1') {
  if (!rows || rows.length === 0) {
    throw new Error('NO_DATA');
  }

  const headers = columns.map(c => c.header || c.label || c.key || '');
  const dataRows = rows.map(row => {
    return columns.map(c => {
      let val = '';
      if (typeof c.accessor === 'function') {
        val = c.accessor(row);
      } else if (c.key && row[c.key] !== undefined) {
        val = row[c.key];
      }
      if (val === null || val === undefined) val = '';
      return String(val);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: dataRows.length, c: headers.length - 1 }
    })
  };
  ws['!views'] = [{ xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2', state: 'frozen' }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`, {
    bookType: 'xlsx',
    type: 'binary'
  });

  return true;
}


