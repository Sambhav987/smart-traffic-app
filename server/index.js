const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const PORT = 4000;

// Path to your existing SQLite database file.
// Override at runtime with the DB_PATH env var, or edit the fallback below.
const DB_PATH = process.env.DB_PATH || path.join('D:/Sambhav/Understanding AI/smart-traffic/', 'db.sqlite3');
const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
console.log(`Opened SQLite DB at ${DB_PATH}`);

const app = express();
app.use(cors());

// Replace TABLE_NAME with your actual Django table, e.g. 'traffic_congestion'.
const TABLE_NAME = process.env.TABLE_NAME || 'core_congestion';

app.get('/congestions', (req, res) => {
  try {
    const rows = db
      .prepare(`SELECT timestamp, num_cars, section FROM ${TABLE_NAME} ORDER BY id DESC`)
      .all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/accidents', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM core_accident ORDER BY id DESC').all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/historic-data', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM historic_data LIMIT 20').all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/tables', (_req, res) => {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();
  res.json(rows.map(r => r.name));
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart traffic server listening on http://0.0.0.0:${PORT}`);
});
