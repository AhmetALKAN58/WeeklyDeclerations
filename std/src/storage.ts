import { createClient } from "@supabase/supabase-js";
import {
  emptyReport,
  mergeKeepSubmitted,
  normalizeReport,
  type WeeklyReport,
} from "./model";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const TABLE = "std_weeks";
const DB_NAME = "std-weekly";
const STORE = "reports";
const LAST_WEEK_KEY = "std-last-week";
const OPEN_WEEK_KEY = "std-open-week";
const REMOTE_LOAD_TIMEOUT_MS = 8_000;

export class RemoteSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RemoteSaveError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function openDb(): Promise<IDBDatabase> {
  return withTimeout(
    new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }),
    2_000,
    "IndexedDB",
  );
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
  if (error) {
    const code = "code" in error ? String(error.code) : "";
    // No row yet for this week. A missing table is the same for a new
    // department: keep the week on the tablet until std_weeks exists.
    if (code === "PGRST116" || code === "PGRST205") return null;
    if (/could not find the table/i.test(error.message)) return null;
    throw new RemoteSaveError(error.message);
  }
  if (!data?.report) return null;
  return {
    report: normalizeReport(data.report as WeeklyReport, weekStart),
    updatedAt: String(data.updated_at ?? ""),
  };
}

async function loadReportInner(weekStart: string): Promise<WeeklyReport> {
  const local = await readLocal(weekStart);
  try {
    const remote = await withTimeout(
      readRemote(weekStart),
      REMOTE_LOAD_TIMEOUT_MS,
      "Supabase loadReport",
    );
    const freshLocal = (await readLocal(weekStart)) ?? local;
    if (!remote) return freshLocal?.report ?? emptyReport(weekStart);
    const newer =
      freshLocal && freshLocal.savedAt > remote.updatedAt
        ? freshLocal.report
        : remote.report;
    const older =
      freshLocal && freshLocal.savedAt > remote.updatedAt
        ? remote.report
        : freshLocal?.report;
    const merged = mergeKeepSubmitted(newer, older, weekStart);
    const savedAt =
      freshLocal && freshLocal.savedAt > remote.updatedAt
        ? freshLocal.savedAt
        : remote.updatedAt;
    await writeLocal(merged, savedAt || new Date().toISOString());
    return merged;
  } catch (err) {
    const fallback = (await readLocal(weekStart)) ?? local;
    if (fallback) return fallback.report;
    throw err instanceof Error ? err : new Error("loadReport failed");
  }
}

export async function loadReport(weekStart: string): Promise<WeeklyReport> {
  return withTimeout(loadReportInner(weekStart), 15_000, "loadReport");
}

let saveQueue: Promise<void> = Promise.resolve();

async function saveReportNow(report: WeeklyReport): Promise<void> {
  const savedAt = new Date().toISOString();
  const local = await readLocal(report.weekStart);
  let merged = mergeKeepSubmitted(report, local?.report, report.weekStart);
  if (supabase) {
    try {
      const remote = await withTimeout(
        readRemote(report.weekStart),
        3_000,
        "Supabase save merge",
      );
      if (remote) {
        merged = mergeKeepSubmitted(merged, remote.report, report.weekStart);
      }
    } catch {
      // Keep the local merge. A hung read must not block the tablet.
    }
  }
  await writeLocal(merged, savedAt);
  if (!supabase) {
    throw new RemoteSaveError("Supabase is not configured");
  }
  await withTimeout(
    Promise.resolve(
      supabase
        .from(TABLE)
        .upsert(
          { week_start: merged.weekStart, report: merged },
          { onConflict: "week_start" },
        ),
    ).then((result) => {
      if (result.error) throw new RemoteSaveError(result.error.message);
    }),
    REMOTE_LOAD_TIMEOUT_MS,
    "Supabase saveReport",
  );
}

export function saveReport(report: WeeklyReport): Promise<void> {
  const snapshot = report;
  const run = saveQueue.then(() => saveReportNow(snapshot));
  saveQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function getLastWeek(): string | null {
  return localStorage.getItem(LAST_WEEK_KEY);
}

export function getOpenWeek(): string | null {
  return localStorage.getItem(OPEN_WEEK_KEY);
}

export function setOpenWeek(weekStart: string): void {
  localStorage.setItem(OPEN_WEEK_KEY, weekStart);
}
