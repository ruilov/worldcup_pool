-- supabase/schema_v1.sql
-- Initial schema for World Cup pool MVP (single or multiple challenges).
-- This script is meant to be re-runnable on an empty database or a fresh project.
-- Run with:
--   supabase db execute --file supabase/schema_v1.sql

------------------------------------------------------------
-- Extensions
------------------------------------------------------------

-- For gen_random_uuid()
create extension if not exists "pgcrypto";

------------------------------------------------------------
-- Enum types
------------------------------------------------------------

-- Type of contract per match
do $$
begin
  if not exists (select 1 from pg_type where typname = 'contract_type') then
    create type contract_type as enum ('winner', 'goal_difference', 'score');
  end if;
end
$$;

-- Status of a match
do $$
begin
  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type match_status as enum ('scheduled', 'in_progress', 'completed', 'void');
  end if;
end
$$;

-- Status of a contract
do $$
begin
  if not exists (select 1 from pg_type where typname = 'contract_status') then
    create type contract_status as enum ('open', 'locked', 'settled', 'void');
  end if;
end
$$;

-- Status of a bet
do $$
begin
  if not exists (select 1 from pg_type where typname = 'bet_status') then
    create type bet_status as enum ('open', 'locked', 'settled', 'cancelled');
  end if;
end
$$;

------------------------------------------------------------
-- Core tables
------------------------------------------------------------

-- Challenges: each is a self-contained game instance
create table if not exists public.challenges (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,               -- short identifier, e.g. "default"
  name             text not null,                      -- display name
  default_language text not null default 'en',         -- e.g. 'en', 'pt', 'es'
  created_at       timestamptz not null default now()
);

-- Players: logical player identity within a challenge
create table if not exists public.players (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  name         text not null,                    -- display name chosen by the user
  created_at   timestamptz not null default now(),
  -- prevent exact name duplicates within the same challenge (soft uniqueness)
  unique (challenge_id, name)
);

-- Player balances: Tackles per player per challenge
-- For now we store current balance directly; history will be in bets & settlements.
create table if not exists public.player_balances (
  player_id        uuid primary key references public.players (id) on delete cascade,
  challenge_id     uuid not null references public.challenges (id) on delete cascade,
  starting_balance integer not null default 1000,  -- starting Tackles
  current_balance  integer not null default 1000,  -- current Tackles
  updated_at       timestamptz not null default now(),
  check (starting_balance >= 0),
  check (current_balance >= 0)
);

-- Matches: real-world games within a challenge
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  team1_name   text not null,                   -- localized/pretty name
  team2_name   text not null,
  kickoff_at   timestamptz,                     -- optional scheduling info
  status       match_status not null default 'scheduled',
  score_team1  integer,                         -- canonical score for contracts (may include ET)
  score_team2  integer,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (team1_name <> team2_name)
);

create index if not exists idx_matches_challenge
  on public.matches (challenge_id);

-- Contracts: per-match markets (Winner / GD / Score)
create table if not exists public.contracts (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null references public.matches (id) on delete cascade,
  type            contract_type not null,                 -- for MVP: mostly 'winner'
  blind           integer not null default 0,             -- free Tackles injected into pot
  status          contract_status not null default 'open',
  winning_outcome text,                                   -- set when settled
  total_pot       integer,                                -- optional snapshot at settlement
  removed_from_game integer,                              -- Tackles removed (rounding or no winners)
  created_at      timestamptz not null default now(),
  locked_at       timestamptz,
  settled_at      timestamptz,
  check (blind >= 0)
);

create index if not exists idx_contracts_match
  on public.contracts (match_id);

create index if not exists idx_contracts_type
  on public.contracts (type);

-- Bets: player stakes on a contract outcome
create table if not exists public.bets (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  outcome     text not null,              -- e.g., "Brazil", "Draw", "1", "2-1"
  stake       integer not null,          -- integer T$ (Tackles)
  status      bet_status not null default 'open',
  created_at  timestamptz not null default now(),
  locked_at   timestamptz,
  settled_at  timestamptz,
  check (stake >= 1)
);

create index if not exists idx_bets_contract
  on public.bets (contract_id);

create index if not exists idx_bets_player
  on public.bets (player_id);

create index if not exists idx_bets_contract_player
  on public.bets (contract_id, player_id);

------------------------------------------------------------
-- Optional: settlement details per contract (audit trail)
------------------------------------------------------------

-- Per-player payouts for a settled contract (optional but useful for debugging)
create table if not exists public.contract_payouts (
  id          bigserial primary key,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  payout      integer not null,     -- integer T$ paid to this player for this contract
  created_at  timestamptz not null default now(),
  check (payout >= 0)
);

create index if not exists idx_contract_payouts_contract
  on public.contract_payouts (contract_id);

create index if not exists idx_contract_payouts_player
  on public.contract_payouts (player_id);

------------------------------------------------------------
-- Seed data (optional but convenient for development)
------------------------------------------------------------

-- Create a default challenge if it does not already exist.
insert into public.challenges (code, name, default_language)
values ('default', 'World Cup 2026 Default Challenge', 'en')
on conflict (code) do nothing;

-- Note: you can create matches, contracts, players, and initial balances
-- either via the Supabase UI, additional SQL seed scripts, or from the app.
-- This file focuses on schema and a single default challenge.
