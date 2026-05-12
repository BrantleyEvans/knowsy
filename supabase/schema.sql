-- Knowsy schema
-- Run in Supabase SQL editor on new projects. For existing projects, see
-- migration_subjects.sql for the v2 (host-picks-subjects) migration.

-- Events: one per paying customer
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  bride_name text not null,
  groom_name text,
  event_type text default 'bachelorette',
  event_date date,
  tone text default 'spicy' check (tone in ('wholesome', 'spicy', 'wild')),
  creator_email text,
  stripe_payment_id text,
  status text default 'collecting' check (status in ('collecting', 'generated', 'played', 'archived')),
  -- v2: host-configured subjects who get board categories
  -- shape: [{ "id": "...", "name": "...", "relationship": "...", "category_count": <int 1-5> }]
  -- sum of category_count must equal 5
  subjects jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  generated_at timestamptz
);

-- Respondents: each gets a unique token-based link
-- role is now optional metadata only (no gating)
create table if not exists respondents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  role text,
  display_name text,
  token uuid not null unique default gen_random_uuid(),
  submitted_at timestamptz,
  created_at timestamptz default now()
);

-- Responses: per-subject answers
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid references respondents(id) on delete cascade,
  -- v2: which subject this answer is about (id from events.subjects[].id)
  subject_id text,
  question_key text not null,
  question_text text,
  answer_text text,
  created_at timestamptz default now()
);

-- Generated games
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade unique,
  token uuid not null unique default gen_random_uuid(),
  game_data jsonb not null,
  game_state jsonb default '{"played_questions": [], "team_scores": {}}'::jsonb,
  generated_at timestamptz default now(),
  prompt_version int default 2
);

create index if not exists respondents_event_id_idx on respondents(event_id);
create index if not exists respondents_token_idx on respondents(token);
create index if not exists responses_respondent_id_idx on responses(respondent_id);
create index if not exists responses_subject_id_idx on responses(subject_id);
create index if not exists games_event_id_idx on games(event_id);
create index if not exists games_token_idx on games(token);

-- MVP: permissive RLS — unguessable UUIDs as the only auth gate.
-- TODO: replace with Supabase Auth + proper policies before public launch.
alter table events enable row level security;
alter table respondents enable row level security;
alter table responses enable row level security;
alter table games enable row level security;

drop policy if exists "anon all events" on events;
drop policy if exists "anon all respondents" on respondents;
drop policy if exists "anon all responses" on responses;
drop policy if exists "anon all games" on games;

create policy "anon all events" on events for all using (true) with check (true);
create policy "anon all respondents" on respondents for all using (true) with check (true);
create policy "anon all responses" on responses for all using (true) with check (true);
create policy "anon all games" on games for all using (true) with check (true);
