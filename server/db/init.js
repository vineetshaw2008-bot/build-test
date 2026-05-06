const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

const runtimeRoot = process.env.VERCEL ? path.join(os.tmpdir(), 'teamsheet') : path.join(__dirname, '..');

// Ensure data directory exists
const dataDir = path.join(runtimeRoot, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const dbPath = path.join(dataDir, 'teamsheet.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 * Creates tables for users, teams, sheets, and sheet_rows
 */
function initializeDatabase() {
  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create teams table
    db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create team members table (for multi-user teams)
    db.exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(team_id, user_id)
      )
    `);

    // Create sheets table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        columns_config TEXT,
        form_enabled INTEGER DEFAULT 0,
        form_fields TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    // Create sheet_rows table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sheet_rows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sheet_id INTEGER NOT NULL,
        row_number INTEGER NOT NULL,
        data JSON NOT NULL,
        submitted_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE,
        FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    runMigrations();

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
}

function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function runMigrations() {
  addColumnIfMissing('users', 'role', "TEXT DEFAULT 'member'");
  addColumnIfMissing('sheets', 'columns_config', 'TEXT');
  addColumnIfMissing('sheets', 'form_enabled', 'INTEGER DEFAULT 0');
  addColumnIfMissing('sheets', 'form_fields', 'TEXT');
  addColumnIfMissing('sheet_rows', 'submitted_by', 'INTEGER');
}

/**
 * Get database connection
 */
function getDatabase() {
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  db.close();
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
