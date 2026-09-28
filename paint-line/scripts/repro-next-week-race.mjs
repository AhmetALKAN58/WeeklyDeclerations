/**
 * DEBUG: reproduce the last-submit / auto-advance race (App.tsx week hold).
 * Models debounced save (250ms) + setWeekStart when !pendingHold.
 *
 * Usage: node scripts/repro-next-week-race.mjs
 */
function simulate({ autoAdvance, explicitAdvanceAfterMs = null }) {
  const events = [];
  let weekStart = "2026-09-14";
  const calendarWeek = "2026-09-21";
  let report = { weekStart, lastOrderSubmitted: false, version: 1 };
  let persisted = structuredClone(report);
  let skipSave = false;
  let saveTimer = null;
  let loadToken = 0;
  const t0 = Date.now();

  function log(msg, extra = {}) {
    events.push({ t: Date.now() - t0, msg, ...extra });
  }

  function scheduleSave() {
    if (skipSave) {
      log("save-skipped-skipSave");
      return;
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persisted = structuredClone(report);
      log("save-committed", {
        lastOrderSubmitted: persisted.lastOrderSubmitted,
        version: persisted.version,
      });
      saveTimer = null;
    }, 250);
    log("save-scheduled", {
      lastOrderSubmitted: report.lastOrderSubmitted,
      version: report.version,
    });
  }

  function setReport(next) {
    report = next;
    scheduleSave();
    maybeAutoAdvance();
  }

  function setWeekStart(next) {
    log("weekStart-change", { from: weekStart, to: next });
    weekStart = next;
    skipSave = true;
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      log("save-timer-cleared-by-week-change");
    }
    const token = ++loadToken;
    setTimeout(() => {
      if (token !== loadToken) return;
      if (next === calendarWeek) {
        report = { weekStart: next, lastOrderSubmitted: false, version: 0 };
      } else {
        report = structuredClone(persisted);
      }
      skipSave = false;
      log("loaded-week", {
        weekStart: next,
        persistedLast: persisted.lastOrderSubmitted,
      });
      if (next === calendarWeek && !persisted.lastOrderSubmitted) {
        log("previous-still-pending-jump-back");
        setWeekStart("2026-09-14");
      }
    }, 10);
  }

  function maybeAutoAdvance() {
    const pendingHold = !report.lastOrderSubmitted;
    if (autoAdvance && weekStart === "2026-09-14" && !pendingHold) {
      log("auto-advance-triggered");
      setWeekStart(calendarWeek);
    }
  }

  async function flushAndAdvance() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    persisted = structuredClone(report);
    log("explicit-flush-save", {
      lastOrderSubmitted: persisted.lastOrderSubmitted,
    });
    setWeekStart(calendarWeek);
  }

  log("start", { weekStart, lastOrderSubmitted: report.lastOrderSubmitted });
  setReport({ ...report, lastOrderSubmitted: true, version: 2 });
  log("after-submit-in-memory", {
    lastOrderSubmitted: report.lastOrderSubmitted,
  });

  return new Promise((resolve) => {
    const finish = () =>
      resolve({
        autoAdvance,
        finalWeekStart: weekStart,
        inMemorySubmitted: report.lastOrderSubmitted,
        persistedSubmitted: persisted.lastOrderSubmitted,
        events,
      });

    if (explicitAdvanceAfterMs != null) {
      setTimeout(() => {
        void flushAndAdvance().then(() => setTimeout(finish, 50));
      }, explicitAdvanceAfterMs);
    } else {
      setTimeout(finish, 400);
    }
  });
}

const before = await simulate({ autoAdvance: true });
const afterHold = await simulate({ autoAdvance: false });
const afterClick = await simulate({
  autoAdvance: false,
  explicitAdvanceAfterMs: 300,
});

const summary = {
  before: {
    note: "OLD: auto-advance on !pendingHold",
    finalWeekStart: before.finalWeekStart,
    persistedSubmitted: before.persistedSubmitted,
    undone: !before.persistedSubmitted,
    stuckOnPrevious: before.finalWeekStart === "2026-09-14",
  },
  afterHold: {
    note: "NEW: no auto-advance — save completes, stay on week",
    finalWeekStart: afterHold.finalWeekStart,
    persistedSubmitted: afterHold.persistedSubmitted,
    buttonWouldShow: afterHold.persistedSubmitted,
  },
  afterClick: {
    note: "NEW: Go to next week flushes then advances",
    finalWeekStart: afterClick.finalWeekStart,
    persistedSubmitted: afterClick.persistedSubmitted,
    advancedCleanly:
      afterClick.finalWeekStart === "2026-09-21" &&
      afterClick.persistedSubmitted === true,
  },
};

console.log(JSON.stringify({ summary, before, afterHold, afterClick }, null, 2));

if (!summary.before.undone || !summary.before.stuckOnPrevious) {
  console.error("FAIL: expected old race to undo + stay on previous week");
  process.exit(1);
}
if (!summary.afterHold.persistedSubmitted || summary.afterHold.finalWeekStart !== "2026-09-14") {
  console.error("FAIL: expected hold path to persist and stay");
  process.exit(1);
}
if (!summary.afterClick.advancedCleanly) {
  console.error("FAIL: expected explicit advance after flush");
  process.exit(1);
}
console.error("OK: race reproduced; hold+button path keeps last submit and advances cleanly");
