-- ============================================================
-- Keshwani Family Tree — Supabase / PostgreSQL Schema + Seed
-- ============================================================
-- Run this entire file once in the Supabase SQL Editor.
-- Idempotent: safe to re-run.
--
-- After running, set these env vars in the app (.env at repo root):
--   VITE_SUPABASE_URL=<your project url>
--   VITE_SUPABASE_ANON_KEY=<your project anon key>
-- ============================================================

-- ------------------------------------------------------------
-- Relationship enum
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'relation_type') then
    create type relation_type as enum ('Son', 'Daughter', 'Brother', 'Sister');
  end if;
end$$;

-- ------------------------------------------------------------
-- members table
-- ------------------------------------------------------------
create table if not exists members (
  id            text primary key,
  name          text not null check (length(trim(name)) > 0),
  relationship  relation_type not null,
  parent_id     text references members(id) on delete cascade,
  generation    int not null check (generation >= 1),
  notes         text not null default '',
  birth         text not null default '',
  death         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint chk_root_must_be_son
    check (parent_id is not null or relationship = 'Son')
);

create index if not exists idx_members_parent_id    on members(parent_id);
create index if not exists idx_members_generation   on members(generation);
create index if not exists idx_members_relationship on members(relationship);

create unique index if not exists uq_members_one_heir_per_parent
  on members(parent_id)
  where relationship in ('Son', 'Daughter') and parent_id is not null;

create unique index if not exists uq_members_single_root
  on members((parent_id is null))
  where parent_id is null;

-- ------------------------------------------------------------
-- contact_messages table (from the Contact Us form)
-- ------------------------------------------------------------
create table if not exists contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(trim(name)) > 0),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message       text not null check (length(trim(message)) > 0),
  created_at    timestamptz not null default now(),
  handled       boolean not null default false
);

create index if not exists idx_contact_messages_created_at on contact_messages(created_at desc);
create index if not exists idx_contact_messages_handled    on contact_messages(handled) where handled = false;

-- ------------------------------------------------------------
-- Auto-derive generation from parent
-- ------------------------------------------------------------
create or replace function set_member_generation()
returns trigger as $$
begin
  if new.parent_id is null then
    new.generation := 1;
  else
    select generation + 1 into new.generation
    from members
    where id = new.parent_id;
    if new.generation is null then
      raise exception 'parent_id % not found', new.parent_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_generation on members;
create trigger trg_set_generation
  before insert or update of parent_id on members
  for each row execute function set_member_generation();

-- ------------------------------------------------------------
-- Auto-update updated_at on row change
-- ------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_updated_at on members;
create trigger trg_touch_updated_at
  before update on members
  for each row execute function touch_updated_at();

-- ------------------------------------------------------------
-- Cascade generation when parent moves
-- ------------------------------------------------------------
create or replace function cascade_generation_update()
returns trigger as $$
begin
  if tg_op = 'UPDATE' and old.generation is distinct from new.generation then
    with recursive descendants as (
      select id, generation from members where parent_id = new.id
      union all
      select m.id, d.generation + 1
      from members m
      join descendants d on m.parent_id = d.id
    )
    update members
    set generation = d.generation
    from descendants d
    where members.id = d.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cascade_generation on members;
create trigger trg_cascade_generation
  after update of generation on members
  for each row execute function cascade_generation_update();

-- ============================================================
-- Helper views
-- ============================================================

create or replace view v_direct_lineage as
with recursive lineage as (
  select id, name, generation, parent_id, 1 as depth
  from members
  where parent_id is null
  union all
  select m.id, m.name, m.generation, m.parent_id, l.depth + 1
  from members m
  join lineage l on m.parent_id = l.id
  where m.relationship in ('Son', 'Daughter')
)
select * from lineage order by depth;

create or replace view v_generation_summary as
select
  generation,
  count(*) filter (where relationship = 'Son')      as sons,
  count(*) filter (where relationship = 'Daughter') as daughters,
  count(*) filter (where relationship = 'Brother')  as brothers,
  count(*) filter (where relationship = 'Sister')   as sisters,
  count(*) as total
from members
group by generation
order by generation;

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function descendants_of(root text)
returns table(id text, name text, generation int, relationship relation_type) as $$
  with recursive tree as (
    select m.id, m.name, m.generation, m.relationship
    from members m
    where m.parent_id = root
    union all
    select m.id, m.name, m.generation, m.relationship
    from members m
    join tree t on m.parent_id = t.id
  )
  select * from tree order by generation;
$$ language sql stable;

create or replace function ancestors_of(leaf text)
returns table(id text, name text, generation int, relationship relation_type) as $$
  with recursive chain as (
    select m.id, m.name, m.generation, m.relationship, m.parent_id
    from members m
    where m.id = leaf
    union all
    select m.id, m.name, m.generation, m.relationship, m.parent_id
    from members m
    join chain c on m.id = c.parent_id
  )
  select id, name, generation, relationship from chain order by generation;
$$ language sql stable;

-- ============================================================
-- Row-Level Security (Supabase)
-- ============================================================
-- The app uses the anon key. Members are world-readable; only the
-- admin role (logged in inside the app) writes. RLS here allows
-- anon writes since admin auth currently lives in the React app;
-- swap to JWT-based policies if you wire Supabase Auth later.

alter table members enable row level security;
alter table contact_messages enable row level security;

drop policy if exists members_anon_read         on members;
drop policy if exists members_anon_write        on members;
drop policy if exists contact_anon_insert       on contact_messages;
drop policy if exists contact_admin_read        on contact_messages;

create policy members_anon_read on members
  for select using (true);

create policy members_anon_write on members
  for all
  using (true)
  with check (true);

-- Anyone can submit a contact message; reads are open too so an
-- admin tool (e.g. Supabase dashboard) can fetch them.
create policy contact_anon_insert on contact_messages
  for insert with check (true);

create policy contact_admin_read on contact_messages
  for select using (true);

-- ============================================================
-- Seed: 22-generation Keshwani lineage (35 members)
-- ============================================================
-- Inserted in generation order so each parent_id exists before
-- its children. The trigger overwrites the generation column,
-- but we still pass a value because the column is NOT NULL.

insert into members (id, name, relationship, parent_id, generation) values
  -- G1
  ('jhanj-dev',     'Jhanj Dev',     'Son',     null,             1),
  -- G2
  ('jagroop',       'Jagroop',       'Son',     'jhanj-dev',      2),
  -- G3
  ('himmat-singh',  'Himmat Singh',  'Son',     'jagroop',        3),
  -- G4
  ('lalu-ram',      'Lalu Ram',      'Son',     'himmat-singh',   4),
  -- G5
  ('radhu',         'Radhu',         'Son',     'lalu-ram',       5),
  -- G6
  ('sheoram',       'Sheoram',       'Son',     'radhu',          6),
  -- G7
  ('ghisa-ram',     'Ghisa Ram',     'Son',     'sheoram',        7),
  -- G8
  ('pat-ram',       'Pat Ram',       'Son',     'ghisa-ram',      8),
  -- G9
  ('kallu-ram',     'Kallu Ram',     'Son',     'pat-ram',        9),
  -- G10
  ('pohkar-ram',    'Pohkar Ram',    'Son',     'kallu-ram',      10),
  -- G11
  ('bhipha-ram',    'Bhipha Ram',    'Son',     'pohkar-ram',     11),
  -- G12
  ('ladhu-ram',     'Ladhu Ram',     'Son',     'bhipha-ram',     12),
  -- G13
  ('mangla-ram',    'Mangla Ram',    'Son',     'ladhu-ram',      13),
  ('bishna-ram',    'Bishna Ram',    'Brother', 'ladhu-ram',      13),
  -- G14
  ('khem-chand-14', 'Khem Chand',    'Son',     'mangla-ram',     14),
  ('harji-ram',     'Harji Ram',     'Brother', 'mangla-ram',     14),
  ('pahalad-ram',   'Pahalad Ram',   'Brother', 'mangla-ram',     14),
  -- G15
  ('bakhtawar',     'Bakhtawar',     'Son',     'khem-chand-14',  15),
  -- G16
  ('tara-chand-16', 'Tara Chand',    'Son',     'bakhtawar',      16),
  -- G17
  ('bala-ram',      'Bala Ram',      'Son',     'tara-chand-16',  17),
  ('mamchand',      'Mamchand',      'Brother', 'tara-chand-16',  17),
  ('sedu-ram',      'Sedu Ram',      'Brother', 'tara-chand-16',  17),
  -- G18
  ('chet-ram',      'Chet Ram',      'Son',     'bala-ram',       18),
  -- G19
  ('kishan-sahey',  'Kishan Sahey',  'Son',     'chet-ram',       19),
  ('shadi-ram',     'Shadi Ram',     'Brother', 'chet-ram',       19),
  -- G20
  ('khemchand-20',  'Khemchand',     'Son',     'kishan-sahey',   20),
  ('paras-ram',     'Paras Ram',     'Brother', 'kishan-sahey',   20),
  ('mohan-singh',   'Mohan Singh',   'Brother', 'kishan-sahey',   20),
  -- G21
  ('tota-ram',      'Tota Ram',      'Son',     'khemchand-20',   21),
  ('prabhu-dayal',  'Prabhu Dayal',  'Brother', 'khemchand-20',   21),
  ('madu-ram',      'Madu Ram',      'Brother', 'khemchand-20',   21),
  ('gopal',         'Gopal',         'Brother', 'khemchand-20',   21),
  -- G22
  ('heera-lal',     'Heera Lal',     'Son',     'tota-ram',       22),
  ('jai-dayal',     'Jai Dayal',     'Brother', 'tota-ram',       22),
  ('parvati-devi',  'Parvati Devi',  'Sister',  'tota-ram',       22)
on conflict (id) do nothing;
