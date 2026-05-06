const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const os = require('os');

const runtimeRoot = process.env.VERCEL ? path.join(os.tmpdir(), 'teamsheet') : path.join(__dirname, '..');

// Configure export directory
const exportDir = path.join(runtimeRoot, 'exports');

// Ensure export directory exists
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

/**
 * Export sheet rows to Excel file
 * Returns file path
 */
function exportSheetToExcel(db, sheetId, sheetName) {
  try {
    // Get sheet
    const sheet = db.prepare('SELECT name FROM sheets WHERE id = ?').get(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    // Get all rows
    const rows = db.prepare(
      'SELECT data FROM sheet_rows WHERE sheet_id = ? ORDER BY row_number ASC'
    ).all(sheetId);

    if (rows.length === 0) {
      throw new Error('No data to export');
    }

    // Parse JSON data back to objects
    const data = rows.map(row => JSON.parse(row.data));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || sheet.name);

    // Generate filename
    const timestamp = Date.now();
    const filename = `export_${sheetId}_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, filename);

    // Write file
    XLSX.writeFile(wb, filePath);

    return {
      success: true,
      message: 'Sheet exported successfully',
      filePath,
      filename,
      rowCount: rows.length
    };
  } catch (error) {
    throw new Error(`Export error: ${error.message}`);
  }
}

/**
 * Export multiple sheets to a single Excel file
 */
function exportMultipleSheetsToExcel(db, sheetIds) {
  try {
    if (!Array.isArray(sheetIds) || sheetIds.length === 0) {
      throw new Error('At least one sheet ID is required');
    }

    const wb = XLSX.utils.book_new();

    // Add each sheet to workbook
    for (const sheetId of sheetIds) {
      const sheet = db.prepare('SELECT name FROM sheets WHERE id = ?').get(sheetId);
      if (!sheet) {
        console.warn(`Sheet ${sheetId} not found, skipping`);
        continue;
      }

      const rows = db.prepare(
        'SELECT data FROM sheet_rows WHERE sheet_id = ? ORDER BY row_number ASC'
      ).all(sheetId);

      if (rows.length === 0) {
        console.warn(`Sheet ${sheetId} has no data, skipping`);
        continue;
      }

      // Parse JSON data
      const data = rows.map(row => JSON.parse(row.data));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = `export_multi_${timestamp}.xlsx`;
    const filePath = path.join(exportDir, filename);

    // Write file
    XLSX.writeFile(wb, filePath);

    return {
      success: true,
      message: 'Sheets exported successfully',
      filePath,
      filename,
      sheetCount: Object.keys(wb.Sheets).length
    };
  } catch (error) {
    throw new Error(`Export error: ${error.message}`);
  }
}

/**
 * Get export file for download
 */
function getExportFile(filename) {
  try {
    const filePath = path.join(exportDir, filename);

    // Security check: ensure file is in export directory
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(exportDir);

    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error('Invalid file path');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('Export file not found');
    }

    return filePath;
  } catch (error) {
    throw new Error(`Get export file error: ${error.message}`);
  }
}

/**
 * Clean up old export files (older than 24 hours)
 */
function cleanupOldExports(maxAgeHours = 24) {
  try {
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();

    const files = fs.readdirSync(exportDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(exportDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} old export files`
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      message: 'Cleanup failed',
      error: error.message
    };
  }
}

module.exports = {
  exportSheetToExcel,
  exportMultipleSheetsToExcel,
  getExportFile,
  cleanupOldExports
};
