import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(DB_DIR, 'platform.db');

// Ensure the data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ============================================================
// SCHEMA INITIALIZATION
// ============================================================
function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      full_name   TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'PLAINTIFF_LAWYER'
                  CHECK (role IN ('JUDGE', 'PLAINTIFF_LAWYER', 'DEFENSE_LAWYER')),
      avatar_url  TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cases (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
      judge_id    TEXT NOT NULL REFERENCES users(id),
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS case_participants (
      id         TEXT PRIMARY KEY,
      case_id    TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users(id),
      side       TEXT NOT NULL CHECK (side IN ('PLAINTIFF', 'DEFENSE')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(case_id, side)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id          TEXT PRIMARY KEY,
      case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      title       TEXT NOT NULL,
      type        TEXT NOT NULL CHECK (type IN ('DEMAND', 'RESPONSE', 'MOTION', 'EVIDENCE', 'ORDER', 'SENTENCE')),
      file_url    TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS case_events (
      id          TEXT PRIMARY KEY,
      case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      event_type  TEXT NOT NULL,
      description TEXT,
      created_by  TEXT NOT NULL REFERENCES users(id),
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      case_id    TEXT REFERENCES cases(id) ON DELETE SET NULL,
      message    TEXT NOT NULL,
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_cases_judge_id ON cases(judge_id);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_case_participants_case_id ON case_participants(case_id);
    CREATE INDEX IF NOT EXISTS idx_case_participants_user_id ON case_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
    CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
  `);
}

// Initialize on import
initDb();

// ============================================================
// QUERY BUILDER — Supabase-compatible fluent API
// ============================================================

/**
 * Converts SQLite boolean integers to JS booleans for known fields.
 */
function normalizeRow(row) {
  if (!row) return row;
  if ('is_read' in row) row.is_read = !!row.is_read;
  return row;
}

class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._operation = 'select'; // select | insert | update | upsert | delete
    this._selectCols = '*';
    this._wheres = [];
    this._whereParams = [];
    this._inClauses = [];
    this._orderBy = null;
    this._limit = null;
    this._single = false;
    this._insertData = null;
    this._updateData = null;
    this._upsertConflict = null;
    this._returnSelect = false;
    this._returnCols = '*';
  }

  // --- OPERATIONS ---

  select(cols) {
    this._operation = 'select';
    this._selectCols = cols || '*';
    return this;
  }

  insert(data) {
    this._operation = 'insert';
    this._insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this._operation = 'update';
    this._updateData = data;
    return this;
  }

  upsert(data, opts = {}) {
    this._operation = 'upsert';
    this._insertData = Array.isArray(data) ? data : [data];
    this._upsertConflict = opts.onConflict || null;
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  // --- FILTERS ---

  eq(col, val) {
    if (typeof val === 'boolean') val = val ? 1 : 0;
    this._wheres.push(`${col} = ?`);
    this._whereParams.push(val);
    return this;
  }

  neq(col, val) {
    this._wheres.push(`${col} != ?`);
    this._whereParams.push(val);
    return this;
  }

  in(col, vals) {
    if (!vals || vals.length === 0) {
      // Force no results
      this._wheres.push('1 = 0');
    } else {
      const placeholders = vals.map(() => '?').join(', ');
      this._wheres.push(`${col} IN (${placeholders})`);
      this._whereParams.push(...vals);
    }
    return this;
  }

  ilike(col, pattern) {
    // SQLite LIKE is case-insensitive for ASCII by default
    this._wheres.push(`${col} LIKE ?`);
    this._whereParams.push(pattern);
    return this;
  }

  // --- MODIFIERS ---

  order(col, opts = {}) {
    const dir = opts.ascending === false ? 'DESC' : 'ASC';
    this._orderBy = `${col} ${dir}`;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    this._limit = 1;
    return this;
  }

  // Allow chaining .select() after .insert()/.update() to return rows
  // When called after insert/update, this signals "return the inserted/updated data"
  _chainSelect(cols) {
    this._returnSelect = true;
    this._returnCols = cols || '*';
    return this;
  }

  // --- EXECUTE ---

  then(resolve, reject) {
    try {
      const result = this._execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }

  _execute() {
    try {
      switch (this._operation) {
        case 'select':
          return this._execSelect();
        case 'insert':
          return this._execInsert();
        case 'update':
          return this._execUpdate();
        case 'upsert':
          return this._execUpsert();
        case 'delete':
          return this._execDelete();
        default:
          return { data: null, error: new Error(`Unknown operation: ${this._operation}`) };
      }
    } catch (err) {
      // Map SQLite errors to Supabase-like error objects
      const error = { message: err.message, code: err.code };
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        error.code = '23505'; // Postgres unique violation code for compatibility
      }
      return { data: null, error };
    }
  }

  _buildWhere() {
    if (this._wheres.length === 0) return { clause: '', params: [] };
    return {
      clause: ' WHERE ' + this._wheres.join(' AND '),
      params: [...this._whereParams],
    };
  }

  _parseSelectCols(cols) {
    // Parse simple column lists, ignoring Supabase join syntax
    if (!cols || cols === '*') return '*';
    // Remove Supabase relation syntax like "*, judge:users!cases_judge_id_fkey(id, full_name)"
    // Just extract the plain columns
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of cols) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        const trimmed = current.trim();
        if (trimmed && !trimmed.includes(':') && !trimmed.includes('!')) {
          parts.push(trimmed);
        }
        current = '';
        continue;
      }
      if (depth === 0) current += ch;
    }
    const trimmed = current.trim();
    if (trimmed && !trimmed.includes(':') && !trimmed.includes('!')) {
      parts.push(trimmed);
    }
    return parts.length > 0 ? parts.join(', ') : '*';
  }

  _execSelect() {
    const cols = this._parseSelectCols(this._selectCols);
    let sql = `SELECT ${cols} FROM ${this._table}`;
    const { clause, params } = this._buildWhere();
    sql += clause;
    if (this._orderBy) sql += ` ORDER BY ${this._orderBy}`;
    if (this._limit) sql += ` LIMIT ${this._limit}`;

    const rows = sqlite.prepare(sql).all(...params).map(normalizeRow);

    if (this._single) {
      return { data: rows[0] || null, error: rows[0] ? null : { message: 'Row not found', code: 'PGRST116' } };
    }
    return { data: rows, error: null };
  }

  _execInsert() {
    const rows = this._insertData;
    if (!rows || rows.length === 0) return { data: null, error: null };

    const results = [];
    for (const row of rows) {
      const keys = Object.keys(row);
      const vals = keys.map((k) => {
        const v = row[k];
        if (typeof v === 'boolean') return v ? 1 : 0;
        return v;
      });
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders})`;
      sqlite.prepare(sql).run(...vals);

      if (this._returnSelect) {
        // Fetch the inserted row back
        const id = row.id;
        if (id) {
          const fetched = sqlite.prepare(`SELECT * FROM ${this._table} WHERE id = ?`).get(id);
          results.push(normalizeRow(fetched));
        }
      }
    }

    if (this._returnSelect) {
      if (this._single) {
        return { data: results[0] || null, error: null };
      }
      return { data: results, error: null };
    }
    return { data: null, error: null };
  }

  _execUpdate() {
    const data = this._updateData;
    if (!data || Object.keys(data).length === 0) return { data: null, error: null };

    const keys = Object.keys(data);
    const vals = keys.map((k) => {
      const v = data[k];
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    });
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const { clause, params } = this._buildWhere();
    const sql = `UPDATE ${this._table} SET ${setClause}${clause}`;
    sqlite.prepare(sql).run(...vals, ...params);

    if (this._returnSelect) {
      // Fetch updated rows
      const returnCols = this._parseSelectCols(this._returnCols);
      let fetchSql = `SELECT ${returnCols} FROM ${this._table}${clause}`;
      const rows = sqlite.prepare(fetchSql).all(...params).map(normalizeRow);
      if (this._single) {
        return { data: rows[0] || null, error: null };
      }
      return { data: rows, error: null };
    }
    return { data: null, error: null };
  }

  _execUpsert() {
    const rows = this._insertData;
    if (!rows || rows.length === 0) return { data: null, error: null };

    for (const row of rows) {
      const keys = Object.keys(row);
      const vals = keys.map((k) => {
        const v = row[k];
        if (typeof v === 'boolean') return v ? 1 : 0;
        return v;
      });
      const placeholders = keys.map(() => '?').join(', ');

      // Build ON CONFLICT clause
      const conflictCol = this._upsertConflict || 'id';
      const updateCols = keys.filter((k) => k !== conflictCol);
      const updateClause = updateCols.map((k) => `${k} = excluded.${k}`).join(', ');

      const sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders})
        ON CONFLICT(${conflictCol}) DO UPDATE SET ${updateClause}`;
      sqlite.prepare(sql).run(...vals);
    }

    return { data: null, error: null };
  }

  _execDelete() {
    const { clause, params } = this._buildWhere();
    const sql = `DELETE FROM ${this._table}${clause}`;
    sqlite.prepare(sql).run(...params);
    return { data: null, error: null };
  }
}

// ============================================================
// Proxy: Override .select() when chained after .insert()/.update()
// so it acts as "return data" instead of starting a new select.
// We do this by wrapping the builder in a Proxy.
// ============================================================

function createQueryBuilder(table) {
  const builder = new QueryBuilder(table);

  return new Proxy(builder, {
    get(target, prop) {
      if (prop === 'select' && (target._operation === 'insert' || target._operation === 'update')) {
        return (cols) => {
          target._returnSelect = true;
          target._returnCols = cols || '*';
          return new Proxy(target, {
            get(t, p) {
              if (p === 'single') return () => { t._single = true; return t; };
              return t[p];
            }
          });
        };
      }
      return target[prop];
    },
  });
}

// ============================================================
// EXPORTED DB OBJECT — mimics Supabase client
// ============================================================

export const db = {
  from(table) {
    return createQueryBuilder(table);
  },
};

export { sqlite, initDb };
