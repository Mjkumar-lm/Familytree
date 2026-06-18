-- ============================================================
-- Keshwani Family Tree — Supabase / PostgreSQL Schema
-- ============================================================
-- Single table `members` stores the entire lineage. Generation
-- depth is auto-derived from parent_id. IDs are text to match
-- the slugged ids the app generates (see src/utils/tree.ts).
-- ============================================================

-- ------------------------------------------------------------
-- Relationship enum (matches src/types.ts)
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

  -- Root member (parent_id null) must be a Son (the trunk root).
  constraint chk_root_must_be_son
    check (parent_id is not null or relationship = 'Son')
);

create index if not exists idx_members_parent_id    on members(parent_id);
create index if not exists idx_members_generation   on members(generation);
create index if not exists idx_members_relationship on members(relationship);

-- One direct heir (Son or Daughter) per parent. Brothers/Sisters unlimited.
create unique index if not exists uq_members_one_heir_per_parent
  on members(parent_id)
  where relationship in ('Son', 'Daughter') and parent_id is not null;

-- Only one root member.
create unique index if not exists uq_members_single_root
  on members((parent_id is null))
  where parent_id is null;

-- ------------------------------------------------------------
-- Auto-derive generation from parent (DB is source of truth)
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

-- Direct lineage (trunk) — Son/Daughter chain from root downward
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

-- Counts per generation
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

-- All descendants of a member (used for delete preview)
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

-- Ancestors from root → given member
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
-- Supabase enables RLS by default. Pick ONE of the two policy
-- sets below depending on whether the app uses Supabase Auth.
--
-- Option A — Public / no auth (single-owner site, anon access)
-- ------------------------------------------------------------
alter table members enable row level security;

drop policy if exists members_anon_read   on members;
drop policy if exists members_anon_write  on members;

create policy members_anon_read on members
  for select using (true);

create policy members_anon_write on members
  for all
  using (true)
  with check (true);

-- Option B — Per-user (uncomment, add user_id column first):
-- ------------------------------------------------------------
-- alter table members add column if not exists user_id uuid
--   default auth.uid() references auth.users(id) on delete cascade;
-- create index if not exists idx_members_user_id on members(user_id);
--
-- drop policy if exists members_owner_read  on members;
-- drop policy if exists members_owner_write on members;
--
-- create policy members_owner_read on members
--   for select using (auth.uid() = user_id);
--
-- create policy members_owner_write on members
--   for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);
