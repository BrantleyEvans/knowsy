-- Migration: v1 (role-based questionnaire) → v2 (host-picked subjects + open-ended buckets)
-- Idempotent — safe to run more than once.

-- 1. Add events.subjects (default empty array; we'll backfill below for existing events)
alter table events add column if not exists subjects jsonb not null default '[]'::jsonb;

-- 2. Add responses.subject_id (nullable so existing v1 rows survive; new rows MUST set it)
alter table responses add column if not exists subject_id text;

-- 3. Make respondents.role optional metadata (drop NOT NULL + drop the check constraint)
alter table respondents alter column role drop not null;
alter table respondents drop constraint if exists respondents_role_check;

-- 4. Index subject_id for fast per-subject lookups
create index if not exists responses_subject_id_idx on responses(subject_id);

-- 5. Backfill subjects for any existing event that doesn't have any.
--    Default bachelorette mix: 2 bride / 1 partner / 2 squad. Sums to 5.
update events
set subjects = jsonb_build_array(
  jsonb_build_object('id', 'subj-bride',   'name', bride_name,                        'relationship', 'bride',   'category_count', 2),
  jsonb_build_object('id', 'subj-partner', 'name', coalesce(groom_name, 'The partner'),'relationship', 'partner', 'category_count', 1),
  jsonb_build_object('id', 'subj-squad',   'name', 'The crew',                         'relationship', 'squad',   'category_count', 2)
)
where subjects is null or subjects = '[]'::jsonb;

-- 6. Bump prompt_version on existing games to mark them as legacy (optional)
alter table games alter column prompt_version set default 2;

-- Done. New events created via the API will set subjects themselves.
