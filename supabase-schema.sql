-- ============================================================
-- CareerTrack — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  education text,
  field text,
  experience_years text,
  target_roles text[],
  search_start_date date,
  weekly_hours text,
  weekly_app_target text,
  courses text[],
  onboarded boolean default false,
  created_at timestamptz default now()
);

-- ── APPLICATIONS ──────────────────────────────────────────────
create table if not exists applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company text not null,
  role text not null,
  role_category text default '',
  custom_role_tag text default '',
  department text default '',
  job_link text default '',
  source text default 'Other',
  location text default '',
  work_mode text default 'Remote',
  salary_range text default '',
  date_saved date default current_date,
  date_applied date not null,
  last_status_update date default current_date,
  status text default 'Applied',
  resume_version text,
  cover_letter text default '',
  contact_name text default '',
  contact_email text default '',
  referral boolean default false,
  referral_status text default '',
  priority text default 'Medium',
  follow_up_date text default '',
  interview_date text default '',
  rejection_reason text default '',
  notes text default '',
  outcome_notes text default '',
  confidence_level integer default 50,
  company_type text default 'Startup',
  target_type text default 'Realistic',
  status_history jsonb default '[]',
  created_at timestamptz default now()
);

-- ── JOB DESCRIPTIONS ─────────────────────────────────────────
create table if not exists job_descriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  company text,
  location text,
  work_mode text,
  raw_text text not null,
  salary_range text,
  years_required integer,
  required_skills text[],
  preferred_skills text[],
  tools text[],
  created_at date default current_date
);

-- ── RESUME VERSIONS ───────────────────────────────────────────
create table if not exists resume_versions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  target_audience text,
  skills_emphasized text[],
  role_type text,
  link text,
  resume_text text,
  ats_score integer,
  is_tailored boolean default false,
  source_version_id uuid references resume_versions(id) on delete set null,
  job_description_id uuid references job_descriptions(id) on delete set null,
  created_at date default current_date
);

-- ── TAILORING SESSIONS ────────────────────────────────────────
create table if not exists tailoring_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  original_resume_id uuid references resume_versions(id) on delete set null,
  job_description_id uuid references job_descriptions(id) on delete set null,
  original_text text,
  tailored_text text,
  original_score integer default 0,
  tailored_score integer default 0,
  status text default 'draft' check (status in ('draft', 'applied', 'saved')),
  application_id uuid references applications(id) on delete set null,
  created_at date default current_date
);

-- ── ATS SCORE HISTORY ─────────────────────────────────────────
create table if not exists ats_score_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  resume_version_id uuid references resume_versions(id) on delete cascade not null,
  job_description_id uuid references job_descriptions(id) on delete set null,
  overall_score integer not null,
  category_scores jsonb not null default '[]',
  matched_keywords text[],
  missing_keywords text[],
  scored_at timestamptz default now()
);

-- ── ROADMAP ───────────────────────────────────────────────────
create table if not exists roadmap (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week integer not null,
  title text not null,
  topics text,
  completed boolean default false
);

-- ── QUESTIONS ─────────────────────────────────────────────────
create table if not exists questions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  question text not null,
  difficulty text default 'Medium',
  status text default 'Not Started',
  notes text
);

-- ============================================================
-- Row Level Security (RLS) — users only see their own data
-- ============================================================

alter table profiles           enable row level security;
alter table applications       enable row level security;
alter table resume_versions    enable row level security;
alter table job_descriptions   enable row level security;
alter table tailoring_sessions enable row level security;
alter table ats_score_history  enable row level security;
alter table roadmap            enable row level security;
alter table questions          enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Applications policies
drop policy if exists "Users manage own applications" on applications;
create policy "Users manage own applications"
  on applications for all using (auth.uid() = user_id);

-- Resume versions policies
drop policy if exists "Users manage own resume versions" on resume_versions;
create policy "Users manage own resume versions"
  on resume_versions for all using (auth.uid() = user_id);

-- Job descriptions policies
drop policy if exists "Users manage own job descriptions" on job_descriptions;
create policy "Users manage own job descriptions"
  on job_descriptions for all using (auth.uid() = user_id);

-- Tailoring sessions policies
drop policy if exists "Users manage own tailoring sessions" on tailoring_sessions;
create policy "Users manage own tailoring sessions"
  on tailoring_sessions for all using (auth.uid() = user_id);

-- ATS score history policies
drop policy if exists "Users manage own ats scores" on ats_score_history;
create policy "Users manage own ats scores"
  on ats_score_history for all using (auth.uid() = user_id);

-- Roadmap policies
drop policy if exists "Users manage own roadmap" on roadmap;
create policy "Users manage own roadmap"
  on roadmap for all using (auth.uid() = user_id);

-- Questions policies
drop policy if exists "Users manage own questions" on questions;
create policy "Users manage own questions"
  on questions for all using (auth.uid() = user_id);

-- ============================================================
-- Done! Your database is ready.
-- ============================================================
