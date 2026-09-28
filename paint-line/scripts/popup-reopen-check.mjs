import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173";
const HELD = "2026-09-21";
const AT = "2026-09-28T10:00:00";

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

function reportFor(weekStart, { openNightSundayMeeting = false } = {}) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const shifts = ["morning", "evening", "night"];
  const off = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
  const submittedAt = "2026-09-28T11:00:00.000Z";
  const blankOrder = (date) => ({
    date, ladder: {}, grill: {}, oem: {}, linear: {}, diffuser: {}, other: "", boxUsed: "", submitted: false, submittedAt: "",
  });
  const meeting = (submitted) => ({
    topics: submitted ? "sent" : "", conclusions: "", nameA: "", nameB: "", signatureA: "", signatureB: "", submitted, submittedAt: submitted ? submittedAt : "",
  });
  const repaint = () => ({
    rows: [{ material: "steel", repaintQty: "1", recyclingQty: "", badQty: "" }],
    submitted: true,
    submittedAt,
  });
  const shiftsOut = {};
  for (const shift of shifts) {
    const orders = {};
    const meetings = {};
    const repaints = {};
    for (const day of days) {
      orders[day] = blankOrder(addDays(weekStart, off[day]));
      const open = openNightSundayMeeting && shift === "night" && day === "sunday";
      meetings[day] = meeting(!open);
      repaints[day] = repaint();
    }
    shiftsOut[shift] = {
      orders, meeting: meetings, meetingSubmitted: !openNightSundayMeeting,
      meetingSubmittedAt: submittedAt, repaint: repaints, repaintSubmitted: true, repaintSubmittedAt: submittedAt,
    };
  }
  return { weekStart, shifts: shiftsOut };
}

const db = {
  [HELD]: { report: reportFor(HELD, { openNightSundayMeeting: true }), updated_at: "2026-09-28T12:00:00+00:00" },
  "2026-09-28": { report: reportFor("2026-09-28"), updated_at: "2026-09-28T12:00:00+00:00" },
};

function installRoutes(page, { hang = false } = {}) {
  return page.route("**/*supabase.co/**", async (route) => {
    if (hang) return;
    const req = route.request();
    const url = new URL(req.url());
    if (!url.pathname.includes("paint_line_weeks")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    if (req.method() === "GET") {
      const week = url.searchParams.get("week_start")?.replace(/^eq\./, "");
      const row = week ? db[week] : null;
      if (!row) {
        await route.fulfill({
          status: 406,
          contentType: "application/json",
          body: JSON.stringify({ code: "PGRST116", message: "No rows" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ week_start: week, report: row.report, updated_at: row.updated_at }),
      });
      return;
    }
    const body = req.postDataJSON();
    if (body?.week_start && body.report) {
      db[body.week_start] = {
        report: body.report,
        updated_at: new Date().toISOString(),
      };
    }
    await route.fulfill({ status: 201, contentType: "application/json", body: "null" });
  });
}

async function pill(page) {
  return page.locator(".save-pill").innerText();
}

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const failures = [];
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures.push(name);
}

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await installRoutes(page);
  await page.goto(`${BASE}/?at=${encodeURIComponent(AT)}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".meeting-popup, .save-pill.saved, .save-pill.local", { timeout: 15000 });
  await page.waitForSelector(".meeting-popup", { timeout: 15000 });
  const before = await page.locator(".meeting-popup").innerText();
  check("opens the unsent night meeting", /nuit|Night/i.test(before) && /27/.test(before), before.slice(0, 120).replace(/\s+/g, " "));
  await page.locator(".meeting-popup textarea").first().fill("topics for sunday night");
  await page.locator(".meeting-popup").getByRole("button", { name: "Envoyer / Submit" }).click();
  await page.getByRole("button", { name: "Oui, envoyer / Yes, submit" }).click();
  await page.waitForSelector(".meeting-popup", { state: "detached", timeout: 8000 });
  await page.waitForTimeout(1500);
  const still = await page.locator(".meeting-popup").count();
  const button = await page.getByRole("button", { name: "Go to Next Week" }).count();
  const loading = (await pill(page)).includes("Chargement");
  check("popup stays closed after submit", still === 0, `popups=${still}`);
  check("next week button is shown", button > 0, `buttons=${button}`);
  check("not stuck loading after submit", !loading, await pill(page));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".save-pill.saved, .save-pill.local", { timeout: 15000 });
  await page.waitForTimeout(1000);
  check("reload does not reopen the meeting", (await page.locator(".meeting-popup").count()) === 0);
  await page.close();
}

{
  db[HELD] = { report: reportFor(HELD), updated_at: "2026-09-28T12:00:00+00:00" };
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await installRoutes(page);
  await page.goto(`${BASE}/?at=${encodeURIComponent(AT)}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".save-pill.saved, .save-pill.local", { timeout: 15000 });
  await page.evaluate(async (week) => {
    const stale = structuredClone(
      JSON.parse(localStorage.getItem("paintline-debug") || "null"),
    );
    void stale;
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("paintline-weekly", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const current = await new Promise((resolve, reject) => {
      const tx = db.transaction("reports", "readonly");
      const req = tx.objectStore("reports").get(week);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const report = structuredClone(current.report);
    for (const shift of Object.values(report.shifts)) {
      for (const day of Object.values(shift.meeting)) day.submitted = false;
      for (const day of Object.values(shift.repaint)) day.submitted = false;
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction("reports", "readwrite");
      tx.objectStore("reports").put({ report, savedAt: "2026-09-28T23:00:00.000Z" }, week);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, HELD);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".save-pill.saved, .save-pill.local", { timeout: 15000 });
  await page.waitForTimeout(1200);
  const popup = await page.locator(".meeting-popup").count();
  const button = await page.getByRole("button", { name: "Go to Next Week" }).count();
  check(
    "stale tablet copy does not reopen sent forms",
    popup === 0 && button > 0,
    `popup=${popup} buttons=${button}`,
  );
  check("stale reload is not stuck loading", !(await pill(page)).includes("Chargement"), await pill(page));
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await installRoutes(page, { hang: true });
  await page.goto(`${BASE}/?at=${encodeURIComponent(AT)}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(16000);
  const text = await page.locator(".save-pill").innerText().catch(() => "");
  const note = await page.locator("body").innerText();
  const stuck = text.includes("Chargement") || note.includes("Chargement / Loading…");
  check("hung server does not leave the screen on Loading", !stuck, text.replace(/\s+/g, " "));
  await page.close();
}

await browser.close();
if (failures.length) {
  console.log("FAILED", failures.join(", "));
  process.exit(1);
}
console.log("all checks passed");
