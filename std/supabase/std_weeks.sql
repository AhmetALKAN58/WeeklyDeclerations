-- STD weekly tablet. Same shape as paint_line_weeks.
-- Run once in the Supabase project used by the paint line.

create table if not exists public.std_weeks (
  week_start date primary key,
  report jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_std_weeks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists std_weeks_set_updated_at on public.std_weeks;
create trigger std_weeks_set_updated_at
before insert or update on public.std_weeks
for each row execute function public.set_std_weeks_updated_at();

alter table public.std_weeks enable row level security;

drop policy if exists "tablet read std weeks" on public.std_weeks;
drop policy if exists "tablet write std weeks" on public.std_weeks;
drop policy if exists "tablet update std weeks" on public.std_weeks;

create policy "tablet read std weeks"
on public.std_weeks
for select
to anon, authenticated
using (true);

create policy "tablet write std weeks"
on public.std_weeks
for insert
to anon, authenticated
with check (true);

create policy "tablet update std weeks"
on public.std_weeks
for update
to anon, authenticated
using (true)
with check (true);

grant select, insert, update on public.std_weeks to anon, authenticated;

revoke all on function public.set_std_weeks_updated_at() from public, anon, authenticated;
