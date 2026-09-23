import { createClient } from "@supabase/supabase-js";
import { emptyReport, normalizeReport, type WeeklyReport } from "./model";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const TABLE = "paint_line_weeks";

export class RemoteSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RemoteSaveError";
  }
}

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

type LocalCopy = { report: WeeklyReport; savedAt: string };

function asLocalCopy(value: unknown, weekStart: string): LocalCopy | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<LocalCopy> & Partial<WeeklyReport>;
  const report = row.report?.weekStart ? row.report : (row as WeeklyReport);
  if (!report?.weekStart || report.weekStart !== weekStart) return null;
  return {
    report: normalizeReport(report, weekStart),
    savedAt: row.savedAt || "",
  };
}

async function readLocal(weekStart: string): Promise<LocalCopy | null> {
  try {
    const db = await openDb();
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(weekStart);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return asLocalCopy(value, weekStart);
  } catch {
    return null;
  }
}

async function writeLocal(report: WeeklyReport, savedAt: string): Promise<void> {
  const db = await openDb();
  const copy: LocalCopy = { report, savedAt };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(copy, report.weekStart);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  localStorage.setItem(LAST_WEEK_KEY, report.weekStart);
}

async function readRemote(
  weekStart: string,
): Promise<{ report: WeeklyReport; updatedAt: string } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("report, updated_at")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new RemoteSaveError(error.message);
  if (!data?.report) return null;
  return {
    report: normalizeReport(data.report as WeeklyReport, weekStart),
    updatedAt: String(data.updated_at ?? ""),
  };
}

export async function loadReport(weekStart: string): Promise<WeeklyReport> {
  const local = await readLocal(weekStart);
  try {
    const remote = await readRemote(weekStart);
    if (!remote) return local?.report ?? emptyReport(weekStart);
    if (local && local.savedAt > remote.updatedAt) return local.report;
    await writeLocal(remote.report, remote.updatedAt);
    return remote.report;
  } catch {
    return local?.report ?? emptyReport(weekStart);
  }
}

export async function saveReport(report: WeeklyReport): Promise<void> {
  const savedAt = new Date().toISOString();
  await writeLocal(report, savedAt);
  if (!supabase) {
    throw new RemoteSaveError("Supabase is not configured");
  }
  const { error } = await supabase.from(TABLE).upsert(
    { week_start: report.weekStart, report },
    { onConflict: "week_start" },
  );
  if (error) throw new RemoteSaveError(error.message);
}

export function getLastWeek(): string | null {
  return localStorage.getItem(LAST_WEEK_KEY);
}

export async function listWeeks(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("week_start")
    .order("week_start");
  if (error || !data) return [];
  return data.map((row) => String(row.week_start));
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
