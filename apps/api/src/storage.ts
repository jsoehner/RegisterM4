import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Database } from "./types.js";

const dataDir = path.resolve(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");

const initialDb: Database = {
  users: [],
  credentials: [],
  schedules: [],
  attempts: []
};

export function loadDb(): Database {
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
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf8");
}
