import assert from "node:assert/strict";
import {
  emptyReport,
  mergeKeepSubmitted,
  withMeetingDaySubmitted,
  withRepaintDaySubmitted,
} from "../src/model.ts";

const week = "2026-09-21";
const sent = withMeetingDaySubmitted(
  withRepaintDaySubmitted(emptyReport(week), "night", "sunday", "2026-09-28T11:00:00.000Z"),
  "night",
  "sunday",
  "2026-09-28T11:05:00.000Z",
);
sent.shifts.night.meeting.sunday.topics = "handover notes";

const stale = emptyReport(week);
stale.shifts.night.meeting.sunday.topics = "unsaved draft";

const merged = mergeKeepSubmitted(stale, sent, week);
assert.equal(merged.shifts.night.meeting.sunday.submitted, true);
assert.equal(merged.shifts.night.meeting.sunday.topics, "handover notes");
assert.equal(merged.shifts.night.repaint.sunday.submitted, true);
assert.equal(merged.shifts.morning.meeting.monday.submitted, false);

const edited = emptyReport(week);
edited.shifts.morning.meeting.monday.topics = "still typing";
const kept = mergeKeepSubmitted(edited, sent, week);
assert.equal(kept.shifts.morning.meeting.monday.topics, "still typing");
assert.equal(kept.shifts.morning.meeting.monday.submitted, false);
assert.equal(kept.shifts.night.meeting.sunday.submitted, true);

console.log("mergeKeepSubmitted ok");
