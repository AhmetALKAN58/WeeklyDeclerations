import { emptyReport, normalizeReport, type WeeklyReport } from "./model";

const DB_NAME = "paintline-weekly";
const STORE = "reports";
const LAST_WEEK_KEY = "paintline-last-week";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadReport(weekStart: string): Promise<WeeklyReport> {
  try {
    const db = await openDb();
    const report = await new Promise<WeeklyReport | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(weekStart);
      req.onsuccess = () => resolve(req.result as WeeklyReport | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return report && report.weekStart === weekStart
      ? normalizeReport(report, weekStart)
      : emptyReport(weekStart);
  } catch {
    return emptyReport(weekStart);
  }
}

export async function saveReport(report: WeeklyReport): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(report, report.weekStart);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  localStorage.setItem(LAST_WEEK_KEY, report.weekStart);
}

export function getLastWeek(): string | null {
  return localStorage.getItem(LAST_WEEK_KEY);
}

export async function listWeeks(): Promise<string[]> {
  try {
    const db = await openDb();
    const keys = await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result.map(String));
      req.onerror = () => reject(req.error);
    });
    db.close();
    return keys.sort();
  } catch {
    return [];
  }
}

export function downloadJson(report: WeeklyReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `paintline-week-${report.weekStart}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<WeeklyReport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as WeeklyReport;
        if (!data?.weekStart || !data?.shifts) {
          reject(new Error("Invalid report file"));
          return;
        }
        resolve(normalizeReport(data, data.weekStart));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
