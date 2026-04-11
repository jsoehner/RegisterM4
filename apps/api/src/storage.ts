import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Database } from "./types.js";

function resolveDataPaths(): { dataDir: string; dbFile: string } {
  const baseDir = process.env.API_DATA_DIR?.trim() || path.resolve(process.cwd(), "data");
  return {
    dataDir: baseDir,
    dbFile: path.join(baseDir, "db.json")
  };
}

const initialDb: Database = {
  users: [],
  credentials: [],
  schedules: [],
  attempts: []
};

export function loadDb(): Database {
  const { dataDir, dbFile } = resolveDataPaths();

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  if (!existsSync(dbFile)) {
    saveDb(initialDb);
    return structuredClone(initialDb);
  }

  const raw = readFileSync(dbFile, "utf8");
  return JSON.parse(raw) as Database;
}

export function saveDb(db: Database): void {
  const { dataDir, dbFile } = resolveDataPaths();

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf8");
}
