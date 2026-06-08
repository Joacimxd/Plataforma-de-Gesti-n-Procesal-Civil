/**
 * Schema Migration System
 * 
 * Tracks applied migrations in a `_migrations` table.
 * Each migration is a numbered function that runs SQL.
 * New migrations are automatically applied on server startup.
 */

/**
 * Define migrations as an ordered array.
 * Each entry: { version: number, name: string, up: (sqlite) => void }
 * 
 * NEVER modify or reorder existing migrations.
 * Always append new ones at the end with the next version number.
 */
const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up: (sqlite) => {
      // Initial schema is created in db.js initDb()
      // This migration just marks the baseline
    },
  },
  // Future migrations go here, e.g.:
  // {
  //   version: 2,
  //   name: 'add_case_priority',
  //   up: (sqlite) => {
  //     sqlite.exec(`ALTER TABLE cases ADD COLUMN priority TEXT DEFAULT 'NORMAL'`);
  //   },
  // },
];

/**
 * Run all pending migrations.
 * @param {import('better-sqlite3').Database} sqlite 
 */
export function runMigrations(sqlite) {
  // Create migrations tracking table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name    TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    sqlite.prepare('SELECT version FROM _migrations').all().map((r) => r.version)
  );

  let count = 0;
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    console.log(`📦 Running migration ${migration.version}: ${migration.name}`);
    try {
      migration.up(sqlite);
      sqlite.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(
        migration.version,
        migration.name
      );
      count++;
    } catch (err) {
      console.error(`❌ Migration ${migration.version} failed:`, err.message);
      throw err;
    }
  }

  if (count > 0) {
    console.log(`✅ ${count} migration(s) applied`);
  }
}
