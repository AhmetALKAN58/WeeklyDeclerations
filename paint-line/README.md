# Paintline Weekly Report / Rapport hebdomadaire

Digital version of the three paper forms used on the paint line, built for a
Lenovo Tab One (8.7", 1340 × 800) but usable on any browser.

## What one week contains

For each of the three shifts (Morning / Evening / Night):

- 5 **Paintline Daily Order List** pages, Monday to Friday
- 1 **Daily Meeting Between the Shifts** page (all five days on one sheet)
- 1 **Repaint and Bad Material** page

That is 7 pages per shift and 21 pages per week. Every label is kept
bilingual (French / English) exactly as on the paper forms.

## Using it

- The week starts on Monday. Use `‹` and `›` to move between weeks, or
  **Cette semaine / This week** to jump back to the current one.
- The home screen lists all 21 pages, grouped by shift, and marks each one
  **Saisi / Filled** or **Vide / Empty**, with a counter such as `3/7`.
- Inside a form, the toolbar switches shift, page type and weekday, so you can
  fill the whole week without going back home.
- Typing is saved automatically to the tablet a moment after you stop; the
  header shows **Enregistré sur la tablette / Saved on tablet**.
- The meeting page has a name field plus a signature area for each shift; sign
  with a finger or stylus, or press **Effacer / Clear** to redo it.
- The repaint page starts with 18 rows; **+ Ajouter des lignes / Add rows**
  adds five more.
- **Imprimer la semaine / Print week** prints all 21 pages: order lists in
  landscape, meeting and repaint pages in portrait, each on its own sheet.
- **Exporter / Export** saves the week as a `.json` file (for backup or to move
  it to another tablet); **Importer / Import** loads such a file back.

## Where the data lives

Each week is one row in the Supabase table `paint_line_weeks` (`week_start`
plus the full report as JSON). The tablet also keeps a copy in IndexedDB so a
dropped connection does not lose the form in progress. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`
before `npm run dev`.

## Running it

Install dependencies once:

```bash
npm install
```

Development server:

```bash
npm run dev
```

Production build and local preview:

```bash
npm run build
npm run preview
```

Both `dev` and `preview` listen on all network interfaces, so the tablet can
open the URL shown as **Network** (for example `http://10.0.1.148:5173/`) while
on the same Wi-Fi.

Production is served on this PC at port 8512 and published through the
Cloudflare tunnel:

https://forms.airvector-os.com/paintline/

To use it as an app on the tablet: open that URL in Chrome, then
**⋮ → Add to Home screen**. The production build registers a service worker, so
after the first load the app also opens without the server being reachable.

## Project layout

```
src/
  App.tsx                     week navigation, shift/page routing, print bundle
  model.ts                    form data types, empty-form builders, date helpers
  storage.ts                  IndexedDB load/save, JSON export/import
  index.css                   screen layout plus the print stylesheet
  components/
    DailyOrderForm.tsx        Paintline Daily Order List
    DailyMeetingForm.tsx      Daily meeting page with signatures
    RepaintForm.tsx           Repaint and bad material table
    SignaturePad.tsx          Canvas signature capture
    Fields.tsx                Shared labelled inputs
```
