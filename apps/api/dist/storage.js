import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
function resolveDataPaths() {
    const baseDir = process.env.API_DATA_DIR?.trim() || path.resolve(process.cwd(), "data");
    return {
        dataDir: baseDir,
        dbFile: path.join(baseDir, "db.json")
    };
}
const initialDb = {
    users: [],
    credentials: [],
    schedules: [],
    attempts: []
};
export function loadDb() {
    const { dataDir, dbFile } = resolveDataPaths();
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }
    if (!existsSync(dbFile)) {
        saveDb(initialDb);
        return structuredClone(initialDb);
    }
    const raw = readFileSync(dbFile, "utf8");
    return JSON.parse(raw);
}
export function saveDb(db) {
    const { dataDir, dbFile } = resolveDataPaths();
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }
    writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf8");
}
