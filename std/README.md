# STD weekly report

Tablet form for the STD department. Day shift and evening shift, Monday to Friday.

## One week

For each shift:

- **SST** — once a week. Monday health and safety meeting and Friday meeting, from `SST&5S.docx`.
- **5S** — once a week. Wednesday cleaning and organization meeting, from the same document.
- Then every day, in this order:
  1. Signature — autonomous maintenance, machines G1, G3, G4, G10, G11
  2. G4 Performance
  3. G4 Faulty
  4. G3 Performance
  5. G3 Faulty
  6. G10 — saw performance, frame counter
  7. G11 — saw log of frame type and quantity

That is 37 forms per shift. The home screen is two menus, day shift and evening shift. **‹** and **›** move between weeks. **Cette semaine / This week** returns to the current week. The open week is saved before the page changes, and a form that was already submitted stays locked. **Envoyer / Submit** locks a form.

## Run

```bash
npm install
npm run dev
```

The dev server reads `paint-line/.env.local` when `std/.env.local` is absent. Production is served with the paint line app:

https://forms.airvector-os.com/std/

Create the table once with `supabase/std_weeks.sql` in the same Supabase project as the paint line. Build with `npm run build` before restarting `AirvectorForms`.
