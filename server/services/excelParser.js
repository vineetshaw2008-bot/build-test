const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const runtimeRoot = process.env.VERCEL ? path.join(os.tmpdir(), 'teamsheet') : path.join(__dirname, '..');

// Configure multer for file uploads
const uploadDir = path.join(runtimeRoot, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow only Excel files (check by extension and MIME type)
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/octet-stream'
    ];
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isValidExt = allowedExtensions.includes(fileExt);
    const isValidMime = allowedMimes.includes(file.mimetype);

    if (isValidExt || isValidMime) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel or CSV files (.xlsx, .xls, .csv) are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * Parse Excel file and extract data
 * Returns: { sheets: [{ name, headers, rows }] }
 */
function parseExcelFile(filePath) {
  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    const result = {
      sheets: []
    };

    // Process each sheet
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        continue; // Skip empty sheets
      }

      // Get headers from first row
      const headers = Object.keys(jsonData[0]);

      result.sheets.push({
        name: sheetName,
        headers,
        rows: jsonData.map((row, index) => ({
          row_number: index + 1,
          data: row
        }))
      });
    }

    return result;
  } catch (error) {
    throw new Error(`Excel parsing error: ${error.message}`);
  }
}

/**
 * Import Excel file into a sheet
 */
function importExcelToSheet(db, filePath, sheetId) {
  try {
    const excelData = parseExcelFile(filePath);

    if (excelData.sheets.length === 0) {
      throw new Error('No data found in Excel file');
    }

    // Use the first sheet from Excel file
    const firstSheet = excelData.sheets[0];

    // Clear existing rows
    db.prepare('DELETE FROM sheet_rows WHERE sheet_id = ?').run(sheetId);

    // Insert new rows
    const insertStmt = db.prepare(
      'INSERT INTO sheet_rows (sheet_id, row_number, data) VALUES (?, ?, ?)'
    );

    const insertedRows = [];
    for (const row of firstSheet.rows) {
      const result = insertStmt.run(sheetId, row.row_number, JSON.stringify(row.data));
      insertedRows.push({
        id: result.lastInsertRowid,
        sheet_id: sheetId,
        ...row
      });
    }

    return {
      success: true,
      importedRowCount: insertedRows.length,
      rows: insertedRows,
      headers: firstSheet.headers,
      sheetName: firstSheet.name
    };
  } catch (error) {
    throw new Error(`Import error: ${error.message}`);
  } finally {
    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = {
  upload,
  parseExcelFile,
  importExcelToSheet
};
