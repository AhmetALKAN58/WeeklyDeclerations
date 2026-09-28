/**
 * UI verification: seed a completed held week, assert Go to next week button,
 * click it, confirm advance + last submission still persisted.
 *
 * Usage: node scripts/verify-next-week-ui.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.APP_URL || "http://127.0.0.1:5173";
const HELD_WEEK = "2026-09-21";
const CURRENT_AT = "2026-09-28T10:00:00";
const ARTIFACT_DIR = "/opt/cursor/artifacts/screenshots";

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function buildCompleteReport(weekStart) {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const shifts = ["morning", "evening", "night"];
  const submittedAt = "2026-09-27T23:00:00.000Z";
  const dayOffset = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };

  function filledOrder(date) {
    return {
      date,
      ladder: {
        qty: "1",
        outstanding: "",
        rush: "",
        superRush: "",
        other: "",
        typeQty: "",
      },
      grill: {
        frameSD: "",
        frameDD: "",
        frameER: "",
        framePF: "",
        outstanding: "",
        rushSuperRush: "",
        frameSF: "",
        frameHF: "",
        typeQty: "",
      },
      oem: {
        shortLongPanel: "",
        superLongPanel: "",
        extraLongPanel: "",
        shortLongFrame: "",
        superLongFrame: "",
        extraLongFrame: "",
      },
      linear: {
        frames: "",
        cores: "",
        outstanding: "",
        rush: "",
        superRush: "",
        other: "",
        typeQty: "",
      },
      diffuser: {
        size6: "",
        size8: "",
        size10: "",
        size12: "",
        size14: "",
        size0: "",
        autres: "",
        iso: "",
        smallCone: "",
        middleCone: "",
        largeCone: "",
        threeCupeCone: "",
        perf: "",
        dsw: "",
        autre2: "",
        outstanding: "",
        core12: "",
        iso12: "",
        shell12: "",
        alumDf: "",
        collets: "",
        rushSuperRush: "",
        autre3: "",
        typeQty: "",
      },
      other: "",
      boxUsed: "2",
      submitted: true,
      submittedAt,
    };
  }

  function meetingDay() {
    return {
      topics: "ok",
      conclusions: "ok",
      nameA: "a",
      nameB: "b",
      signatureA: "",
      signatureB: "",
      submitted: true,
      submittedAt,
    };
  }

  function repaintDay() {
    return {
      rows: [
        { material: "steel", repaintQty: "1", recyclingQty: "", badQty: "" },
        { material: "", repaintQty: "", recyclingQty: "", badQty: "" },
        { material: "", repaintQty: "", recyclingQty: "", badQty: "" },
      ],
      submitted: true,
      submittedAt,
    };
  }

  const report = { weekStart, shifts: {} };
  for (const shift of shifts) {
    const orders = {};
    const meeting = {};
    const repaint = {};
    for (const day of days) {
      const date = addDays(weekStart, dayOffset[day]);
      orders[day] = filledOrder(date);
      meeting[day] = meetingDay();
      repaint[day] = repaintDay();
    }
    report.shifts[shift] = {
      orders,
      meeting,
      meetingSubmitted: true,
      meetingSubmittedAt: submittedAt,
      repaint,
      repaintSubmitted: true,
      repaintSubmittedAt: submittedAt,
    };
  }
  return report;
}

async function seedHeldWeek(page, report) {
  // Same-origin seed: open the app origin, write IDB, then reload with frozen clock.
  await page.goto(`${BASE}/index.html?at=${encodeURIComponent(CURRENT_AT)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => {
    try {
      void window.localStorage;
      return true;
    } catch {
      return false;
    }
  });
  await page.evaluate(
    async ({ report, weekStart }) => {
      localStorage.setItem("paintline-last-week", weekStart);
      await new Promise((resolve) => {
        const del = indexedDB.deleteDatabase("paintline-weekly");
        del.onsuccess = () => resolve();
        del.onerror = () => resolve();
        del.onblocked = () => resolve();
      });
      await new Promise((resolve, reject) => {
        const openReq = indexedDB.open("paintline-weekly", 1);
        openReq.onupgradeneeded = () => {
          openReq.result.createObjectStore("reports");
        };
        openReq.onerror = () => reject(openReq.error);
        openReq.onsuccess = () => {
          const db = openReq.result;
          const tx = db.transaction("reports", "readwrite");
          tx.objectStore("reports").put(
            { report, savedAt: new Date().toISOString() },
            weekStart,
          );
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { report, weekStart: report.weekStart },
  );
  await page.reload({ waitUntil: "networkidle" });
}

async function readPersistedOrder(page, weekStart, shift, day) {
  return page.evaluate(
    async ({ weekStart, shift, day }) => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("paintline-weekly", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const value = await new Promise((resolve, reject) => {
        const tx = db.transaction("reports", "readonly");
        const req = tx.objectStore("reports").get(weekStart);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      const report = value?.report ?? value;
      return report?.shifts?.[shift]?.orders?.[day] ?? null;
    },
    { weekStart, shift, day },
  );
}

await mkdir(ARTIFACT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-web-security", "--allow-file-access-from-files"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
});

{
  const page = await context.newPage();
  const report = buildCompleteReport(HELD_WEEK);
  await seedHeldWeek(page, report);
  await page.goto(`${BASE}/?at=${encodeURIComponent(CURRENT_AT)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("text=Semaine précédente / Previous week");
  await page.waitForSelector(".save-pill.saved, .save-pill.local", {
    timeout: 15_000,
  });
  const btn = page.getByRole("button", {
    name: "Aller à la semaine suivante / Go to next week",
  });
  await btn.first().waitFor({ state: "visible", timeout: 10_000 });
  await page.screenshot({
    path: `${ARTIFACT_DIR}/next-week-button-visible.png`,
    fullPage: true,
  });
  const countBefore = await btn.count();
  await btn.first().click();
  await page.waitForSelector("text=Semaine en cours / Current week", {
    timeout: 10_000,
  });
  await page.screenshot({
    path: `${ARTIFACT_DIR}/next-week-after-advance.png`,
    fullPage: true,
  });
  const nightSunday = await readPersistedOrder(
    page,
    HELD_WEEK,
    "night",
    "sunday",
  );
  console.log(
    JSON.stringify(
      {
        scenario: "complete-week-advance",
        buttonCountBeforeClick: countBefore,
        advancedToCurrent: true,
        heldNightSundaySubmitted: Boolean(nightSunday?.submitted),
        heldNightSundayBoxUsed: nightSunday?.boxUsed ?? null,
      },
      null,
      2,
    ),
  );
  if (!nightSunday?.submitted) {
    console.error("FAIL: held week last order lost after advance");
    process.exit(1);
  }
  await page.close();
}

{
  const page = await context.newPage();
  const report = buildCompleteReport(HELD_WEEK);
  report.shifts.night.orders.sunday.submitted = false;
  report.shifts.night.orders.sunday.submittedAt = "";
  await seedHeldWeek(page, report);
  await page.goto(`${BASE}/?at=${encodeURIComponent(CURRENT_AT)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("text=Semaine précédente / Previous week");
  await page.waitForSelector(".save-pill.saved, .save-pill.local", {
    timeout: 15_000,
  });
  // Give effects a beat
  await page.waitForTimeout(500);
  const btn = page.getByRole("button", {
    name: "Aller à la semaine suivante / Go to next week",
  });
  const visible = await btn.count();
  await page.screenshot({
    path: `${ARTIFACT_DIR}/next-week-button-hidden-while-pending.png`,
    fullPage: true,
  });
  console.log(
    JSON.stringify(
      {
        scenario: "pending-last-order",
        buttonCount: visible,
        holdMessageVisible: await page
          .locator("text=Submit remaining forms")
          .count(),
      },
      null,
      2,
    ),
  );
  if (visible !== 0) {
    console.error("FAIL: button should be hidden while an order is pending");
    process.exit(1);
  }
  await page.close();
}

await browser.close();
console.error("OK: UI next-week button verify passed");
