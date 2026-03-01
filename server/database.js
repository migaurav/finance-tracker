const path = require('path');

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS monthly_tally (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT UNIQUE NOT NULL,
    closing_balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS credit_card_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL REFERENCES monthly_tally(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK(status IN ('PAID','UNPAID'))
  );

  CREATE TABLE IF NOT EXISTS emis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    monthly_amount REAL NOT NULL,
    start_date TEXT NOT NULL,
    tenure_months INTEGER NOT NULL,
    remaining_months INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','CLOSED'))
  );

  CREATE TABLE IF NOT EXISTS receivables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_name TEXT NOT NULL,
    amount REAL NOT NULL,
    date_given TEXT NOT NULL,
    expected_return_date TEXT,
    received_date TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RECEIVED'))
  );
`;

let db;

if (process.env.TURSO_DATABASE_URL) {
  // ── Production: Turso (libSQL) ──────────────────────────────────────────────
  const { createClient } = require('@libsql/client');
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  db = {
    all: async (sql, args = []) => {
      const result = await client.execute({ sql, args });
      return result.rows;
    },
    first: async (sql, args = []) => {
      const result = await client.execute({ sql, args });
      return result.rows[0] ?? null;
    },
    run: async (sql, args = []) => {
      const result = await client.execute({ sql, args });
      return {
        lastInsertRowid: Number(result.lastInsertRowid),
        changes: result.rowsAffected,
      };
    },
    exec: async (sql) => {
      await client.executeMultiple(sql);
    },
  };
} else {
  // ── Local dev: node:sqlite (sync, wrapped async) ────────────────────────────
  const { DatabaseSync } = require('node:sqlite');
  const DB_PATH = path.join(__dirname, 'finance.db');
  const localDb = new DatabaseSync(DB_PATH);

  db = {
    all: async (sql, args = []) => localDb.prepare(sql).all(...args),
    first: async (sql, args = []) => localDb.prepare(sql).get(...args) ?? null,
    run: async (sql, args = []) => {
      const info = localDb.prepare(sql).run(...args);
      return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    },
    exec: async (sql) => localDb.exec(sql),
  };
}

async function initDb() {
  // PRAGMAs only for local SQLite (Turso is cloud-managed)
  if (!process.env.TURSO_DATABASE_URL) {
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA foreign_keys = ON');
  }

  // Create tables
  await db.exec(SCHEMA_SQL);

  // Seed if empty
  const row = await db.first('SELECT COUNT(*) as c FROM monthly_tally');
  if (row.c === 0) {
    const m1 = await db.run(
      'INSERT INTO monthly_tally (month, closing_balance) VALUES (?, ?)',
      ['2026-02', 45000]
    );
    const m2 = await db.run(
      'INSERT INTO monthly_tally (month, closing_balance) VALUES (?, ?)',
      ['2026-03', 0]
    );

    await db.run(
      'INSERT INTO credit_card_bills (month_id, card_name, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [m1.lastInsertRowid, 'HDFC Regalia', 12500, '2026-02-15', 'PAID']
    );
    await db.run(
      'INSERT INTO credit_card_bills (month_id, card_name, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [m1.lastInsertRowid, 'ICICI Amazon Pay', 3200, '2026-02-20', 'PAID']
    );
    await db.run(
      'INSERT INTO credit_card_bills (month_id, card_name, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [m2.lastInsertRowid, 'HDFC Regalia', 9800, '2026-03-15', 'UNPAID']
    );
    await db.run(
      'INSERT INTO credit_card_bills (month_id, card_name, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [m2.lastInsertRowid, 'SBI SimplyCLICK', 4100, '2026-03-18', 'UNPAID']
    );

    await db.run(
      'INSERT INTO emis (name, total_amount, monthly_amount, start_date, tenure_months, remaining_months, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Home Loan - SBI', 3500000, 28500, '2023-04-01', 180, 134, 'ACTIVE']
    );
    await db.run(
      'INSERT INTO emis (name, total_amount, monthly_amount, start_date, tenure_months, remaining_months, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Car Loan - HDFC', 650000, 11200, '2024-01-01', 60, 46, 'ACTIVE']
    );
    await db.run(
      'INSERT INTO emis (name, total_amount, monthly_amount, start_date, tenure_months, remaining_months, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Personal Loan', 200000, 9500, '2025-06-01', 24, 15, 'ACTIVE']
    );

    await db.run(
      'INSERT INTO receivables (person_name, amount, date_given, expected_return_date, status) VALUES (?, ?, ?, ?, ?)',
      ['Rahul Sharma', 15000, '2026-01-10', '2026-02-28', 'PENDING']
    );
    await db.run(
      'INSERT INTO receivables (person_name, amount, date_given, expected_return_date, status) VALUES (?, ?, ?, ?, ?)',
      ['Priya Mehta', 5000, '2025-12-01', '2026-01-31', 'PENDING']
    );
    await db.run(
      'INSERT INTO receivables (person_name, amount, date_given, expected_return_date, status) VALUES (?, ?, ?, ?, ?)',
      ['Amit Verma', 8000, '2025-11-15', '2026-01-15', 'RECEIVED']
    );
  }
}

module.exports = { db, initDb };
